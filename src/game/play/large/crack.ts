import type { Outcome } from "../arcade.ts";

// lg-10 땅콩까기: a power bar swings back and forth; press 톡 while it is in the green part to crack
// a peanut. Pressing outside the green squashes it (a mistake), and a peanut left for 4 s rolls
// away (also a mistake). Four peanuts per stage; the bar gets faster and the green narrower.
// Twelve peanuts, 3 mistakes.
export const CRACK_GOAL = 12;
export const PER_STAGE = 4;
export const CRACK_MISSES = 3;
export const PEANUT_SECONDS = 4;
export const GREEN_START = 0.42;
export const greenWidth = (stage: number) => [0.24, 0.18, 0.13][stage - 1] ?? 0.13;
export const barSpeed = (stage: number) => [0.8, 1.1, 1.4][stage - 1] ?? 1.4;
export type CrackGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  misses: number;
  bar: number;
  dir: 1 | -1;
  left: number;
};
export const crackStage = (score: number) =>
  Math.min(3, 1 + Math.floor(score / PER_STAGE)) as 1 | 2 | 3;
export const createCrack = (_seed = 1): CrackGame => ({
  outcome: "playing",
  score: 0,
  stage: 1,
  misses: 0,
  bar: 0,
  dir: 1,
  left: PEANUT_SECONDS,
});
export const inGreen = (g: CrackGame) =>
  g.bar >= GREEN_START && g.bar <= GREEN_START + greenWidth(g.stage);
function miss(g: CrackGame): CrackGame {
  const misses = g.misses + 1;
  return {
    ...g,
    misses,
    left: PEANUT_SECONDS,
    outcome: misses >= CRACK_MISSES ? "lost" : "playing",
  };
}
export function tapCrack(g: CrackGame): CrackGame {
  if (g.outcome !== "playing") return g;
  if (!inGreen(g)) return miss(g);
  const score = g.score + 1;
  if (score >= CRACK_GOAL) return { ...g, score, outcome: "won" };
  return { ...g, score, stage: crackStage(score), left: PEANUT_SECONDS };
}
export function tickCrack(g: CrackGame, dt: number): CrackGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let bar = g.bar + g.dir * barSpeed(g.stage) * step;
  let dir = g.dir;
  if (bar >= 1) [bar, dir] = [1, -1];
  if (bar <= 0) [bar, dir] = [0, 1];
  const left = g.left - step;
  if (left <= 0) return miss({ ...g, bar, dir });
  return { ...g, bar, dir, left };
}
