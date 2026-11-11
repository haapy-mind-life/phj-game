import { nextRandom, type Outcome } from "../arcade.ts";

// lg-18 보물섬: an island map with picture rows (🌴 🪨 🐚 🦀 🌺) and numbered columns. A clue card
// gives a row picture and a column number; tap that square to dig up the treasure. The map grows
// each stage (3×3 → 4×4 → 5×5), two treasures per stage. 3 wrong digs, 120 s.
export const ISLAND_GOAL = 6;
export const ISLAND_MISSES = 3;
export const ISLAND_SECONDS = 120;
export const ROW_MARKS = ["🌴", "🪨", "🐚", "🦀", "🌺"] as const;
export const sizeFor = (stage: number) => [3, 4, 5][stage - 1] ?? 5;
export type IslandGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  misses: number;
  remaining: number;
  row: number;
  col: number;
  seed: number;
};
export const islandStage = (score: number) => Math.min(3, 1 + Math.floor(score / 2)) as 1 | 2 | 3;
function clue(g: IslandGame): IslandGame {
  const n = sizeFor(g.stage);
  let r: number;
  let { seed } = g;
  [r, seed] = nextRandom(seed);
  const row = Math.min(n - 1, Math.floor(r * n));
  [r, seed] = nextRandom(seed);
  const col = Math.min(n - 1, Math.floor(r * n));
  return { ...g, row, col, seed };
}
export const createIsland = (seed = 1): IslandGame =>
  clue({
    outcome: "playing",
    score: 0,
    stage: 1,
    misses: 0,
    remaining: ISLAND_SECONDS,
    row: 0,
    col: 0,
    seed,
  });
export function digIsland(g: IslandGame, row: number, col: number): IslandGame {
  const n = sizeFor(g.stage);
  if (
    g.outcome !== "playing" ||
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    col < 0 ||
    row >= n ||
    col >= n
  )
    return g;
  if (row !== g.row || col !== g.col) {
    const misses = g.misses + 1;
    return { ...g, misses, outcome: misses >= ISLAND_MISSES ? "lost" : "playing" };
  }
  const score = g.score + 1;
  if (score >= ISLAND_GOAL) return { ...g, score, outcome: "won" };
  return clue({ ...g, score, stage: islandStage(score) });
}
export function tickIsland(g: IslandGame, dt: number): IslandGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const remaining = Math.max(0, g.remaining - Math.min(dt, 0.25));
  return { ...g, remaining, outcome: remaining === 0 ? "lost" : "playing" };
}
