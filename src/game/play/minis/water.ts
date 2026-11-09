import { nextRandom, type Outcome } from "../arcade.ts";

// mn-11 물주기: eight plots in a row. Turn the watering can with ◀ ▶ and press 물 주기 to water
// the plot it points at. The wind nudges the can every few seconds, so look before you pour.
export const WATER_GOAL = 8;
export const WATER_TANK = 12;
export const PLOTS = 8;
export const WIND_EVERY = 3;
export type WaterGame = {
  outcome: Outcome;
  score: number;
  shots: number;
  aim: number;
  wet: boolean[];
  windIn: number;
  seed: number;
};
export const createWater = (seed = 1): WaterGame => ({
  outcome: "playing",
  score: 0,
  shots: WATER_TANK,
  aim: 3,
  wet: Array.from({ length: PLOTS }, () => false),
  windIn: WIND_EVERY,
  seed,
});
export function turnCan(g: WaterGame, dir: -1 | 1): WaterGame {
  if (g.outcome !== "playing") return g;
  const aim = Math.min(PLOTS - 1, Math.max(0, g.aim + dir));
  return aim === g.aim ? g : { ...g, aim };
}
export function pour(g: WaterGame): WaterGame {
  if (g.outcome !== "playing" || g.shots <= 0) return g;
  const shots = g.shots - 1;
  const wet = g.wet.slice();
  let score = g.score;
  if (!wet[g.aim]) {
    wet[g.aim] = true;
    score += 1;
  }
  const outcome: Outcome = score >= WATER_GOAL ? "won" : shots === 0 ? "lost" : "playing";
  return { ...g, shots, wet, score, outcome };
}
export function tickWater(g: WaterGame, dt: number): WaterGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  let windIn = g.windIn - Math.min(dt, 0.25);
  let { aim, seed } = g;
  if (windIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    aim = Math.min(PLOTS - 1, Math.max(0, aim + (r < 0.5 ? -1 : 1)));
    windIn = WIND_EVERY;
  }
  return { ...g, aim, seed, windIn };
}
