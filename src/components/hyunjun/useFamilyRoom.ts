import { useCallback, useEffect, useRef, useState } from "react";
import {
  SEND_INTERVAL_MS,
  applyMessage,
  makeRoomCode,
  normalizeRoomCode,
  parsePlayerMessage,
  pruneStale,
  shouldSend,
  type Emote,
  type FamilyRegion,
  type Nickname,
  type PlayerMessage,
  type RemoteMap,
} from "@/game/family-room";
import { createBroadcastTransport, type FamilyTransport } from "@/game/family-transport";
import type { Outfit } from "@/lib/world-model";

type Self = {
  region: FamilyRegion;
  x: number;
  y: number;
  facing: 1 | -1;
  outfit: Outfit;
  moving: boolean;
};
const newId = () => {
  try {
    return "p-" + globalThis.crypto.randomUUID();
  } catch {
    return "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
};

export function useFamilyRoom(self: Self) {
  const [code, setCode] = useState<string | null>(null);
  const [nick, setNick] = useState<Nickname>("현준");
  const [remotes, setRemotes] = useState<RemoteMap>({});
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const id = useRef(newId());
  const latest = useRef(self);
  latest.current = self;
  const nickRef = useRef(nick);
  nickRef.current = nick;
  const transport = useRef<FamilyTransport | null>(null);
  const emote = useRef<Emote | null>(null);
  const last = useRef<{ msg: PlayerMessage | null; at: number }>({ msg: null, at: 0 });

  const leave = useCallback(() => {
    transport.current?.close();
    transport.current = null;
    last.current = { msg: null, at: 0 };
    setCode(null);
    setRemotes({});
  }, []);
  const join = useCallback(
    (input: string) => {
      const clean = normalizeRoomCode(input);
      if (!clean) {
        setError("방 코드는 6자리예요.");
        return false;
      }
      leave();
      const t = createBroadcastTransport(clean);
      if (!t) {
        setError("이 기기에서는 가족방을 쓸 수 없어요.");
        return false;
      }
      t.onMessage((raw) => {
        const msg = parsePlayerMessage(raw);
        if (msg) setRemotes((r) => applyMessage(r, msg, id.current, Date.now()));
      });
      transport.current = t;
      setError(null);
      setCode(clean);
      return true;
    },
    [leave],
  );
  const create = useCallback(() => join(makeRoomCode()), [join]);
  const sendEmote = useCallback((e: Emote) => {
    emote.current = e;
  }, []);

  useEffect(() => {
    if (!code) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const s = latest.current;
      const next: PlayerMessage = {
        id: id.current,
        nick: nickRef.current,
        region: s.region,
        x: Math.round(s.x),
        y: Math.round(s.y),
        facing: s.facing,
        outfit: s.outfit,
        moving: s.moving,
        emote: emote.current,
        t: now,
      };
      if (shouldSend(last.current.msg, next, now, last.current.at)) {
        transport.current?.send(next);
        last.current = { msg: next, at: now };
        emote.current = null;
      }
      setRemotes((r) => pruneStale(r, now));
      setTick((n) => n + 1);
    }, SEND_INTERVAL_MS / 2);
    return () => window.clearInterval(timer);
  }, [code]);
  useEffect(() => leave, [leave]);

  return { code, nick, setNick, remotes, error, create, join, leave, sendEmote, tick };
}
