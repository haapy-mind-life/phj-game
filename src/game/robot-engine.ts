import {
  CARD_USES_TO_UNLOCK,
  ROBOTS,
  isRobotId,
  robotById,
  type RobotMissionMode,
  type RobotSpeciesId,
} from "./robot-catalog.ts";

export type RobotCard = { uses: number };
/** Local-only watch state. No robot positions or animations are saved. */
export type RobotProgress = {
  cards: Partial<Record<RobotSpeciesId, RobotCard>>;
  fusionBest: number;
  fusionCount: number;
  wins: number;
  materials: number;
  grade: number;
  settled: string[];
};
export const WATCH_GRADES = ["일반", "강철", "황금", "다이아몬드"] as const;
export const upgradeCost = (grade: number) => [3, 6, 10][grade] ?? Infinity;
export const emptyRobots = (): RobotProgress => ({
  cards: {},
  fusionBest: 1,
  fusionCount: 0,
  wins: 0,
  materials: 0,
  grade: 0,
  settled: [],
});
const finiteCount = (value: unknown, max: number, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(max, Math.floor(value)))
    : fallback;

export function normalizeRobots(input: unknown): RobotProgress {
  const raw =
    input !== null && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const cards =
    raw["cards"] !== null && typeof raw["cards"] === "object" && !Array.isArray(raw["cards"])
      ? (raw["cards"] as Record<string, unknown>)
      : {};
  const out: RobotProgress = {
    ...emptyRobots(),
    fusionBest: Math.max(1, finiteCount(raw["fusionBest"], 3, 1)),
    fusionCount: finiteCount(raw["fusionCount"], 100000),
    wins: finiteCount(raw["wins"], 100000),
    materials: finiteCount(raw["materials"], 10000),
    grade: finiteCount(raw["grade"], WATCH_GRADES.length - 1),
    settled: Array.isArray(raw["settled"])
      ? raw["settled"]
          .filter((id): id is string => typeof id === "string" && id.length > 0 && id.length < 100)
          .slice(-50)
      : [],
  };
  for (const [id, value] of Object.entries(cards)) {
    if (!isRobotId(id)) continue;
    const uses =
      value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)["uses"]
        : undefined;
    out.cards[id] = { uses: finiteCount(uses, CARD_USES_TO_UNLOCK) };
  }
  // An unlocked card is never lost when loading an older save.
  for (const robot of ROBOTS)
    if (robot.unlocks && out.cards[robot.id]?.uses === CARD_USES_TO_UNLOCK)
      out.cards[robot.unlocks] ??= { uses: 0 };
  return out;
}

export const hasCard = (p: RobotProgress, id: RobotSpeciesId) => p.cards[id] !== undefined;
/** Starter cards are pictured in the watch immediately; no physical card insertion is needed. */
export const isWatchCardAvailable = (p: RobotProgress, id: RobotSpeciesId) =>
  robotById(id).starter || hasCard(p, id);
/** First summons register the chosen starter card in the saved watch. */
export function meetRobot(p: RobotProgress, id: RobotSpeciesId): RobotProgress {
  if (hasCard(p, id)) return p;
  return { ...p, cards: { ...p.cards, [id]: { uses: 0 } } };
}
export type CardUse = { progress: RobotProgress; unlocked: RobotSpeciesId | null };
/** Each valid mission action uses a saved card. The 7th use opens an upgrade once. */
export function applyCardUse(p: RobotProgress, id: RobotSpeciesId): CardUse {
  const card = p.cards[id];
  if (!card || card.uses >= CARD_USES_TO_UNLOCK) return { progress: p, unlocked: null };
  const uses = card.uses + 1;
  const next = robotById(id).unlocks;
  const unlocked = uses === CARD_USES_TO_UNLOCK && next && !hasCard(p, next) ? next : null;
  return {
    progress: {
      ...p,
      cards: { ...p.cards, [id]: { uses }, ...(unlocked ? { [unlocked]: { uses: 0 } } : {}) },
    },
    unlocked,
  };
}
/** 2- and 3-robot fusion. Each member must be distinct and available in the watch. */
export function applyRobotFusion(p: RobotProgress, ids: readonly RobotSpeciesId[]): RobotProgress {
  if (ids.length < 2 || ids.length > 3 || new Set(ids).size !== ids.length) return p;
  if (ids.some((id) => !isRobotId(id) || !isWatchCardAvailable(p, id))) return p;
  return {
    ...p,
    cards: ids.reduce((cards, id) => ({ ...cards, [id]: p.cards[id] ?? { uses: 0 } }), p.cards),
    fusionBest: Math.max(p.fusionBest, ids.length),
    fusionCount: Math.min(100000, p.fusionCount + 1),
  };
}
/** Rewards are idempotent across rapid double taps and reloads. */
export function awardRobotMission(
  p: RobotProgress,
  id: string,
  mode: RobotMissionMode,
): RobotProgress {
  if (!id || id.length >= 100 || p.settled.includes(id)) return p;
  const reward = mode === "villain" ? 3 : mode === "rescue" ? 2 : 2;
  return {
    ...p,
    wins: Math.min(100000, p.wins + 1),
    materials: Math.min(10000, p.materials + reward),
    settled: [...p.settled, id].slice(-50),
  };
}
/** Upgrades are guaranteed; cards, robot components and progress are never consumed. */
export function upgradeRobotGrade(p: RobotProgress): RobotProgress {
  const cost = upgradeCost(p.grade);
  if (p.grade >= WATCH_GRADES.length - 1 || p.materials < cost) return p;
  return { ...p, grade: p.grade + 1, materials: p.materials - cost };
}
