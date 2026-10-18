import type { PlayerMessage } from "./family-room.ts";

export type FamilyTransport = {
  send: (msg: PlayerMessage) => void;
  onMessage: (cb: (raw: unknown) => void) => void;
  close: () => void;
};

/** Same-browser transport (tabs/windows on one device). Needs no server; used for local testing. */
export function createBroadcastTransport(code: string): FamilyTransport | null {
  if (typeof BroadcastChannel === "undefined") return null;
  const channel = new BroadcastChannel(`hj-family-${code}`);
  return {
    send: (msg) => channel.postMessage(msg),
    onMessage: (cb) => {
      channel.onmessage = (e) => cb(e.data);
    },
    close: () => channel.close(),
  };
}
