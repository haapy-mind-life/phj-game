import { nextRandom, type Outcome } from "../arcade.ts";

// mn-03 숨은 로봇 찾기: twelve look-alike robots; one of them is a little different. Find it
// before the round's light runs out. Ten rounds, 8 s each, 3 misses (a wrong tap or a lost round).
export const SPOT_GOAL = 10;
export const SPOT_MISSES = 3;
export const ROUND_SECONDS = 8;
export const SPOT_CELLS = 12;
/** Pairs that look alike at a glance: the crowd is the first, the odd one the second. */
export const LOOKALIKES: readonly [string, string][] = [
  ["🤖", "👾"],
  ["🚓", "🚑"],
  ["🦾", "🦿"],
  ["⚙️", "🔩"],
  ["🛸", "🚀"],
  ["🔋", "🪫"],
];
export type SpotGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  pair: number;
  odd: number;
  seed: number;
};
function round(g: Omit<SpotGame, "pair" | "odd" | "remaining">): SpotGame {
  let r: number;
  let { seed } = g;
  [r, seed] = nextRandom(seed);
  const pair = Math.min(LOOKALIKES.length - 1, Math.floor(r * LOOKALIKES.length));
  [r, seed] = nextRandom(seed);
  const odd = Math.min(SPOT_CELLS - 1, Math.floor(r * SPOT_CELLS));
  return { ...g, seed, pair, odd, remaining: ROUND_SECONDS };
}
export const createSpot = (seed = 1): SpotGame =>
  round({ outcome: "playing", score: 0, misses: 0, seed });
function miss(g: SpotGame): SpotGame {
  const misses = g.misses + 1;
  if (misses >= SPOT_MISSES) return { ...g, misses, outcome: "lost" };
  return round({ ...g, misses });
}
export function tapSpot(g: SpotGame, cell: number): SpotGame {
  if (g.outcome !== "playing" || !Number.isInteger(cell) || cell < 0 || cell >= SPOT_CELLS)
    return g;
  if (cell !== g.odd) return miss(g);
  const score = g.score + 1;
  if (score >= SPOT_GOAL) return { ...g, score, outcome: "won" };
  return round({ ...g, score });
}
export function tickSpot(g: SpotGame, dt: number): SpotGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const remaining = g.remaining - Math.min(dt, 0.25);
  return remaining <= 0 ? miss(g) : { ...g, remaining };
}
