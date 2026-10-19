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
import {
  createBroadcastTransport,
  type FamilyTransport,
  type FamilyConnectionStatus,
} from "@/game/family-transport";
import { createSupabaseTransport } from "@/game/supabase-transport";
import { familyClient } from "@/lib/family-supabase";
import { wrapPoint } from "@/game/world-space";
import { useFamilyAccount } from "./useFamilyAccount";
import type { Outfit } from "@/lib/world-model";
type Self = {
  region: FamilyRegion;
  x: number;
  y: number;
  facing: 1 | -1;
  outfit: Outfit;
  moving: boolean;
  active: boolean;
};
const newId = () => {
  if (globalThis.crypto?.randomUUID) return "p-" + globalThis.crypto.randomUUID();
  return "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
};
export function useFamilyRoom(self: Self) {
  const account = useFamilyAccount();
  const [code, setCode] = useState<string | null>(null),
    [nick, setNick] = useState<Nickname>("현준"),
    [remotes, setRemotes] = useState<RemoteMap>({});
  const [error, setError] = useState<string | null>(null),
    [tick, setTick] = useState(0),
    [status, setStatus] = useState<FamilyConnectionStatus>("disconnected");
  const [id] = useState(newId);
  const latest = useRef(self);
  latest.current = self;
  const nickRef = useRef(nick);
  nickRef.current = account.membership?.nickname ?? nick;
  const transport = useRef<FamilyTransport | null>(null),
    sequence = useRef(0);
  const peers = useRef<string[] | null>(null);
  const emote = useRef<{ value: Emote; until: number } | null>(null);
  const last = useRef<{ msg: PlayerMessage | null; at: number }>({ msg: null, at: 0 });
  const leave = useCallback(() => {
    transport.current?.close();
    transport.current = null;
    last.current = { msg: null, at: 0 };
    peers.current = null;
    emote.current = null;
    setCode(null);
    setRemotes({});
    setStatus("disconnected");
    setError(null);
  }, []);
  const join = useCallback(
    (input: string) => {
      const clean = normalizeRoomCode(input);
      if (!clean) {
        setError("방 코드는 6자리예요.");
        return false;
      }
      if (account.mode === "invalid") {
        setError("가족방 설정을 부모님이 확인해 주세요.");
        return false;
      }
      if (account.mode === "supabase" && (!account.membership || !familyClient)) {
        setError("부모님이 가족 계정으로 로그인해 주세요.");
        return false;
      }
      leave();
      setStatus("connecting");
      const t =
        account.mode === "supabase" && familyClient && account.membership
          ? createSupabaseTransport(familyClient, account.membership.familyId, clean, id)
          : createBroadcastTransport(clean, id);
      if (!t) {
        setError("이 기기에서는 가족방을 쓸 수 없어요.");
        setStatus("disconnected");
        return false;
      }
      transport.current = t;
      t.onMessage((raw) => {
        if (transport.current !== t) return;
        const msg = parsePlayerMessage(raw);
        if (msg && (!peers.current || peers.current.includes(msg.id)))
          setRemotes((r) => applyMessage(r, msg, id, Date.now()));
      });
      t.onStatus((s) => {
        if (transport.current !== t) return;
        setStatus(s);
        if (s === "full") setError("가족방에 네 명이 있어요. 창을 하나 닫고 다시 들어가 주세요.");
        else if (s === "connected") setError(null);
      });
      t.onPeers?.((ids) => {
        if (transport.current !== t) return;
        peers.current = ids;
        setRemotes((r) =>
          Object.fromEntries(Object.entries(r).filter(([peer]) => ids.includes(peer))),
        );
      });
      t.onLeave?.((peer) => {
        if (transport.current !== t) return;
        setRemotes((r) => Object.fromEntries(Object.entries(r).filter(([key]) => key !== peer)));
      });
      setCode(clean);
      return true;
    },
    [account.mode, account.membership, id, leave],
  );
  const create = useCallback(() => {
    try {
      return join(makeRoomCode());
    } catch {
      setError("이 기기에서는 방 코드를 만들지 못했어요.");
      return false;
    }
  }, [join]);
  const sendEmote = useCallback((value: Emote) => {
    emote.current = { value, until: Date.now() + 1800 };
  }, []);
  useEffect(() => {
    if (!code) return;
    const timer = setInterval(() => {
      const now = Date.now(),
        s = latest.current;
      const position =
        s.region === "village"
          ? wrapPoint({ x: Math.round(s.x), y: Math.round(s.y) })
          : { x: Math.round(s.x), y: Math.round(s.y) };
      const next: PlayerMessage = {
        id,
        nick: nickRef.current,
        region: s.region,
        ...position,
        facing: s.facing,
        outfit: s.outfit,
        moving: s.moving && s.active,
        active: s.active,
        emote: emote.current && emote.current.until > now ? emote.current.value : null,
        t: sequence.current + 1,
      };
      if (
        shouldSend(last.current.msg, next, now, last.current.at) &&
        transport.current?.send(next)
      ) {
        sequence.current = next.t;
        last.current = { msg: next, at: now };
      }
      setRemotes((r) => pruneStale(r, now));
      setTick((n) => n + 1);
    }, SEND_INTERVAL_MS / 2);
    return () => clearInterval(timer);
  }, [code, id]);
  useEffect(() => {
    if (account.mode === "supabase" && account.status !== "ready") leave();
  }, [account.mode, account.status, leave]);
  useEffect(() => leave, [leave]);
  return {
    account,
    code,
    nick: account.membership?.nickname ?? nick,
    setNick,
    remotes,
    error,
    status,
    create,
    join,
    leave,
    sendEmote,
    tick,
    reconnect: () => code && join(code),
  };
}
