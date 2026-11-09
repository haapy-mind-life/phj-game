import { nextRandom, type Outcome } from "../arcade.ts";

// mn-04 코인 톡톡: coins and thunder clouds fall down four lanes. Tap coins; tapping a cloud
// costs a heart. Anything that falls past costs nothing. 30 s, 15 coins, 3 hearts.
export const COIN_GOAL = 15;
export const COIN_SECONDS = 30;
export const COIN_HEARTS = 3;
const MAX_ON_SCREEN = 6;
export type Falling = {
  id: number;
  lane: 0 | 1 | 2 | 3;
  y: number;
  speed: number;
  kind: "coin" | "cloud";
};
export type CoinGame = {
  outcome: Outcome;
  score: number;
  hearts: number;
  remaining: number;
  items: Falling[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const createCoins = (seed = 1): CoinGame => ({
  outcome: "playing",
  score: 0,
  hearts: COIN_HEARTS,
  remaining: COIN_SECONDS,
  items: [],
  nextId: 1,
  spawnIn: 0,
  seed,
});

export function tickCoins(g: CoinGame, dt: number): CoinGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.25);
  let { seed, nextId, spawnIn } = g;
  const items = g.items.map((i) => ({ ...i, y: i.y + i.speed * step })).filter((i) => i.y <= 1.05);
  spawnIn -= step;
  if (spawnIn <= 0 && items.length < MAX_ON_SCREEN) {
    let r: number;
    [r, seed] = nextRandom(seed);
    const lane = Math.min(3, Math.floor(r * 4)) as 0 | 1 | 2 | 3;
    [r, seed] = nextRandom(seed);
    const kind = r < 0.28 ? "cloud" : "coin";
    [r, seed] = nextRandom(seed);
    items.push({ id: nextId++, lane, y: 0, speed: 0.22 + r * 0.14, kind });
    [r, seed] = nextRandom(seed);
    spawnIn = 0.45 + r * 0.4;
  }
  const remaining = Math.max(0, g.remaining - step);
  return {
    ...g,
    items,
    seed,
    nextId,
    spawnIn,
    remaining,
    outcome: remaining === 0 ? "lost" : "playing",
  };
}

export function tapFalling(g: CoinGame, id: number): CoinGame {
  if (g.outcome !== "playing") return g;
  const item = g.items.find((i) => i.id === id);
  if (!item) return g;
  const items = g.items.filter((i) => i.id !== id);
  if (item.kind === "cloud") {
    const hearts = g.hearts - 1;
    return { ...g, items, hearts, outcome: hearts <= 0 ? "lost" : "playing" };
  }
  const score = g.score + 1;
  return { ...g, items, score, outcome: score >= COIN_GOAL ? "won" : "playing" };
}
