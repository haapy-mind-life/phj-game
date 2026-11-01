import { useCallback, useEffect, useRef, useState } from "react";
import {
  SEND_INTERVAL_MS,
  applyMessage,
  parsePlayerMessage,
  pruneStale,
  shouldSend,
  type Emote,
  type FamilyRegion,
  type PlayerMessage,
  type RemoteMap,
} from "@/game/family/family-room";
import {
  createBroadcastTransport,
  type FamilyTransport,
  type FamilyConnectionStatus,
} from "@/game/family/family-transport";
import { createSupabaseTransport } from "@/game/family/supabase-transport";
import { FAMILY_SPACE_CODE } from "@/game/family/family-config";
import { familyClient } from "@/lib/family-supabase";
import { wrapPoint } from "@/game/world/world-space";
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
  const [participating, setParticipating] = useState(false),
    [remotes, setRemotes] = useState<RemoteMap>({});
  const [error, setError] = useState<string | null>(null),
    [status, setStatus] = useState<FamilyConnectionStatus>("disconnected");
  const [id] = useState(newId);
  const latest = useRef(self);
  latest.current = self;
  const nick = account.previewNickname,
    setNick = account.setPreviewNickname;
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
    setParticipating(false);
    setRemotes({});
    setStatus("disconnected");
    setError(null);
  }, []);
  const join = useCallback(() => {
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
        ? createSupabaseTransport(familyClient, account.membership.familyId, id)
        : createBroadcastTransport(FAMILY_SPACE_CODE, id);
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
    setParticipating(true);
    return true;
  }, [account.mode, account.membership, id, leave]);
  const sendEmote = useCallback((value: Emote) => {
    emote.current = { value, until: Date.now() + 1800 };
  }, []);
  useEffect(() => {
    if (!participating) return;
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
    }, SEND_INTERVAL_MS / 2);
    return () => clearInterval(timer);
  }, [participating, id]);
  useEffect(() => {
    const eligible =
      account.mode === "local" || (account.mode === "supabase" && account.status === "ready");
    if (eligible) join();
    else leave();
    // Navigation does not unmount React before the browser closes its sockets.
    // Explicitly leave so a refresh does not keep an old Presence entry around.
    const resume = (event: PageTransitionEvent) => {
      if (event.persisted && eligible) join();
    };
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", resume);
    return () => {
      window.removeEventListener("pagehide", leave);
      window.removeEventListener("pageshow", resume);
      leave();
    };
  }, [account.mode, account.status, join, leave]);
  useEffect(() => {
    if (!participating || status !== "disconnected") return;
    const timer = setTimeout(join, 2000);
    return () => clearTimeout(timer);
  }, [participating, status, join]);
  return {
    account,
    participating,
    nick: account.membership?.nickname ?? nick,
    setNick,
    remotes,
    error,
    status,
    leave,
    sendEmote,
    reconnect: join,
  };
}
