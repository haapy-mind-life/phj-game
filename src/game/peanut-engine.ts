export const PEANUT_GOAL = 8;
export const PEANUT_SECONDS = 60;
export type PeanutSpot = 0 | 1 | 2;
export type PeanutGame = {
  phase: "ready" | "playing" | "paused" | "won" | "lost";
  score: number;
  step: number;
  mistakes: number;
  remaining: number;
};
const ORDERS: readonly (readonly PeanutSpot[])[] = [
  [0, 2],
  [2, 0],
  [0, 1, 2],
  [2, 1, 0],
  [1, 0, 2],
  [0, 2, 1],
  [2, 0, 1, 2],
  [1, 2, 0, 1],
];
export const peanutOrder = (g: PeanutGame): readonly PeanutSpot[] => ORDERS[g.score] ?? [];
export const createPeanuts = (): PeanutGame => ({
  phase: "ready",
  score: 0,
  step: 0,
  mistakes: 0,
  remaining: PEANUT_SECONDS,
});
export function tapPeanut(g: PeanutGame, spot: PeanutSpot): PeanutGame {
  if (g.phase !== "playing") return g;
  if (peanutOrder(g)[g.step] !== spot) {
    const mistakes = g.mistakes + 1;
    return { ...g, mistakes, step: 0, phase: mistakes >= 3 ? "lost" : "playing" };
  }
  if (g.step + 1 < peanutOrder(g).length) return { ...g, step: g.step + 1 };
  const score = g.score + 1;
  return { ...g, score, step: 0, phase: score === PEANUT_GOAL ? "won" : "playing" };
}
export function tickPeanuts(g: PeanutGame, seconds: number): PeanutGame {
  if (g.phase !== "playing" || !Number.isFinite(seconds) || seconds <= 0) return g;
  const remaining = Math.max(0, g.remaining - seconds);
  return { ...g, remaining, phase: remaining === 0 ? "lost" : "playing" };
}
