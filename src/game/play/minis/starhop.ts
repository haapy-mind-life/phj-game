import { nextRandom, type Outcome } from "../arcade.ts";

// mn-01 별빛 모으기: one star sits on a 4×4 sky and hops to a new square after a moment. Tap it
// before it hops. Tapping an empty square is a miss. 40 s, 15 stars, 3 misses. Unlike the star
// park in the village (walk and collect), this one is about quick eyes and fingers.
export const STAR_GOAL = 15;
export const STAR_MISSES = 3;
export const STAR_SECONDS = 40;
export const SKY = 16;
export const FIRST_STAY = 1.5;
export const LAST_STAY = 0.8;
export type StarGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  at: number;
  stay: number;
  seed: number;
};
export const stayFor = (score: number) =>
  Math.max(LAST_STAY, FIRST_STAY - (score * (FIRST_STAY - LAST_STAY)) / (STAR_GOAL - 1));
function hop(g: Omit<StarGame, "at" | "stay"> & { at: number }): StarGame {
  let r: number;
  let { seed } = g;
  let at = g.at;
  while (at === g.at) {
    [r, seed] = nextRandom(seed);
    at = Math.min(SKY - 1, Math.floor(r * SKY));
  }
  return { ...g, at, seed, stay: stayFor(g.score) };
}
export const createStars = (seed = 1): StarGame =>
  hop({ outcome: "playing", score: 0, misses: 0, remaining: STAR_SECONDS, at: -1, seed });
export function tapSky(g: StarGame, cell: number): StarGame {
  if (g.outcome !== "playing" || !Number.isInteger(cell) || cell < 0 || cell >= SKY) return g;
  if (cell !== g.at) {
    const misses = g.misses + 1;
    return { ...g, misses, outcome: misses >= STAR_MISSES ? "lost" : "playing" };
  }
  const score = g.score + 1;
  if (score >= STAR_GOAL) return { ...g, score, outcome: "won" };
  return hop({ ...g, score });
}
export function tickStars(g: StarGame, dt: number): StarGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.25);
  const remaining = Math.max(0, g.remaining - step);
  if (remaining === 0) return { ...g, remaining, outcome: "lost" };
  const stay = g.stay - step;
  return stay <= 0 ? hop({ ...g, remaining }) : { ...g, remaining, stay };
}
