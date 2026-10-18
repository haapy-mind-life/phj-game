import type { Outfit } from "../lib/world-model.ts";

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_ROOM_PLAYERS = 4;
export const SEND_INTERVAL_MS = 200;
export const STALE_AFTER_MS = 5000;
export const HEARTBEAT_MS = 2000;
export const MAP_LIMIT = { x: 8000, y: 4000 } as const;

export const NICKNAMES = ["현준", "아빠", "엄마", "누나"] as const;
export type Nickname = (typeof NICKNAMES)[number];
export const EMOTES = ["👋", "😀", "❤️", "⭐", "🎃", "🍕"] as const;
export type Emote = (typeof EMOTES)[number];
export const REGIONS = ["village", "coast", "mansion", "deep-sea"] as const;
export type FamilyRegion = (typeof REGIONS)[number];
const OUTFITS = ["mint", "peach", "lavender"] as const;

export type PlayerMessage = {
  id: string;
  nick: Nickname;
  region: FamilyRegion;
  x: number;
  y: number;
  facing: 1 | -1;
  outfit: Outfit;
  moving: boolean;
  emote: Emote | null;
  t: number;
};

export function makeRoomCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++)
    code += ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length) % 32];
  return code;
}
export function normalizeRoomCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  return code.length === ROOM_CODE_LENGTH && [...code].every((c) => ROOM_CODE_ALPHABET.includes(c))
    ? code
    : null;
}

const has = <T extends readonly unknown[]>(list: T, v: unknown): v is T[number] =>
  list.includes(v as T[number]);
const num = (v: unknown, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? v : null;

/** Accepts only numbers and listed values; anything else is dropped (children's safety). */
export function parsePlayerMessage(input: unknown): PlayerMessage | null {
  if (input === null || typeof input !== "object") return null;
  const m = input as Record<string, unknown>;
  const x = num(m["x"], MAP_LIMIT.x);
  const y = num(m["y"], MAP_LIMIT.y);
  const t = num(m["t"], 1e15);
  if (
    typeof m["id"] !== "string" ||
    !/^[A-Za-z0-9-]{4,40}$/.test(m["id"]) ||
    !has(NICKNAMES, m["nick"]) ||
    !has(REGIONS, m["region"]) ||
    !has(OUTFITS, m["outfit"]) ||
    (m["facing"] !== 1 && m["facing"] !== -1) ||
    typeof m["moving"] !== "boolean" ||
    (m["emote"] !== null && m["emote"] !== undefined && !has(EMOTES, m["emote"])) ||
    x === null ||
    y === null ||
    t === null
  )
    return null;
  return {
    id: m["id"],
    nick: m["nick"],
    region: m["region"],
    x,
    y,
    facing: m["facing"],
    outfit: m["outfit"],
    moving: m["moving"],
    emote: (m["emote"] as Emote | null | undefined) ?? null,
    t,
  };
}

/** Send at most every SEND_INTERVAL_MS, skip when nothing changed (emote always goes). */
export function shouldSend(
  prev: PlayerMessage | null,
  next: PlayerMessage,
  now: number,
  lastSentAt: number,
): boolean {
  if (!prev) return true;
  if (next.emote && next.emote !== prev.emote) return now - lastSentAt >= 0;
  if (now - lastSentAt < SEND_INTERVAL_MS) return false;
  if (now - lastSentAt >= HEARTBEAT_MS) return true; // keep idle players from expiring
  return (
    prev.x !== next.x ||
    prev.y !== next.y ||
    prev.region !== next.region ||
    prev.moving !== next.moving ||
    prev.outfit !== next.outfit ||
    prev.facing !== next.facing
  );
}

export type RemotePlayer = { msg: PlayerMessage; from: { x: number; y: number }; seenAt: number };
export type RemoteMap = Record<string, RemotePlayer>;

/** Merge a message; ignores out-of-order packets and our own id. Caps at MAX_ROOM_PLAYERS-1 others. */
export function applyMessage(
  remotes: RemoteMap,
  msg: PlayerMessage,
  selfId: string,
  now: number,
): RemoteMap {
  if (msg.id === selfId) return remotes;
  const old = remotes[msg.id];
  if (old && msg.t < old.msg.t) return remotes;
  if (!old && Object.keys(remotes).length >= MAX_ROOM_PLAYERS - 1) return remotes;
  return {
    ...remotes,
    [msg.id]: { msg, from: old ? { x: old.msg.x, y: old.msg.y } : msg, seenAt: now },
  };
}
export function pruneStale(remotes: RemoteMap, now: number): RemoteMap {
  const kept = Object.entries(remotes).filter(([, r]) => now - r.seenAt <= STALE_AFTER_MS);
  return kept.length === Object.keys(remotes).length ? remotes : Object.fromEntries(kept);
}
/** Position to draw: glide from the previous point toward the latest over one send interval. */
export function drawPosition(r: RemotePlayer, now: number) {
  const k = Math.min(1, Math.max(0, (now - r.seenAt) / SEND_INTERVAL_MS));
  return { x: r.from.x + (r.msg.x - r.from.x) * k, y: r.from.y + (r.msg.y - r.from.y) * k };
}
export const visibleRemotes = (remotes: RemoteMap, region: FamilyRegion) =>
  Object.values(remotes).filter((r) => r.msg.region === region);

/** Presence: a newcomer may stay only if they are among the first MAX_ROOM_PLAYERS by join time. */
export function admittedByPresence(
  members: { id: string; joinedAt: number }[],
  selfId: string,
): boolean {
  const order = [...members].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
  const idx = order.findIndex((m) => m.id === selfId);
  return idx >= 0 && idx < MAX_ROOM_PLAYERS;
}
