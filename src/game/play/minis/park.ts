import { nextRandom, type Outcome } from "../arcade.ts";

// mn-19 자동차 주차: a car parks on a 5×6 lot. Each arrow moves it one square; a cone in the way is
// a bump and the car stays. Reach the P square to park. Five lots, 3 bumps, 120 s. Every lot is
// checked to have a free way to P.
export const PARK_GOAL = 5;
export const PARK_BUMPS = 3;
export const PARK_SECONDS = 120;
export const COLS = 5;
export const ROWS = 6;
export type Dir = "up" | "down" | "left" | "right";
const STEP: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
export type Lot = { car: number; spot: number; cones: number[] };
export type ParkGame = {
  outcome: Outcome;
  score: number;
  bumps: number;
  remaining: number;
  lot: Lot;
  seed: number;
};
const xy = (i: number) => [i % COLS, Math.floor(i / COLS)] as const;
/** Shortest list of moves from the car to P, or null when there is none. */
export function route(lot: Lot): Dir[] | null {
  const prev = new Map<number, [number, Dir]>();
  const queue = [lot.car];
  const seen = new Set([lot.car]);
  while (queue.length) {
    const at = queue.shift()!;
    if (at === lot.spot) {
      const path: Dir[] = [];
      for (let c = at; c !== lot.car; c = prev.get(c)![0]) path.unshift(prev.get(c)![1]);
      return path;
    }
    const [x, y] = xy(at);
    for (const d of Object.keys(STEP) as Dir[]) {
      const nx = x + STEP[d][0],
        ny = y + STEP[d][1];
      const n = ny * COLS + nx;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || seen.has(n) || lot.cones.includes(n))
        continue;
      seen.add(n);
      prev.set(n, [at, d]);
      queue.push(n);
    }
  }
  return null;
}
function newLot(level: number, seed: number): [Lot, number] {
  let r: number;
  let s = seed;
  for (;;) {
    [r, s] = nextRandom(s);
    const car = (ROWS - 1) * COLS + Math.min(COLS - 1, Math.floor(r * COLS));
    [r, s] = nextRandom(s);
    const spot = Math.min(COLS - 1, Math.floor(r * COLS));
    const cones: number[] = [];
    while (cones.length < 4 + level) {
      [r, s] = nextRandom(s);
      const c = Math.min(COLS * ROWS - 1, Math.floor(r * COLS * ROWS));
      if (c !== car && c !== spot && !cones.includes(c)) cones.push(c);
    }
    const lot = { car, spot, cones };
    const way = route(lot);
    if (way && way.length >= 5) return [lot, s];
  }
}
export function createPark(seed = 1): ParkGame {
  const [lot, s] = newLot(0, seed);
  return { outcome: "playing", score: 0, bumps: 0, remaining: PARK_SECONDS, lot, seed: s };
}
export function drive(g: ParkGame, d: Dir): ParkGame {
  if (g.outcome !== "playing" || !(d in STEP)) return g;
  const [x, y] = xy(g.lot.car);
  const nx = x + STEP[d][0],
    ny = y + STEP[d][1];
  if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return g;
  const n = ny * COLS + nx;
  if (g.lot.cones.includes(n)) {
    const bumps = g.bumps + 1;
    return { ...g, bumps, outcome: bumps >= PARK_BUMPS ? "lost" : "playing" };
  }
  if (n !== g.lot.spot) return { ...g, lot: { ...g.lot, car: n } };
  const score = g.score + 1;
  if (score >= PARK_GOAL) return { ...g, score, lot: { ...g.lot, car: n }, outcome: "won" };
  const [lot, seed] = newLot(score, g.seed);
  return { ...g, score, lot, seed };
}
export function tickPark(g: ParkGame, dt: number): ParkGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const remaining = Math.max(0, g.remaining - Math.min(dt, 0.25));
  return { ...g, remaining, outcome: remaining === 0 ? "lost" : "playing" };
}
