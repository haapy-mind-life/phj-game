import {
  CARD_USES_TO_UNLOCK,
  MAX_FUSION,
  MAX_GRADE,
  ROBOTS,
  UPGRADE_COST,
  VILLAIN_RESPAWN_MS,
  WIN_PARTS,
  isRobotId,
  robotById,
  type RobotSpeciesId,
} from "./robot-catalog.ts";

export type RobotCard = { uses: number; grade: number };
/** Saved robot progress: only ids and counts, never positions (03_ENGINEERING_PLAN.md §3). */
export type RobotProgress = {
  cards: Partial<Record<RobotSpeciesId, RobotCard>>;
  /** Upgrade parts won from villains. */
  parts: number;
  /** Villain wins; each win makes the next villain a little tougher. */
  wins: number;
};
export const emptyRobots = (): RobotProgress => ({ cards: {}, parts: 0, wins: 0 });
const count = (v: unknown, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0;
const record = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
export function normalizeRobots(input: unknown): RobotProgress {
  const raw = record(input);
  const out: RobotProgress = {
    cards: {},
    parts: count(raw["parts"], 999),
    wins: count(raw["wins"], 1e6),
  };
  for (const [id, value] of Object.entries(record(raw["cards"]))) {
    if (!isRobotId(id)) continue;
    const card = record(value);
    out.cards[id] = {
      uses: count(card["uses"], CARD_USES_TO_UNLOCK),
      grade: count(card["grade"], MAX_GRADE),
    };
  }
  // A full card always owns what it opens, even if an older save lost the unlocked card.
  for (const robot of ROBOTS)
    if (robot.unlocks && out.cards[robot.id]?.uses === CARD_USES_TO_UNLOCK)
      out.cards[robot.unlocks] ??= { uses: 0, grade: 0 };
  return out;
}
export const hasCard = (p: RobotProgress, id: RobotSpeciesId) => p.cards[id] !== undefined;
export const gradeOf = (p: RobotProgress, id: RobotSpeciesId) => p.cards[id]?.grade ?? 0;
/** Meeting a robot hands over its card once; meeting it again changes nothing. */
export function meetRobot(p: RobotProgress, id: RobotSpeciesId): RobotProgress {
  if (hasCard(p, id)) return p;
  return { ...p, cards: { ...p.cards, [id]: { uses: 0, grade: 0 } } };
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
      ...p,
      cards: {
        ...p.cards,
        [id]: { ...card, uses },
        ...(unlocked ? { [unlocked]: { uses: 0, grade: 0 } } : {}),
      },
    },
    unlocked,
  };
}
/** Pays a villain win once: `win` must be the next win number, so a repeated dispatch is a no-op. */
export function winBattle(p: RobotProgress, win: number): RobotProgress {
  if (win !== p.wins + 1) return p;
  return { ...p, wins: win, parts: Math.min(999, p.parts + WIN_PARTS) };
}
/** Phase 1 upgrades always succeed; failing never costs the robot or its parts (R1). */
export function upgradeRobot(p: RobotProgress, id: RobotSpeciesId): RobotProgress {
  const card = p.cards[id];
  if (!card || card.grade >= MAX_GRADE || p.parts < UPGRADE_COST) return p;
  return {
    ...p,
    parts: p.parts - UPGRADE_COST,
    cards: { ...p.cards, [id]: { ...card, grade: card.grade + 1 } },
  };
}
/** Owned robots that can join the ridden one, in catalog order. */
export function fusionTeam(p: RobotProgress, core: RobotSpeciesId, size: number) {
  const others = ROBOTS.filter((r) => r.id !== core && hasCard(p, r.id)).map((r) => r.id);
  return [core, ...others].slice(0, Math.max(1, Math.min(MAX_FUSION, size)));
}
export const maxFusion = (p: RobotProgress) =>
  Math.min(MAX_FUSION, ROBOTS.filter((r) => hasCard(p, r.id)).length);
/** Each robot in the fusion adds its strength; upgraded robots hit harder. */
export const teamPower = (p: RobotProgress, team: RobotSpeciesId[]) =>
  team.reduce((sum, id) => sum + 1 + gradeOf(p, id), 0);
export const villainMaxHp = (wins: number) => Math.min(30, 4 + 2 * wins);
export type Villain = { hp: number; max: number; retreating: boolean; back: number };
export const freshVillain = (wins: number): Villain => ({
  hp: villainMaxHp(wins),
  max: villainMaxHp(wins),
  retreating: false,
  back: 0,
});
/** A beaten villain is switched off and retreats for repairs, then comes back (no injuries). */
export function hitVillain(v: Villain, damage: number, now: number) {
  if (v.retreating) return { villain: v, defeated: false };
  const hp = Math.max(0, v.hp - Math.max(1, damage));
  return hp > 0
    ? { villain: { ...v, hp }, defeated: false }
    : { villain: { ...v, hp, retreating: true, back: now + VILLAIN_RESPAWN_MS }, defeated: true };
}
