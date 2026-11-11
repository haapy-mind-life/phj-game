import { nextRandom, type Outcome } from "../arcade.ts";

// lg-05 지구 탐험: a picture clue (an animal, a famous building or a food) shows where to fly
// next; tap that continent on the map to get a passport stamp. Stage time per clue shrinks
// (10 → 7 → 5 s). Eight stamps, 3 mistakes (a wrong continent or running out of time).
export const EARTH_GOAL = 8;
export const EARTH_MISSES = 3;
export const CONTINENTS = [
  "아시아",
  "유럽",
  "아프리카",
  "북아메리카",
  "남아메리카",
  "오세아니아",
] as const;
export type Continent = (typeof CONTINENTS)[number];
/** Well-known, friendly clues with one clear answer each. */
export const CLUES: readonly { icon: string; name: string; at: Continent }[] = [
  { icon: "🐼", name: "판다", at: "아시아" },
  { icon: "🏯", name: "옛 성", at: "아시아" },
  { icon: "🗼", name: "에펠탑", at: "유럽" },
  { icon: "🥐", name: "크루아상", at: "유럽" },
  { icon: "🦁", name: "사자", at: "아프리카" },
  { icon: "🦒", name: "기린", at: "아프리카" },
  { icon: "🗽", name: "자유의 여신상", at: "북아메리카" },
  { icon: "🦬", name: "들소", at: "북아메리카" },
  { icon: "🦙", name: "라마", at: "남아메리카" },
  { icon: "🦜", name: "앵무새", at: "남아메리카" },
  { icon: "🦘", name: "캥거루", at: "오세아니아" },
  { icon: "🐨", name: "코알라", at: "오세아니아" },
];
export const clueSeconds = (stage: number) => [10, 7, 5][stage - 1] ?? 5;
export type EarthGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  misses: number;
  clue: number;
  left: number;
  seed: number;
};
export const earthStage = (score: number) => (score < 3 ? 1 : score < 6 ? 2 : 3) as 1 | 2 | 3;
function nextClue(g: EarthGame): EarthGame {
  let r: number;
  let { seed } = g;
  let clue = g.clue;
  while (clue === g.clue) {
    [r, seed] = nextRandom(seed);
    clue = Math.min(CLUES.length - 1, Math.floor(r * CLUES.length));
  }
  return { ...g, seed, clue, left: clueSeconds(g.stage) };
}
export const createEarth = (seed = 1): EarthGame =>
  nextClue({ outcome: "playing", score: 0, stage: 1, misses: 0, clue: -1, left: 0, seed });
function miss(g: EarthGame): EarthGame {
  const misses = g.misses + 1;
  if (misses >= EARTH_MISSES) return { ...g, misses, outcome: "lost" };
  return nextClue({ ...g, misses });
}
export function flyTo(g: EarthGame, c: Continent): EarthGame {
  if (g.outcome !== "playing" || !CONTINENTS.includes(c)) return g;
  if (CLUES[g.clue]!.at !== c) return miss(g);
  const score = g.score + 1;
  if (score >= EARTH_GOAL) return { ...g, score, outcome: "won" };
  return nextClue({ ...g, score, stage: earthStage(score) });
}
export function tickEarth(g: EarthGame, dt: number): EarthGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const left = g.left - Math.min(dt, 0.25);
  return left <= 0 ? miss(g) : { ...g, left };
}

/** "판다는", "자유의 여신상은": 은 after a final consonant, 는 otherwise. */
export function topic(name: string): string {
  const last = name.charCodeAt(name.length - 1);
  const hangul = last >= 0xac00 && last <= 0xd7a3;
  return name + (hangul && (last - 0xac00) % 28 !== 0 ? "은" : "는");
}
