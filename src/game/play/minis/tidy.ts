import { nextRandom, type Outcome } from "../arcade.ts";

// mn-15 방 정리: one thing at a time lands on the floor; tap where it belongs — toy box, bookshelf
// or wardrobe. 60 s, 12 things, 3 mistakes.
export const TIDY_GOAL = 12;
export const TIDY_MISSES = 3;
export const TIDY_SECONDS = 60;
export type Zone = "toys" | "books" | "clothes";
export const ZONES: readonly Zone[] = ["toys", "books", "clothes"];
export const THINGS: readonly { icon: string; name: string; zone: Zone }[] = [
  { icon: "🧸", name: "곰 인형", zone: "toys" },
  { icon: "🚗", name: "장난감 차", zone: "toys" },
  { icon: "🪀", name: "요요", zone: "toys" },
  { icon: "🧩", name: "퍼즐", zone: "toys" },
  { icon: "📕", name: "빨간 책", zone: "books" },
  { icon: "📘", name: "파란 책", zone: "books" },
  { icon: "📒", name: "공책", zone: "books" },
  { icon: "👕", name: "티셔츠", zone: "clothes" },
  { icon: "🧦", name: "양말", zone: "clothes" },
  { icon: "🧢", name: "모자", zone: "clothes" },
  { icon: "👖", name: "바지", zone: "clothes" },
];
export type TidyGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  thing: number;
  seed: number;
};
function nextThing(prev: number, seed: number): [number, number] {
  let r: number;
  let s = seed;
  let pick = prev;
  while (pick === prev) {
    [r, s] = nextRandom(s);
    pick = Math.min(THINGS.length - 1, Math.floor(r * THINGS.length));
  }
  return [pick, s];
}
export function createTidy(seed = 1): TidyGame {
  const [thing, s] = nextThing(-1, seed);
  return { outcome: "playing", score: 0, misses: 0, remaining: TIDY_SECONDS, thing, seed: s };
}
export function putAway(g: TidyGame, zone: Zone): TidyGame {
  if (g.outcome !== "playing") return g;
  if (THINGS[g.thing]!.zone !== zone) {
    const misses = g.misses + 1;
    return { ...g, misses, outcome: misses >= TIDY_MISSES ? "lost" : "playing" };
  }
  const score = g.score + 1;
  if (score >= TIDY_GOAL) return { ...g, score, outcome: "won" };
  const [thing, seed] = nextThing(g.thing, g.seed);
  return { ...g, score, thing, seed };
}
export function tickTidy(g: TidyGame, dt: number): TidyGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const remaining = Math.max(0, g.remaining - Math.min(dt, 0.25));
  return { ...g, remaining, outcome: remaining === 0 ? "lost" : "playing" };
}
