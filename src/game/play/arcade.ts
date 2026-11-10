// The kart minigames that run on the shared arcade shell (/mini/$game). One table drives the
// route, the reward, the best score in the save and the catalog link, so a new game is one row.
// Rewards stay in line with 땅콩 톡톡 (8 × 4 + 10 = 42 coins at most per finished run).

export const ARCADE = [
  { key: "balloons", catalogId: "mn-02", name: "박현준 풍선 터뜨리기", goal: 10, coinsPerPoint: 3 },
  { key: "coins", catalogId: "mn-04", name: "박현준 코인 톡톡", goal: 15, coinsPerPoint: 2 },
  { key: "jump", catalogId: "mn-05", name: "박현준 빠른 점프", goal: 12, coinsPerPoint: 2 },
  { key: "dodge", catalogId: "mn-17", name: "박현준 장애물 피하기", goal: 20, coinsPerPoint: 1 },
  { key: "cloud", catalogId: "mn-12", name: "박현준 구름 뛰기", goal: 10, coinsPerPoint: 3 },
  { key: "surf", catalogId: "mn-13", name: "박현준 파도타기", goal: 25, coinsPerPoint: 1 },
  { key: "water", catalogId: "mn-11", name: "박현준 물주기", goal: 8, coinsPerPoint: 4 },
  { key: "range", catalogId: "mn-20", name: "박현준 로봇 사격장", goal: 15, coinsPerPoint: 2 },
  { key: "cook", catalogId: "mn-14", name: "박현준 음식 만들기", goal: 6, coinsPerPoint: 5 },
  { key: "tidy", catalogId: "mn-15", name: "박현준 방 정리", goal: 12, coinsPerPoint: 2 },
  { key: "box", catalogId: "mn-18", name: "박현준 박스 열기", goal: 5, coinsPerPoint: 6 },
  { key: "assemble", catalogId: "mn-09", name: "박현준 로봇 조립", goal: 4, coinsPerPoint: 8 },
  { key: "spot", catalogId: "mn-03", name: "박현준 숨은 로봇 찾기", goal: 10, coinsPerPoint: 3 },
  { key: "hint", catalogId: "mn-10", name: "박현준 전설 힌트 찾기", goal: 6, coinsPerPoint: 5 },
  { key: "rescue", catalogId: "mn-16", name: "박현준 친구 구하기", goal: 4, coinsPerPoint: 8 },
  { key: "park", catalogId: "mn-19", name: "박현준 자동차 주차", goal: 5, coinsPerPoint: 6 },
  { key: "starhop", catalogId: "mn-01", name: "박현준 별빛 모으기", goal: 15, coinsPerPoint: 2 },
  { key: "fishking", catalogId: "mn-06", name: "박현준 낚시왕", goal: 5, coinsPerPoint: 6 },
  { key: "dig", catalogId: "mn-07", name: "박현준 보물찾기", goal: 3, coinsPerPoint: 10 },
] as const;

export type ArcadeKey = (typeof ARCADE)[number]["key"];
export type ArcadeInfo = (typeof ARCADE)[number];
export const MINI_COMPLETION_BONUS = 10;

export const isArcadeKey = (v: unknown): v is ArcadeKey => ARCADE.some((g) => g.key === v);
export const arcadeInfo = (key: ArcadeKey): ArcadeInfo => ARCADE.find((g) => g.key === key)!;

/** Coins for one finished run: points up to the goal, plus the completion bonus at the goal. */
export function arcadeReward(key: ArcadeKey, score: number): number {
  const { goal, coinsPerPoint } = arcadeInfo(key);
  const points = Number.isFinite(score) ? Math.min(goal, Math.max(0, Math.floor(score))) : 0;
  return points * coinsPerPoint + (points === goal ? MINI_COMPLETION_BONUS : 0);
}

/** Best scores from any save: unknown games dropped, missing ones 0, values clamped to the goal. */
export function normalizeArcadeBest(raw: unknown): Record<ArcadeKey, number> {
  const obj =
    raw !== null && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    ARCADE.map((g) => {
      const v = obj[g.key];
      return [
        g.key,
        typeof v === "number" && Number.isFinite(v)
          ? Math.min(g.goal, Math.max(0, Math.floor(v)))
          : 0,
      ];
    }),
  ) as Record<ArcadeKey, number>;
}

/** One step of a seeded random source kept in game state: [value in [0, 1), next seed]. */
export function nextRandom(seed: number): [number, number] {
  const next = (Math.imul(Math.floor(seed) >>> 0 || 1, 1664525) + 1013904223) >>> 0;
  return [next / 4294967296, next];
}
export type Outcome = "playing" | "won" | "lost";

/** A small seeded random source so every engine can be tested move by move. */
export function seeded(seed: number): () => number {
  let s = Math.floor(seed) >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
