import { nextRandom, type Outcome } from "../arcade.ts";

// lg-06 태국 여행: three markets. Each has a picture shopping list; tap the goods on the list among
// the stall's six. Tapping something not on the list is a mistake. Lists grow 3 → 4 → 5 (12 items
// in all), 150 s, 3 mistakes. Goods are everyday fruit and crafts people enjoy at Thai markets.
export const THAI_GOAL = 12;
export const THAI_MISSES = 3;
export const THAI_SECONDS = 150;
export const GOODS: readonly { icon: string; name: string }[] = [
  { icon: "🥭", name: "망고" },
  { icon: "🥥", name: "코코넛" },
  { icon: "🍌", name: "바나나" },
  { icon: "🍍", name: "파인애플" },
  { icon: "🍚", name: "쌀" },
  { icon: "🌸", name: "꽃목걸이" },
  { icon: "🪁", name: "연" },
  { icon: "🐘", name: "코끼리 인형" },
  { icon: "🧺", name: "바구니" },
  { icon: "🍉", name: "수박" },
];
export const listSize = (stage: number) => [3, 4, 5][stage - 1] ?? 5;
export type ThaiGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  misses: number;
  remaining: number;
  stall: number[];
  list: number[];
  bought: number[];
  seed: number;
};
function market(g: ThaiGame, stage: 1 | 2 | 3): ThaiGame {
  let r: number;
  let s = g.seed;
  const stall: number[] = [];
  while (stall.length < 6) {
    [r, s] = nextRandom(s);
    const pick = Math.min(GOODS.length - 1, Math.floor(r * GOODS.length));
    if (!stall.includes(pick)) stall.push(pick);
  }
  const list = stall.slice(0, listSize(stage));
  // Shuffle the stall so the list isn't simply its first squares.
  for (let i = stall.length - 1; i > 0; i--) {
    [r, s] = nextRandom(s);
    const j = Math.floor(r * (i + 1));
    [stall[i], stall[j]] = [stall[j]!, stall[i]!];
  }
  return { ...g, stage, stall, list, bought: [], seed: s };
}
export const createThai = (seed = 1): ThaiGame =>
  market(
    {
      outcome: "playing",
      score: 0,
      stage: 1,
      misses: 0,
      remaining: THAI_SECONDS,
      stall: [],
      list: [],
      bought: [],
      seed,
    },
    1,
  );
export function buy(g: ThaiGame, good: number): ThaiGame {
  if (g.outcome !== "playing" || !g.stall.includes(good) || g.bought.includes(good)) return g;
  if (!g.list.includes(good)) {
    const misses = g.misses + 1;
    return { ...g, misses, outcome: misses >= THAI_MISSES ? "lost" : "playing" };
  }
  const bought = [...g.bought, good];
  const score = g.score + 1;
  if (score >= THAI_GOAL) return { ...g, bought, score, outcome: "won" };
  if (bought.length < g.list.length) return { ...g, bought, score };
  return market({ ...g, score }, (g.stage + 1) as 2 | 3);
}
export function tickThai(g: ThaiGame, dt: number): ThaiGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const remaining = Math.max(0, g.remaining - Math.min(dt, 0.25));
  return { ...g, remaining, outcome: remaining === 0 ? "lost" : "playing" };
}
