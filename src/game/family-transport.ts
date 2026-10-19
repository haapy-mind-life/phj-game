import { parsePlayerMessage, type PlayerMessage } from "./family-room.ts";
export type FamilyConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "disconnected" | "full";
export type FamilyTransport = {
  send: (msg: PlayerMessage) => boolean;
  onMessage: (cb: (raw: unknown) => void) => void;
  onStatus: (cb: (status: FamilyConnectionStatus) => void) => void;
  onPeers?: (cb: (ids: string[]) => void) => void;
  onLeave?: (cb: (id: string) => void) => void;
  close: () => void;
};
/** Explicit same-device preview; never used as an online error fallback. */
export function createBroadcastTransport(code: string, selfId?: string): FamilyTransport | null {
  if (typeof BroadcastChannel === "undefined") return null;
  const channel = new BroadcastChannel(`hj-family-${code}`);
  let latest: PlayerMessage | null = null,
    closed = false;
  let receive: (raw: unknown) => void = () => {};
  let leave: (id: string) => void = () => {};
  channel.onmessage = (e) => {
    if (closed) return;
    const raw = e.data;
    if (raw?.type === "request-state") {
      if (latest) channel.postMessage(latest);
      return;
    }
    if (raw?.type === "left" && typeof raw.id === "string") {
      leave(raw.id);
      return;
    }
    if (parsePlayerMessage(raw)) receive(raw);
  };
  channel.postMessage({ type: "request-state" });
  return {
    send: (msg) => {
      if (closed) return false;
      latest = msg;
      channel.postMessage(msg);
      return true;
    },
    onMessage: (cb) => {
      receive = cb;
    },
    onStatus: (cb) => cb("connected"),
    onLeave: (cb) => {
      leave = cb;
    },
    close: () => {
      if (closed) return;
      closed = true;
      if (selfId) channel.postMessage({ type: "left", id: selfId });
      channel.close();
    },
  };
}
