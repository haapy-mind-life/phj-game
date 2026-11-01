import { TOWN_BUILDINGS } from "../world/building-interiors.ts";
import { WORLD_SIZE, worldDelta, wrapPoint } from "../world/world-space.ts";
import { OUTFITS as SHOP_OUTFITS, RESTAURANTS, RESTAURANT_ROOM } from "../world/world-content.ts";
import { LIFE_MAPS } from "../world/life-world.ts";
import type { Outfit } from "../../lib/world-model.ts";

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_ROOM_PLAYERS = 4;
export const SEND_INTERVAL_MS = 200;
export const HEARTBEAT_MS = 2000;
export const STALE_AFTER_MS = 15000;
export const MAP_LIMIT = { x: WORLD_SIZE.width, y: WORLD_SIZE.height } as const;

export const NICKNAMES = ["현준", "아빠", "엄마", "누나"] as const;
export type Nickname = (typeof NICKNAMES)[number];
export const EMOTES = ["👋", "😀", "❤️", "⭐", "🎃", "🍕"] as const;
export type Emote = (typeof EMOTES)[number];
// Each restaurant interior is its own region so family members inside the same one see each other.
export const RESTAURANT_REGIONS = RESTAURANTS.map((r) => `restaurant-${r.id}` as const);
export const BUILDING_REGIONS = TOWN_BUILDINGS.map((b) => `building-${b.id}` as const);
export const buildingRegion = (id: string): FamilyRegion => `building-${id}`;
export const REGIONS = [
  "village",
  "coast",
  "mansion",
  "deep-sea",
  ...RESTAURANT_REGIONS,
  ...BUILDING_REGIONS,
] as const;
export type FamilyRegion = (typeof REGIONS)[number];
export const restaurantRegion = (id: (typeof RESTAURANTS)[number]["id"]): FamilyRegion =>
  `restaurant-${id}`;
const regionLimits = (region: FamilyRegion) =>
  region === "village"
    ? WORLD_SIZE
    : region === "coast" || region === "mansion" || region === "deep-sea"
      ? LIFE_MAPS[region]
      : RESTAURANT_ROOM;
const OUTFITS = ["mint", "peach", "lavender", ...SHOP_OUTFITS.map((o) => o.id)] as const;

export type PlayerMessage = {
  id: string;
  nick: Nickname;
  region: FamilyRegion;
  x: number;
  y: number;
  facing: 1 | -1;
  outfit: Outfit;
  moving: boolean;
  active?: boolean;
  emote: Emote | null;
  t: number;
};

export function makeRoomCode(random?: () => number): string {
  const bytes = random ? null : globalThis.crypto.getRandomValues(new Uint8Array(ROOM_CODE_LENGTH));
  return Array.from(
    { length: ROOM_CODE_LENGTH },
    (_, i) =>
      ROOM_CODE_ALPHABET[
        bytes
          ? bytes[i]! & 31
          : Math.min(31, Math.max(0, Math.floor(random!() * ROOM_CODE_ALPHABET.length)))
      ],
  ).join("");
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
  const region = m["region"];
  const limits = has(REGIONS, region) ? regionLimits(region) : WORLD_SIZE;
  const x = num(m["x"], limits.width);
  const y = num(m["y"], limits.height);
  const t = num(m["t"], 1e15);
  if (
    typeof m["id"] !== "string" ||
    !/^[A-Za-z0-9-]{4,40}$/.test(m["id"]) ||
    !has(NICKNAMES, m["nick"]) ||
    !has(REGIONS, m["region"]) ||
    !has(OUTFITS, m["outfit"]) ||
    (m["facing"] !== 1 && m["facing"] !== -1) ||
    typeof m["moving"] !== "boolean" ||
    (m["active"] !== undefined && typeof m["active"] !== "boolean") ||
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
    ...(m["active"] === undefined ? {} : { active: m["active"] as boolean }),
    emote: (m["emote"] as Emote | null | undefined) ?? null,
    t,
  };
}

/** Movement, heartbeats and emotes share one rate limit. */
export function shouldSend(
  prev: PlayerMessage | null,
  next: PlayerMessage,
  now: number,
  lastSentAt: number,
): boolean {
  if (!prev) return true;
  if (now - lastSentAt < SEND_INTERVAL_MS) return false;
  return (
    now - lastSentAt >= HEARTBEAT_MS ||
    prev.nick !== next.nick ||
    prev.active !== next.active ||
    prev.emote !== next.emote ||
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
  const old = Object.hasOwn(remotes, msg.id) ? remotes[msg.id] : undefined;
  if (old && msg.t <= old.msg.t) return remotes;
  if (!old && Object.keys(remotes).length >= MAX_ROOM_PLAYERS - 1) return remotes;
  return {
    ...remotes,
    [msg.id]: {
      msg,
      from:
        old && old.msg.region === msg.region && old.msg.active !== false && msg.active !== false
          ? drawPosition(old, now)
          : { x: msg.x, y: msg.y },
      seenAt: now,
    },
  };
}
export function pruneStale(remotes: RemoteMap, now: number): RemoteMap {
  const kept = Object.entries(remotes).filter(([, r]) => now - r.seenAt <= STALE_AFTER_MS);
  return kept.length === Object.keys(remotes).length ? remotes : Object.fromEntries(kept);
}
/** Position to draw: glide from the previous point toward the latest over one send interval. */
export function drawPosition(r: RemotePlayer, now: number) {
  const k = Math.min(1, Math.max(0, (now - r.seenAt) / SEND_INTERVAL_MS));
  if (r.msg.region === "village") {
    const delta = worldDelta(r.from, r.msg);
    return wrapPoint({ x: r.from.x + delta.x * k, y: r.from.y + delta.y * k });
  }
  return { x: r.from.x + (r.msg.x - r.from.x) * k, y: r.from.y + (r.msg.y - r.from.y) * k };
}
export const visibleRemotes = (remotes: RemoteMap, region: FamilyRegion) =>
  Object.values(remotes).filter((r) => r.msg.region === region && r.msg.active !== false);
