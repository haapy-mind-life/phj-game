import { nextRandom, type Outcome } from "../arcade.ts";

// mn-20 로봇 사격장: targets and friendly-robot signs pop up on a 3×3 board. Tap targets with the
// safe energy shot; tapping a friend is a miss. 30 s, 15 targets, 3 misses.
export const RANGE_GOAL = 15;
export const RANGE_MISSES = 3;
export const RANGE_SECONDS = 30;
export const POP_SECONDS = 1.5;
export type Popup = { id: number; cell: number; kind: "target" | "friend"; left: number };
export type RangeGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  popups: Popup[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const createRange = (seed = 1): RangeGame => ({
  outcome: "playing",
  score: 0,
  misses: 0,
  remaining: RANGE_SECONDS,
  popups: [],
  nextId: 1,
  spawnIn: 0.3,
  seed,
});
export function tickRange(g: RangeGame, dt: number): RangeGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.25);
  let { seed, nextId, spawnIn } = g;
  const popups = g.popups.map((p) => ({ ...p, left: p.left - step })).filter((p) => p.left > 0);
  spawnIn -= step;
  if (spawnIn <= 0) {
    const free = [...Array(9).keys()].filter((c) => !popups.some((p) => p.cell === c));
    let r: number;
    [r, seed] = nextRandom(seed);
    const cell = free[Math.min(free.length - 1, Math.floor(r * free.length))];
    [r, seed] = nextRandom(seed);
    if (cell !== undefined)
      popups.push({ id: nextId++, cell, kind: r < 0.25 ? "friend" : "target", left: POP_SECONDS });
    [r, seed] = nextRandom(seed);
    spawnIn = 0.45 + r * 0.35;
  }
  const remaining = Math.max(0, g.remaining - step);
  return {
    ...g,
    popups,
    seed,
    nextId,
    spawnIn,
    remaining,
    outcome: remaining === 0 ? "lost" : "playing",
  };
}
export function shoot(g: RangeGame, id: number): RangeGame {
  if (g.outcome !== "playing") return g;
  const hit = g.popups.find((p) => p.id === id);
  if (!hit) return g;
  const popups = g.popups.filter((p) => p.id !== id);
  if (hit.kind === "friend") {
    const misses = g.misses + 1;
    return { ...g, popups, misses, outcome: misses >= RANGE_MISSES ? "lost" : "playing" };
  }
  const score = g.score + 1;
  return { ...g, popups, score, outcome: score >= RANGE_GOAL ? "won" : "playing" };
}
