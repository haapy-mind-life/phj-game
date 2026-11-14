import { countdown, nextRandom, type Outcome } from "../arcade.ts";

// mn-10 전설 힌트 찾기: a 3×3 map of forest, water and mountain. Two clues — a direction (a row or
// a column) and a land — point to exactly one square where the legend hides. Six finds, 3 wrong
// guesses, 90 s. A pretend legend only: the real legend hunt in the world is not touched.
export const HINT_GOAL = 6;
export const HINT_MISSES = 3;
export const HINT_SECONDS = 90;
export const LANDS = ["🌲", "🌊", "⛰️"] as const;
export const LAND_NAME = ["숲", "물가", "산"] as const;
export type Land = 0 | 1 | 2;
/** A row (북쪽·가운데·남쪽) or a column (서쪽·가운데·동쪽). */
export type Line = { axis: "row" | "col"; index: 0 | 1 | 2 };
export const LINE_NAME = {
  row: ["북쪽 줄", "가운데 가로줄", "남쪽 줄"],
  col: ["서쪽 줄", "가운데 세로줄", "동쪽 줄"],
} as const;
export type HintGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  map: Land[];
  line: Line;
  land: Land;
  answer: number;
  seed: number;
};
const cellsOf = (l: Line) =>
  [0, 1, 2].map((k) => (l.axis === "row" ? l.index * 3 + k : k * 3 + l.index));
/** A new map and clues that pick out exactly one square. */
function puzzle(seed: number): Pick<HintGame, "map" | "line" | "land" | "answer" | "seed"> {
  let r: number;
  let s = seed;
  for (;;) {
    const map: Land[] = [];
    for (let i = 0; i < 9; i++) {
      [r, s] = nextRandom(s);
      map.push(Math.min(2, Math.floor(r * 3)) as Land);
    }
    [r, s] = nextRandom(s);
    const axis = r < 0.5 ? "row" : "col";
    [r, s] = nextRandom(s);
    const line: Line = { axis, index: Math.min(2, Math.floor(r * 3)) as 0 | 1 | 2 };
    [r, s] = nextRandom(s);
    const cells = cellsOf(line);
    const answer = cells[Math.min(2, Math.floor(r * 3))]!;
    const land = map[answer]!;
    if (cells.filter((c) => map[c] === land).length === 1)
      return { map, line, land, answer, seed: s };
  }
}
export const createHint = (seed = 1): HintGame => ({
  outcome: "playing",
  score: 0,
  misses: 0,
  remaining: HINT_SECONDS,
  ...puzzle(seed),
});
export function guess(g: HintGame, cell: number): HintGame {
  if (g.outcome !== "playing" || !Number.isInteger(cell) || cell < 0 || cell > 8) return g;
  if (cell !== g.answer) {
    const misses = g.misses + 1;
    return { ...g, misses, outcome: misses >= HINT_MISSES ? "lost" : "playing" };
  }
  const score = g.score + 1;
  if (score >= HINT_GOAL) return { ...g, score, outcome: "won" };
  return { ...g, score, ...puzzle(g.seed) };
}
export function tickHint(g: HintGame, dt: number): HintGame {
  return countdown(g, dt);
}
export const lineCells = cellsOf;
