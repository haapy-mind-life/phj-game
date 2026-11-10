import { nextRandom, type Outcome } from "../arcade.ts";

// mn-07 보물찾기: three treasures are buried in a 5×5 beach. Each dig that finds sand tells how
// close the nearest treasure is: 뜨거워 (next to it), 따뜻해 (two steps), 차가워 (farther).
// Find all three with 15 digs.
export const DIG_GOAL = 3;
export const DIG_TRIES = 15;
export const BEACH = 5;
export type Clue = "found" | "hot" | "warm" | "cold";
export type DigGame = {
  outcome: Outcome;
  score: number;
  tries: number;
  treasures: number[];
  dug: Record<number, Clue>;
  seed: number;
};
export function createDig(seed = 1): DigGame {
  let r: number;
  let s = seed;
  const treasures: number[] = [];
  while (treasures.length < DIG_GOAL) {
    [r, s] = nextRandom(s);
    const c = Math.min(BEACH * BEACH - 1, Math.floor(r * BEACH * BEACH));
    if (!treasures.includes(c)) treasures.push(c);
  }
  return { outcome: "playing", score: 0, tries: DIG_TRIES, treasures, dug: {}, seed: s };
}
const steps = (a: number, b: number) =>
  Math.abs((a % BEACH) - (b % BEACH)) + Math.abs(Math.floor(a / BEACH) - Math.floor(b / BEACH));
export function clueAt(g: DigGame, cell: number): Clue {
  if (g.treasures.includes(cell)) return "found";
  const left = g.treasures.filter((t) => g.dug[t] !== "found");
  const near = Math.min(...left.map((t) => steps(t, cell)));
  return near <= 1 ? "hot" : near === 2 ? "warm" : "cold";
}
export function digAt(g: DigGame, cell: number): DigGame {
  if (
    g.outcome !== "playing" ||
    !Number.isInteger(cell) ||
    cell < 0 ||
    cell >= BEACH * BEACH ||
    g.dug[cell]
  )
    return g;
  const clue = clueAt(g, cell);
  const dug = { ...g.dug, [cell]: clue };
  const tries = g.tries - 1;
  const score = g.score + (clue === "found" ? 1 : 0);
  const outcome: Outcome = score >= DIG_GOAL ? "won" : tries === 0 ? "lost" : "playing";
  return { ...g, dug, tries, score, outcome };
}
/** Digging has no clock: the beach waits for the next dig. */
export const tickDig = (g: DigGame, _dt: number) => g;
