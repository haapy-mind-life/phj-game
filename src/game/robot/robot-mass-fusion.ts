import type { Point } from "../world/adventure.ts";
import { ARMY, ARMY_SIZE, armyPosition } from "./robot-army.ts";
import { worldDistance, wrapPoint } from "../world/world-space.ts";

// The 100-robot fusion (requirements v3 RA-104/105). Separate from the 2·3 robot fusion
// (MAX_FUSION stays 3): every one of the 100 army robots must really walk to the rally
// square, and only when all 100 different robots have arrived do they build one giant.
// PROPOSED (RAQ-01): the giant is on Hyunjun's side and fights a separate giant villain.
export const RALLY_SITE = { x: 2500, y: 2950 };
/** The player has to stand at the rally square to call the army (RAQ-05). */
export const RALLY_RANGE = 260;
/** Fast enough that the farthest robot arrives in about 15 s, so the gathering can be watched. */
export const GATHER_SPEED = 800;
export const GATHER_MIN_MS = 1500;
export const GATHER_MAX_MS = 16000;
export const ASSEMBLE_MS = 2600;
export const SPLIT_MS = 1000;
export type MassPhase = "idle" | "gathering" | "assembling" | "giant" | "splitting" | "returning";
export type MassFusion = {
  eventId: number;
  phase: MassPhase;
  /** The army robots taking part: 100 different instance ids. */
  participants: string[];
  /** Where each participant was when the army was called. */
  origins: Record<string, Point>;
  /** How long each participant takes to arrive. */
  travelMs: Record<string, number>;
  arrived: string[];
  /** When the current phase started. */
  since: number;
};
export const idleFusion = (): MassFusion => ({
  eventId: 0,
  phase: "idle",
  participants: [],
  origins: {},
  travelMs: {},
  arrived: [],
  since: 0,
});
const ARMY_IDS = new Set(ARMY.map((r) => r.instanceId));
/** Exactly 100 different, real army robots. */
export const validParticipants = (ids: readonly string[]) =>
  ids.length === ARMY_SIZE &&
  new Set(ids).size === ARMY_SIZE &&
  ids.every((id) => ARMY_IDS.has(id));
/** The giant may only be built when every participant, and nobody else, has arrived. */
export function canAssemble(participants: readonly string[], arrived: readonly string[]) {
  if (!validParticipants(participants)) return false;
  const set = new Set(participants);
  return new Set(arrived).size === ARMY_SIZE && arrived.every((id) => set.has(id));
}
/** Each participant has its own spot in rings around the rally square. */
export function rallySlot(index: number): Point {
  let ring = 0,
    start = 0,
    size = 8;
  while (index >= start + size) {
    start += size;
    ring += 1;
    size = 8 + ring * 6;
  }
  const angle = ((index - start) / size) * Math.PI * 2 + ring * 0.3;
  const r = 110 + ring * 55;
  return wrapPoint({
    x: RALLY_SITE.x + Math.cos(angle) * r,
    y: RALLY_SITE.y + Math.sin(angle) * r * 0.6,
  });
}
/** Calls the army. Returns null unless the participants are exactly the 100 army robots. */
export function callArmy(
  eventId: number,
  participants: readonly string[],
  seconds: number,
  now: number,
): MassFusion | null {
  if (!validParticipants(participants)) return null;
  const origins: Record<string, Point> = {};
  const travelMs: Record<string, number> = {};
  participants.forEach((id, i) => {
    const robot = ARMY.find((r) => r.instanceId === id)!;
    const from = armyPosition(robot, seconds);
    origins[id] = from;
    travelMs[id] = Math.min(
      GATHER_MAX_MS,
      Math.max(GATHER_MIN_MS, (worldDistance(from, rallySlot(i)) / GATHER_SPEED) * 1000),
    );
  });
  return {
    eventId,
    phase: "gathering",
    participants: [...participants],
    origins,
    travelMs,
    arrived: [],
    since: now,
  };
}
/** Advances the event: robots arrive on their own time; 100/100 starts assembling. */
export function stepFusion(m: MassFusion, now: number, playerAtRally = true): MassFusion {
  if (m.phase === "gathering") {
    const arrived = m.participants.filter((id) => now - m.since >= m.travelMs[id]!);
    // All 100 wait at the square until the player is back there to ride the giant.
    if (canAssemble(m.participants, arrived) && playerAtRally)
      return { ...m, arrived, phase: "assembling", since: now };
    return arrived.length === m.arrived.length ? m : { ...m, arrived };
  }
  if (m.phase === "assembling" && now - m.since >= ASSEMBLE_MS)
    return { ...m, phase: "giant", since: now };
  if (m.phase === "splitting" && now - m.since >= SPLIT_MS)
    return { ...m, phase: "returning", since: now };
  if (m.phase === "returning" && now - m.since >= GATHER_MAX_MS) return idleFusion();
  return m;
}
/**
 * Splitting is only possible from the finished giant. The robots burst out where the giant
 * stands (`at`) and walk home from there.
 */
export function splitFusion(m: MassFusion, now: number, at: Point): MassFusion {
  if (m.phase !== "giant") return m;
  return {
    ...m,
    phase: "splitting",
    since: now,
    origins: Object.fromEntries(m.participants.map((id) => [id, { ...at }])),
  };
}
/**
 * Calling off a rally that hasn't become a giant yet: every robot walks home from wherever it
 * is right now (`positionOf`), and nothing is paid.
 */
export function cancelFusion(
  m: MassFusion,
  now: number,
  positionOf: (instanceId: string) => Point | null,
): MassFusion {
  if (m.phase !== "gathering" && m.phase !== "assembling") return m;
  const origins = Object.fromEntries(
    m.participants.map((id, i) => [id, positionOf(id) ?? rallySlot(i)]),
  );
  return { ...m, phase: "returning", since: now, origins };
}
/**
 * Where an army robot is drawn: on its own route normally, walking in while gathering, inside
 * the giant (null) while assembled, and walking back after a split.
 */
export function fusionPosition(
  m: MassFusion,
  instanceId: string,
  normal: Point,
  now: number,
): Point | null {
  const i = m.participants.indexOf(instanceId);
  if (m.phase === "idle" || i < 0) return normal;
  const slot = rallySlot(i);
  const travel = m.travelMs[instanceId]!;
  if (m.phase === "gathering") {
    const k = Math.min(1, (now - m.since) / travel);
    const from = m.origins[instanceId]!;
    return { x: from.x + (slot.x - from.x) * k, y: from.y + (slot.y - from.y) * k };
  }
  if (m.phase === "returning") {
    // Home from where the robot really was when the giant split or the rally was called off.
    const k = Math.min(1, (now - m.since) / travel);
    if (k >= 1) return normal;
    const from = m.origins[instanceId] ?? slot;
    return { x: from.x + (normal.x - from.x) * k, y: from.y + (normal.y - from.y) * k };
  }
  return null;
}
