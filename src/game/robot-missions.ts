import { isWalkable, type Point } from "./adventure.ts";
import {
  RESCUE_PATCHES,
  THIEF_HOME,
  THIEF_LEASH,
  THIEF_SPEED,
  THIEF_STAMINA,
} from "./robot-catalog.ts";
import { worldDelta, worldDistance, wrapPoint } from "./world-space.ts";

/** A friend trapped behind burning bushes. Each valid water/skill hit puts bushes out. */
export type Rescue = { phase: "danger" | "safe"; burning: number };
export const startRescue = (): Rescue => ({ phase: "danger", burning: RESCUE_PATCHES });
export function douseRescue(r: Rescue, amount: number): Rescue {
  if (r.phase !== "danger") return r;
  const burning = Math.max(0, r.burning - Math.max(1, amount));
  return { phase: burning === 0 ? "safe" : "danger", burning };
}

export type ThiefPhase = "fleeing" | "stunned" | "caught" | "retreating";
export type Thief = { phase: ThiefPhase; pos: Point; stamina: number; until: number };
export const startThief = (): Thief => ({
  phase: "fleeing",
  pos: { ...THIEF_HOME },
  stamina: THIEF_STAMINA,
  until: 0,
});
/** The thief only notices a chaser this close; otherwise it strolls back toward its hideout. */
export const THIEF_ALERT = 520;
const STUN_MS = 1500;
/**
 * Moves the thief for `dt` seconds: away from the chaser while staying on walkable ground and
 * within its leash, sliding sideways when blocked so a cornered thief can still be reached.
 */
export function stepThief(t: Thief, chaser: Point, dt: number, now: number): Thief {
  if (t.phase === "stunned" && now >= t.until) return { ...t, phase: "fleeing" };
  if (t.phase !== "fleeing" || dt <= 0) return t;
  const away = worldDelta(chaser, t.pos);
  const alert = Math.hypot(away.x, away.y) < THIEF_ALERT;
  const home = worldDelta(t.pos, THIEF_HOME);
  const dir = alert ? away : home;
  const len = Math.hypot(dir.x, dir.y);
  if (len < 1) return t;
  const step = THIEF_SPEED * Math.min(dt, 0.1) * (alert ? 1 : 0.4);
  const ux = dir.x / len,
    uy = dir.y / len;
  // Straight away first, then the two sideways escapes.
  for (const [dx, dy] of [
    [ux, uy],
    [-uy, ux],
    [uy, -ux],
  ] as const) {
    const next = wrapPoint({ x: t.pos.x + dx * step, y: t.pos.y + dy * step });
    if (isWalkable(next) && worldDistance(next, THIEF_HOME) <= THIEF_LEASH)
      return { ...t, pos: next };
  }
  return t;
}
/**
 * A valid hit tires the thief. When it is out of stamina only a police robot can arrest it;
 * other robots just stop it for a moment.
 */
export function hitThief(t: Thief, police: boolean, now: number) {
  if (t.phase !== "fleeing" && t.phase !== "stunned") return { thief: t, caught: false };
  const stamina = Math.max(0, t.stamina - 1);
  if (stamina === 0 && police)
    return { thief: { ...t, stamina, phase: "caught" as const, until: now }, caught: true };
  return {
    thief: { ...t, stamina: Math.max(1, stamina), phase: "stunned" as const, until: now + STUN_MS },
    caught: false,
  };
}
