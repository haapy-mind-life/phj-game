import { admittedByPresence, type PlayerMessage } from "./family-room.ts";
import type { FamilyTransport } from "./family-transport.ts";

export type RealtimeHandlers = { onFull: () => void; onPeople: (count: number) => void };

/** Cross-device transport over Lovable Cloud realtime (broadcast + presence, nothing stored). */
export async function createRealtimeTransport(
  code: string,
  selfId: string,
  handlers: RealtimeHandlers,
): Promise<FamilyTransport | null> {
  if (typeof window === "undefined" || !import.meta.env.VITE_SUPABASE_URL) return null;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const joinedAt = Date.now();
    const channel = supabase.channel(`family:${code}`, {
      config: { broadcast: { self: false }, presence: { key: selfId } },
    });
    let cb: (raw: unknown) => void = () => {};
    channel.on("broadcast", { event: "pos" }, ({ payload }) => cb(payload));
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ joinedAt: number }>();
      const members = Object.entries(state).map(([id, metas]) => ({
        id,
        joinedAt: Number(metas[0]?.joinedAt ?? 0),
      }));
      handlers.onPeople(Math.min(members.length, 4));
      if (members.some((m) => m.id === selfId) && !admittedByPresence(members, selfId))
        handlers.onFull();
    });
    const ok = await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 6000);
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          await channel.track({ joinedAt });
          resolve(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(timer);
          resolve(false);
        }
      });
    });
    if (!ok) {
      void supabase.removeChannel(channel);
      return null;
    }
    return {
      send: (msg: PlayerMessage) =>
        void channel.send({ type: "broadcast", event: "pos", payload: msg }),
      onMessage: (fn) => {
        cb = fn;
      },
      close: () => void supabase.removeChannel(channel),
    };
  } catch {
    return null;
  }
}
