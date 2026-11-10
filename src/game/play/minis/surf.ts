import type { Outcome } from "../arcade.ts";

// mn-13 파도타기: waves push the balance needle left and right. Hold ◀ or ▶ to lean back; time
// spent in the middle zone scores. The board tips over when the needle reaches an edge.
export const SURF_GOAL = 25;
export const SURF_FALLS = 3;
export const ZONE = 0.35;
/** Leaning is always stronger than the strongest wave, so every wave can be answered. */
export const LEAN = 1.8;
export type SurfGame = {
  outcome: Outcome;
  /** Seconds in the zone; the score is its whole part. */
  points: number;
  score: number;
  falls: number;
  /** -1 (left edge) … 1 (right edge). */
  needle: number;
  lean: -1 | 0 | 1;
  time: number;
  phase: number;
};
export const createSurf = (seed = 1): SurfGame => ({
  outcome: "playing",
  points: 0,
  score: 0,
  falls: 0,
  needle: 0,
  lean: 0,
  time: 0,
  phase: (seed % 628) / 100,
});
/** Small waves plus a long swell that pushes one way for several seconds, so letting go always
 * ends in a fall; the largest push (1.5) is still weaker than leaning. */
export const wave = (time: number, phase: number) =>
  0.6 * Math.sin(time * 1.3 + phase) +
  0.3 * Math.sin(time * 2.9 + phase * 2) +
  (Math.sin(time * 0.45 + phase) >= 0 ? 0.6 : -0.6);
export const inZone = (g: SurfGame) => Math.abs(g.needle) < ZONE;

export function setLean(g: SurfGame, lean: -1 | 0 | 1): SurfGame {
  return g.outcome !== "playing" || g.lean === lean ? g : { ...g, lean };
}

export function tickSurf(g: SurfGame, dt: number): SurfGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  const time = g.time + step;
  let needle = g.needle + (wave(time, g.phase) + g.lean * LEAN) * step;
  let { falls, points } = g;
  if (Math.abs(needle) >= 1) {
    falls += 1;
    needle = 0;
  } else if (Math.abs(needle) < ZONE) points += step;
  const score = Math.min(SURF_GOAL, Math.floor(points));
  const outcome: Outcome = falls >= SURF_FALLS ? "lost" : score >= SURF_GOAL ? "won" : "playing";
  return { ...g, time, needle, falls, points, score, outcome };
}
