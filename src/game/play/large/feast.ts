import { nextRandom, type Outcome } from "../arcade.ts";

// lg-12 먹방 대모험: dishes ride a belt past Hyunjun. A guest's order card shows three foods; tap
// each one on the belt to put it on the plate. A food that isn't on the order is a mistake. Three
// courses with two plates each, the belt getting faster; plates with a fruit or vegetable get a
// "골고루" cheer. 6 plates, 3 mistakes, 120 s.
export const FEAST_GOAL = 6;
export const FEAST_MISSES = 3;
export const FEAST_SECONDS = 120;
export const FOODS = ["🍙", "🍜", "🍗", "🥦", "🍎", "🥕", "🍣", "🍳"] as const;
export const HEALTHY = new Set([3, 4, 5]);
export type Dish = { id: number; food: number; x: number };
export type FeastGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  misses: number;
  remaining: number;
  order: number[];
  plate: number[];
  belt: Dish[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const feastStage = (score: number) => Math.min(3, 1 + Math.floor(score / 2)) as 1 | 2 | 3;
function newOrder(g: FeastGame): FeastGame {
  let r: number;
  let s = g.seed;
  const order: number[] = [];
  while (order.length < 3) {
    [r, s] = nextRandom(s);
    const f = Math.min(FOODS.length - 1, Math.floor(r * FOODS.length));
    if (!order.includes(f)) order.push(f);
  }
  return { ...g, order, plate: [], seed: s };
}
export const createFeast = (seed = 1): FeastGame =>
  newOrder({
    outcome: "playing",
    score: 0,
    stage: 1,
    misses: 0,
    remaining: FEAST_SECONDS,
    order: [],
    plate: [],
    belt: [],
    nextId: 1,
    spawnIn: 0,
    seed,
  });
export const balanced = (order: readonly number[]) => order.some((f) => HEALTHY.has(f));
export function pickDish(g: FeastGame, id: number): FeastGame {
  if (g.outcome !== "playing") return g;
  const dish = g.belt.find((d) => d.id === id);
  if (!dish) return g;
  const belt = g.belt.filter((d) => d.id !== id);
  if (!g.order.includes(dish.food) || g.plate.includes(dish.food)) {
    const misses = g.misses + 1;
    return { ...g, belt, misses, outcome: misses >= FEAST_MISSES ? "lost" : "playing" };
  }
  const plate = [...g.plate, dish.food];
  if (plate.length < g.order.length) return { ...g, belt, plate };
  const score = g.score + 1;
  if (score >= FEAST_GOAL) return { ...g, belt, plate, score, outcome: "won" };
  return newOrder({ ...g, belt, score, stage: feastStage(score) });
}
export function tickFeast(g: FeastGame, dt: number): FeastGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let { seed, nextId, spawnIn } = g;
  const speed = 0.18 + g.stage * 0.05;
  const belt = g.belt.map((d) => ({ ...d, x: d.x - speed * step })).filter((d) => d.x > -0.1);
  spawnIn -= step;
  if (spawnIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    // About half the dishes are something the guest still wants, so every order can be filled.
    const wanted = g.order.filter((f) => !g.plate.includes(f));
    let food: number;
    if (r < 0.5 && wanted.length) {
      [r, seed] = nextRandom(seed);
      food = wanted[Math.min(wanted.length - 1, Math.floor(r * wanted.length))]!;
    } else {
      [r, seed] = nextRandom(seed);
      food = Math.min(FOODS.length - 1, Math.floor(r * FOODS.length));
    }
    belt.push({ id: nextId++, food, x: 1.05 });
    [r, seed] = nextRandom(seed);
    spawnIn = 0.8 + r * 0.4 - g.stage * 0.1;
  }
  const remaining = Math.max(0, g.remaining - step);
  return {
    ...g,
    belt,
    seed,
    nextId,
    spawnIn,
    remaining,
    outcome: remaining === 0 ? "lost" : "playing",
  };
}
