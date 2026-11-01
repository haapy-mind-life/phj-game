import type { SupabaseClient } from "@supabase/supabase-js";
import { familySpaceTopic } from "./family-config.ts";
import { MAX_ROOM_PLAYERS, parsePlayerMessage, type PlayerMessage } from "./family-room.ts";
import type { FamilyTransport, FamilyConnectionStatus } from "./family-transport.ts";
export function presenceIds(state: unknown): string[] {
  if (!state || typeof state !== "object") return [];
  return [
    ...new Set(
      Object.values(state).flatMap((list) =>
        Array.isArray(list)
          ? list.flatMap((m) =>
              m &&
              typeof m === "object" &&
              typeof m.id === "string" &&
              /^[A-Za-z0-9-]{4,40}$/.test(m.id)
                ? [m.id]
                : [],
            )
          : [],
      ),
    ),
  ].sort();
}
/** Broadcast contains ephemeral positions; Presence is slow-changing room membership only. */
export function createSupabaseTransport(
  client: Pick<SupabaseClient, "channel" | "removeChannel">,
  familyId: string,
  selfId: string,
): FamilyTransport {
  const channel = client.channel(familySpaceTopic(familyId), {
    config: { private: true, broadcast: { self: false, ack: true }, presence: { key: selfId } },
  });
  let closed = false,
    subscribed = false,
    admitted = false;
  let latest: PlayerMessage | null = null;
  let status: FamilyConnectionStatus = "connecting",
    peers: string[] = [];
  let receive: (raw: unknown) => void = () => {},
    report: (s: FamilyConnectionStatus) => void = () => {},
    onPeers: (ids: string[]) => void = () => {};
  function setStatus(next: FamilyConnectionStatus) {
    if (closed || status === next) return;
    status = next;
    report(next);
  }
  function publishLatest() {
    if (closed || !subscribed || !admitted || !latest) return;
    void channel
      .send({ type: "broadcast", event: "player", payload: latest })
      .then((result) => {
        if (closed) return;
        if (result === "ok") setStatus("connected");
        else setStatus("reconnecting");
      })
      .catch(() => setStatus("reconnecting"));
  }
  function dispose() {
    if (closed) return;
    closed = true;
    subscribed = false;
    admitted = false;
    void client.removeChannel(channel).catch(() => {});
  }
  channel.on("broadcast", { event: "player" }, ({ payload }) => {
    if (!closed && admitted && parsePlayerMessage(payload)) receive(payload);
  });
  channel.on("broadcast", { event: "request-state" }, () => publishLatest());
  channel.on("presence", { event: "sync" }, () => {
    if (closed || !subscribed) return;
    const ids = presenceIds(channel.presenceState());
    const others = ids.filter((id) => id !== selfId);
    if (!admitted && ids.includes(selfId)) {
      if (others.length >= MAX_ROOM_PLAYERS) {
        setStatus("full");
        dispose();
        return;
      }
      admitted = true;
      setStatus("connected");
      publishLatest();
      void channel.send({ type: "broadcast", event: "request-state", payload: {} }).catch(() => {});
    }
    if (!admitted) return;
    const changed = others.join(",") !== peers.join(",");
    peers = others;
    onPeers(peers);
    if (changed) publishLatest();
  });
  // Subscribe after callers register their callbacks; SDK owns reconnect/backoff and token refresh.
  queueMicrotask(() => {
    if (closed) return;
    channel.subscribe((state) => {
      if (closed) return;
      if (state === "SUBSCRIBED") {
        subscribed = true;
        admitted = false;
        void channel
          .track({ id: selfId })
          .then((result) => {
            if (result !== "ok") setStatus("reconnecting");
          })
          .catch(() => setStatus("reconnecting"));
      } else {
        subscribed = false;
        admitted = false;
        setStatus(state === "CLOSED" ? "disconnected" : "reconnecting");
      }
    });
  });
  return {
    send: (msg) => {
      latest = msg;
      if (closed || !subscribed || !admitted) return false;
      publishLatest();
      return true;
    },
    onMessage: (cb) => {
      receive = cb;
    },
    onStatus: (cb) => {
      report = cb;
      cb(status);
    },
    onPeers: (cb) => {
      onPeers = cb;
      cb(peers);
    },
    close: dispose,
  };
}
