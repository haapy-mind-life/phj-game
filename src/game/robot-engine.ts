import {
  CARD_USES_TO_UNLOCK,
  ROBOTS,
  isRobotId,
  robotById,
  type RobotSpeciesId,
} from "./robot-catalog.ts";

export type RobotCard = { uses: number };
/** Saved robot progress: only ids and counts, never positions (03_ENGINEERING_PLAN.md §3). */
export type RobotProgress = { cards: Partial<Record<RobotSpeciesId, RobotCard>> };
export const emptyRobots = (): RobotProgress => ({ cards: {} });
export function normalizeRobots(input: unknown): RobotProgress {
  const raw =
    input !== null && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const cards =
    raw["cards"] !== null && typeof raw["cards"] === "object" && !Array.isArray(raw["cards"])
      ? (raw["cards"] as Record<string, unknown>)
      : {};
  const out: RobotProgress = emptyRobots();
  for (const [id, value] of Object.entries(cards)) {
    if (!isRobotId(id)) continue;
    const uses = (value as Record<string, unknown> | null)?.["uses"];
    out.cards[id] = {
      uses:
        typeof uses === "number" && Number.isFinite(uses)
          ? Math.min(CARD_USES_TO_UNLOCK, Math.max(0, Math.floor(uses)))
          : 0,
    };
  }
  // A full card always owns what it opens, even if an older save lost the unlocked card.
  for (const robot of ROBOTS)
    if (robot.unlocks && out.cards[robot.id]?.uses === CARD_USES_TO_UNLOCK)
      out.cards[robot.unlocks] ??= { uses: 0 };
  return out;
}
export const hasCard = (p: RobotProgress, id: RobotSpeciesId) => p.cards[id] !== undefined;
/** Meeting a robot hands over its card once; meeting it again changes nothing. */
export function meetRobot(p: RobotProgress, id: RobotSpeciesId): RobotProgress {
  if (hasCard(p, id)) return p;
  return { cards: { ...p.cards, [id]: { uses: 0 } } };
}
export type CardUse = { progress: RobotProgress; unlocked: RobotSpeciesId | null };
/** One card use. The 7th use opens the next robot card exactly once; a full card stays full. */
export function applyCardUse(p: RobotProgress, id: RobotSpeciesId): CardUse {
  const card = p.cards[id];
  if (!card || card.uses >= CARD_USES_TO_UNLOCK) return { progress: p, unlocked: null };
  const uses = card.uses + 1;
  const next = robotById(id).unlocks;
  const unlocked = uses === CARD_USES_TO_UNLOCK && next && !hasCard(p, next) ? next : null;
  return {
    progress: {
      cards: { ...p.cards, [id]: { uses }, ...(unlocked ? { [unlocked]: { uses: 0 } } : {}) },
    },
    unlocked,
  };
}
