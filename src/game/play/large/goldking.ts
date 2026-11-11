import { nextRandom, type Outcome } from "../arcade.ts";

// lg-13 황금 코인왕: walk a grid with the arrow buttons. A compass points toward the nearest hidden
// gold coin and says how far it is; step on it to pick it up. Each stage hides two coins on a
// bigger field (5 → 6 → 7 squares a side) with a step budget. Run out of steps and the game ends.
export const GOLD_GOAL = 6;
export const sideFor = (stage: number) => [5, 6, 7][stage - 1] ?? 7;
export const STEPS_PER_STAGE = 30;
export type Dir = "up" | "down" | "left" | "right";
const MOVE: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
export type GoldGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  steps: number;
  x: number;
  y: number;
  coins: [number, number][];
  seed: number;
};
export const goldStage = (score: number) => Math.min(3, 1 + Math.floor(score / 2)) as 1 | 2 | 3;
function hide(g: GoldGame, stage: 1 | 2 | 3): GoldGame {
  const n = sideFor(stage);
  let r: number;
  let s = g.seed;
  const x = Math.floor(n / 2),
    y = Math.floor(n / 2);
  const coins: [number, number][] = [];
  while (coins.length < 2) {
    [r, s] = nextRandom(s);
    const cx = Math.min(n - 1, Math.floor(r * n));
    [r, s] = nextRandom(s);
    const cy = Math.min(n - 1, Math.floor(r * n));
    if ((cx !== x || cy !== y) && !coins.some(([a, b]) => a === cx && b === cy))
      coins.push([cx, cy]);
  }
  return { ...g, stage, x, y, coins, steps: STEPS_PER_STAGE, seed: s };
}
export const createGold = (seed = 1): GoldGame =>
  hide({ outcome: "playing", score: 0, stage: 1, steps: 0, x: 0, y: 0, coins: [], seed }, 1);
/** Toward the nearest coin: an arrow and a distance word. */
export function compass(g: GoldGame): { arrow: string; far: "바로 옆" | "가까워" | "멀어" } | null {
  const near = g.coins
    .map(([cx, cy]) => ({ dx: cx - g.x, dy: cy - g.y }))
    .sort((a, b) => Math.abs(a.dx) + Math.abs(a.dy) - (Math.abs(b.dx) + Math.abs(b.dy)))[0];
  if (!near) return null;
  const d = Math.abs(near.dx) + Math.abs(near.dy);
  const h = near.dx > 0 ? "➡" : near.dx < 0 ? "⬅" : "";
  const v = near.dy > 0 ? "⬇" : near.dy < 0 ? "⬆" : "";
  return { arrow: v + h, far: d <= 1 ? "바로 옆" : d <= 3 ? "가까워" : "멀어" };
}
export function walk(g: GoldGame, d: Dir): GoldGame {
  if (g.outcome !== "playing" || !(d in MOVE)) return g;
  const n = sideFor(g.stage);
  const x = g.x + MOVE[d][0],
    y = g.y + MOVE[d][1];
  if (x < 0 || y < 0 || x >= n || y >= n) return g;
  const steps = g.steps - 1;
  const hit = g.coins.findIndex(([cx, cy]) => cx === x && cy === y);
  if (hit < 0) return { ...g, x, y, steps, outcome: steps <= 0 ? "lost" : "playing" };
  const coins = g.coins.filter((_, i) => i !== hit);
  const score = g.score + 1;
  if (score >= GOLD_GOAL) return { ...g, x, y, steps, coins, score, outcome: "won" };
  if (coins.length)
    return { ...g, x, y, steps, coins, score, outcome: steps <= 0 ? "lost" : "playing" };
  return hide({ ...g, score }, goldStage(score));
}
/** No clock: the steps are the limit. */
export const tickGold = (g: GoldGame, _dt: number) => g;
