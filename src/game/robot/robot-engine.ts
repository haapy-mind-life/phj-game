import type { Point } from "../world/adventure.ts";
import {
  CARD_USES_TO_UNLOCK,
  MAX_FUSION,
  MAX_GRADE,
  MISSION_PARTS,
  ROBOTS,
  UPGRADE_COST,
  VILLAIN_RESPAWN_MS,
  WIN_PARTS,
  isLegendId,
  isRobotId,
  robotById,
  type RobotSpeciesId,
  type Weapon,
} from "./robot-catalog.ts";
import { worldDistance } from "../world/world-space.ts";

export type RobotCard = { uses: number; grade: number };
/** Saved robot progress: only ids and counts, never positions (03_ENGINEERING_PLAN.md §3). */
export type RobotProgress = {
  cards: Partial<Record<RobotSpeciesId, RobotCard>>;
  /** Upgrade parts won on missions. */
  parts: number;
  /** Villain wins; each win makes the next villain a little tougher. */
  wins: number;
  rescues: number;
  catches: number;
  /** Biggest fusion made so far, and how many fusions in total (watch progress). */
  fusionBest: number;
  fusionCount: number;
  /** Robot army (v3): finished 100-robot fusions, giant boss wins and minion waves cleared. */
  massFusions: number;
  bossWins: number;
  minionWaves: number;
};
export const emptyRobots = (): RobotProgress => ({
  cards: {},
  parts: 0,
  wins: 0,
  rescues: 0,
  catches: 0,
  fusionBest: 1,
  fusionCount: 0,
  massFusions: 0,
  bossWins: 0,
  minionWaves: 0,
});
const count = (v: unknown, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0;
const record = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
/**
 * Reads every robot save shape that has existed: main (`uses` only), the villain branch
 * (`parts`, `wins`, per-card `grade`) and the draft watch branch (`materials`, one global
 * `grade`, `settled`, `fusionBest`, `fusionCount`).
 */
export function normalizeRobots(input: unknown): RobotProgress {
  const raw = record(input);
  const watchGrade = count(raw["grade"], MAX_GRADE);
  const out: RobotProgress = {
    cards: {},
    parts: Math.min(999, Math.max(count(raw["parts"], 999), count(raw["materials"], 999))),
    wins: count(raw["wins"], 1e6),
    rescues: count(raw["rescues"], 1e6),
    catches: count(raw["catches"], 1e6),
    fusionBest: Math.max(1, count(raw["fusionBest"], MAX_FUSION)),
    fusionCount: count(raw["fusionCount"], 1e6),
    massFusions: count(raw["massFusions"], 1e6),
    bossWins: count(raw["bossWins"], 1e6),
    minionWaves: count(raw["minionWaves"], 1e6),
  };
  for (const [id, value] of Object.entries(record(raw["cards"]))) {
    if (!isRobotId(id)) continue;
    const card = record(value);
    const uses = count(card["uses"], CARD_USES_TO_UNLOCK);
    out.cards[id] = {
      uses,
      // A full card has always powered its robot up, even in saves from before grades.
      grade: Math.max(
        count(card["grade"], MAX_GRADE),
        watchGrade,
        uses === CARD_USES_TO_UNLOCK ? 1 : 0,
      ),
    };
  }
  // The draft watch branch kept one grade for the whole watch: every starter robot had it.
  if (watchGrade > 0)
    for (const robot of ROBOTS)
      if (robot.starter) out.cards[robot.id] ??= { uses: 0, grade: watchGrade };
  // A full card always owns what it opens, even if an older save lost the unlocked card.
  for (const robot of ROBOTS)
    if (robot.unlocks && out.cards[robot.id]?.uses === CARD_USES_TO_UNLOCK)
      out.cards[robot.unlocks] ??= { uses: 0, grade: 0 };
  return out;
}
export const hasCard = (p: RobotProgress, id: RobotSpeciesId) => p.cards[id] !== undefined;
/** Starter cards are stored in the watch from the start; no card has to be found or inserted. */
export const isWatchCardAvailable = (p: RobotProgress, id: RobotSpeciesId) =>
  robotById(id).starter || hasCard(p, id);
export const gradeOf = (p: RobotProgress, id: RobotSpeciesId) => p.cards[id]?.grade ?? 0;
/** Meeting a legend in the world stores its card in the watch, once. */
export function discoverLegend(p: RobotProgress, id: RobotSpeciesId): RobotProgress {
  if (!isLegendId(id) || hasCard(p, id)) return p;
  return { ...p, cards: { ...p.cards, [id]: { uses: 0, grade: 0 } } };
}
export const ARMY_REWARD = { massFusions: 0, bossWins: 6, minionWaves: 2 } as const;
/** Army results pay once: `n` must be the next count, so repeats and reloads change nothing. */
export function armyResult(
  p: RobotProgress,
  kind: "massFusions" | "bossWins" | "minionWaves",
  n: number,
): RobotProgress {
  if (n !== p[kind] + 1) return p;
  return { ...p, [kind]: n, parts: Math.min(999, p.parts + ARMY_REWARD[kind]) };
}
/** The first summon writes the starter card into the saved watch; later summons change nothing. */
export function meetRobot(p: RobotProgress, id: RobotSpeciesId): RobotProgress {
  if (hasCard(p, id) || !isWatchCardAvailable(p, id)) return p;
  return { ...p, cards: { ...p.cards, [id]: { uses: 0, grade: 0 } } };
}
export type CardUse = {
  progress: RobotProgress;
  unlocked: RobotSpeciesId | null;
  poweredUp: boolean;
};
/**
 * One valid skill use. The 7th use powers this robot up to 강화 and opens the next robot card,
 * both exactly once; a full card stays full.
 */
export function applyCardUse(p: RobotProgress, id: RobotSpeciesId): CardUse {
  const card = p.cards[id];
  if (!card || card.uses >= CARD_USES_TO_UNLOCK)
    return { progress: p, unlocked: null, poweredUp: false };
  const uses = card.uses + 1;
  const full = uses === CARD_USES_TO_UNLOCK;
  const next = robotById(id).unlocks;
  const unlocked = full && next && !hasCard(p, next) ? next : null;
  const grade = full ? Math.max(card.grade, 1) : card.grade;
  return {
    progress: {
      ...p,
      cards: {
        ...p.cards,
        [id]: { uses, grade },
        ...(unlocked ? { [unlocked]: { uses: 0, grade: 0 } } : {}),
      },
    },
    unlocked,
    poweredUp: grade > card.grade,
  };
}
/** Pays a villain win once: `win` must be the next win number, so a repeated dispatch is a no-op. */
export function winBattle(p: RobotProgress, win: number): RobotProgress {
  if (win !== p.wins + 1) return p;
  return { ...p, wins: win, parts: Math.min(999, p.parts + WIN_PARTS) };
}
/** Same once-only rule for rescues and thief catches. */
export function missionReward(
  p: RobotProgress,
  mode: "rescue" | "thief",
  n: number,
): RobotProgress {
  const key = mode === "rescue" ? "rescues" : "catches";
  if (n !== p[key] + 1) return p;
  return { ...p, [key]: n, parts: Math.min(999, p.parts + MISSION_PARTS) };
}
/** Workshop upgrades always succeed; failing never costs the robot or its parts (R1). */
export function upgradeRobot(p: RobotProgress, id: RobotSpeciesId): RobotProgress {
  const card = p.cards[id];
  if (!card || card.grade >= MAX_GRADE || p.parts < UPGRADE_COST) return p;
  return {
    ...p,
    parts: p.parts - UPGRADE_COST,
    cards: { ...p.cards, [id]: { ...card, grade: card.grade + 1 } },
  };
}
/** 2 or 3 different robots that are all in the watch. */
export const validFusion = (p: RobotProgress, ids: readonly RobotSpeciesId[]) =>
  ids.length >= 2 &&
  ids.length <= MAX_FUSION &&
  new Set(ids).size === ids.length &&
  ids.every((id) => isRobotId(id) && isWatchCardAvailable(p, id));
/** Records a finished fusion in the watch; members' cards and grades are untouched. */
export function recordFusion(p: RobotProgress, ids: readonly RobotSpeciesId[]): RobotProgress {
  if (!validFusion(p, ids)) return p;
  const cards = { ...p.cards };
  for (const id of ids) cards[id] ??= { uses: 0, grade: 0 };
  return {
    ...p,
    cards,
    fusionBest: Math.max(p.fusionBest, ids.length),
    fusionCount: Math.min(1e6, p.fusionCount + 1),
  };
}
/** Each robot in the team adds its strength; upgraded robots hit harder. */
export const teamPower = (p: RobotProgress, team: readonly RobotSpeciesId[]) =>
  team.reduce((sum, id) => sum + 1 + gradeOf(p, id), 0);
/** A fusion fights with the weapon on its arms (2nd member) and reaches further per member. */
export function teamWeapon(team: readonly RobotSpeciesId[]): Weapon {
  const arms = robotById(team[1] ?? team[0]!);
  return { ...arms.weapon, range: arms.weapon.range + 40 * (team.length - 1) };
}
export type Strike = "hit" | "far" | "cooldown";
/**
 * The single judgement used for damage, rescues, captures and the 7-use count, so they can
 * never disagree: too far or still cooling down means nothing happens and nothing is counted.
 */
export function resolveStrike(
  weapon: Weapon,
  from: Point,
  target: Point,
  now: number,
  lastStrike: number,
): Strike {
  if (now - lastStrike < weapon.cooldownMs) return "cooldown";
  return worldDistance(from, target) <= weapon.range ? "hit" : "far";
}
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
