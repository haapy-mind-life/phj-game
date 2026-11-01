import type { Point } from "../world/adventure.ts";
import type { LegendId, RobotSpeciesId } from "./robot-catalog.ts";
import { worldDistance, wrapPoint } from "../world/world-space.ts";

// The robot army (requirements v3, RA-100/101): exactly 100 robots that live in the world as
// separate instances. Positions are a pure function of (robot, time), so nothing about them is
// saved, every robot is still where it should be after map travel or a reload, and one clock
// moves all of them.
export type SquadBehavior = "patrol" | "drill";
type ArmyLegendId = LegendId;
/** Regular members wear the look of one of the watch robots; legends are their own robots. */
export type ArmySpecies = RobotSpeciesId;
export type Squad = {
  id: string;
  /** Village (or area) the squad belongs to. */
  region: string;
  anchor: Point;
  behavior: SquadBehavior;
  /** Drill squads march along this axis. */
  axis: "x" | "y";
};
export type ArmyRobot = {
  instanceId: string;
  squadId: string;
  /** 0 is the squad leader. */
  slot: number;
  species: ArmySpecies;
  legendary: boolean;
  /** Small look variations (insignia colour/number) so the army isn't a row of clones. */
  variant: number;
};
export const ARMY_SIZE = 100;
export const SQUAD_SIZE = 5;
export const PATROL_HALF = 110;
export const PATROL_PERIOD = 36;
export const DRILL_HALF = 130;
export const DRILL_PERIOD = 24;
/** Formation offsets in the squad's own frame (forward = +x). */
const FORMATIONS: Record<SquadBehavior, readonly Point[]> = {
  // Patrol squads walk in a column along their route (see armyPosition).
  patrol: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  // Shoulder-to-shoulder line while drilling.
  drill: [
    { x: 0, y: 0 },
    { x: 0, y: -45 },
    { x: 0, y: 45 },
    { x: 0, y: -90 },
    { x: 0, y: 90 },
  ],
};
/**
 * Squad homes, chosen offline so every member's whole route is open ground and clear of
 * doors, stations and mission places (checked in robot-army.test.ts). Six squads live
 * around the start; the rest are spread over the new villages.
 */
export const SQUADS: readonly Squad[] = [
  { id: "squad-01", region: "home", anchor: { x: -40, y: 380 }, behavior: "patrol", axis: "y" },
  { id: "squad-02", region: "character", anchor: { x: 860, y: 305 }, behavior: "drill", axis: "x" },
  { id: "squad-03", region: "chief", anchor: { x: 2824, y: 266 }, behavior: "patrol", axis: "y" },
  { id: "squad-04", region: "infinite", anchor: { x: 459, y: 1828 }, behavior: "drill", axis: "y" },
  { id: "squad-05", region: "farm", anchor: { x: 1907, y: 1868 }, behavior: "patrol", axis: "y" },
  { id: "squad-06", region: "wetland", anchor: { x: 3308, y: 230 }, behavior: "drill", axis: "x" },
  { id: "squad-07", region: "new-1", anchor: { x: 1045, y: 2420 }, behavior: "patrol", axis: "y" },
  { id: "squad-08", region: "new-2", anchor: { x: 3878, y: 3290 }, behavior: "drill", axis: "y" },
  { id: "squad-09", region: "new-3", anchor: { x: 6504, y: 3386 }, behavior: "patrol", axis: "y" },
  { id: "squad-10", region: "new-4", anchor: { x: 12950, y: 3260 }, behavior: "drill", axis: "x" },
  { id: "squad-11", region: "new-5", anchor: { x: 17104, y: 3386 }, behavior: "patrol", axis: "y" },
  { id: "squad-12", region: "new-6", anchor: { x: 1278, y: 5490 }, behavior: "drill", axis: "y" },
  { id: "squad-13", region: "new-7", anchor: { x: 3904, y: 5586 }, behavior: "patrol", axis: "y" },
  { id: "squad-14", region: "new-8", anchor: { x: 6550, y: 5460 }, behavior: "drill", axis: "x" },
  { id: "squad-15", region: "new-9", anchor: { x: 12904, y: 5586 }, behavior: "patrol", axis: "y" },
  { id: "squad-16", region: "new-10", anchor: { x: 17078, y: 5490 }, behavior: "drill", axis: "y" },
  { id: "squad-17", region: "new-11", anchor: { x: 1304, y: 7786 }, behavior: "patrol", axis: "y" },
  { id: "squad-18", region: "new-12", anchor: { x: 3950, y: 7660 }, behavior: "drill", axis: "x" },
  { id: "squad-19", region: "new-13", anchor: { x: 6504, y: 7786 }, behavior: "patrol", axis: "y" },
  { id: "squad-20", region: "new-14", anchor: { x: 12878, y: 7690 }, behavior: "drill", axis: "y" },
];
const REGULAR: readonly ArmySpecies[] = [
  "rb-police",
  "rb-fire",
  "rb-sky",
  "rb-thunder-police",
  "rb-volcano-fire",
  "rb-laser-sky",
];
/** Six squads are led by one legend each (RAQ-03 provisional: legends are part of the 100). */
export const LEGEND_SQUADS: Readonly<Record<ArmyLegendId, number>> = {
  "lg-shield": 1,
  "lg-thunder": 2,
  "lg-wing": 4,
  "lg-steel": 6,
  "lg-deep": 11,
  "lg-guardian": 16,
};
export const ARMY: readonly ArmyRobot[] = SQUADS.flatMap((squad, s) =>
  Array.from({ length: SQUAD_SIZE }, (_, slot): ArmyRobot => {
    const legend = (Object.keys(LEGEND_SQUADS) as ArmyLegendId[]).find(
      (id) => LEGEND_SQUADS[id] === s && slot === 0,
    );
    const n = s * SQUAD_SIZE + slot;
    return {
      instanceId: `army-${String(n + 1).padStart(3, "0")}`,
      squadId: squad.id,
      slot,
      species: legend ?? REGULAR[(s * 2 + slot) % REGULAR.length]!,
      legendary: !!legend,
      variant: (n * 7) % 5,
    };
  }),
);
const squadById = new Map<string, Squad>();
const indexById = new Map<string, number>();
export const squadOf = (robot: ArmyRobot) => squadById.get(robot.squadId)!;
export const robotIndex = (instanceId: string) => indexById.get(instanceId) ?? -1;
export const armyRobot = (instanceId: string) => ARMY[robotIndex(instanceId)];

/** Where the squad's leader is and which way the squad faces, at `seconds`. */
export function squadPose(squad: Squad, seconds: number): { at: Point; heading: number } {
  if (squad.behavior === "patrol") {
    // Walk the square around home at a steady pace.
    const side = PATROL_HALF * 2;
    const d = ((((seconds / PATROL_PERIOD) % 1) + 1) % 1) * side * 4;
    const leg = Math.floor(d / side);
    const along = d - leg * side;
    const corners = [
      { x: -PATROL_HALF, y: -PATROL_HALF },
      { x: PATROL_HALF, y: -PATROL_HALF },
      { x: PATROL_HALF, y: PATROL_HALF },
      { x: -PATROL_HALF, y: PATROL_HALF },
    ];
    const from = corners[leg]!,
      to = corners[(leg + 1) % 4]!;
    const heading = Math.atan2(to.y - from.y, to.x - from.x);
    return {
      at: {
        x: squad.anchor.x + from.x + Math.cos(heading) * along,
        y: squad.anchor.y + from.y + Math.sin(heading) * along,
      },
      heading,
    };
  }
  // March to one end, turn round, march back.
  const phase = ((((seconds / DRILL_PERIOD) % 1) + 1) % 1) * 2;
  const forward = phase < 1;
  const offset = forward
    ? -DRILL_HALF + phase * 2 * DRILL_HALF
    : DRILL_HALF - (phase - 1) * 2 * DRILL_HALF;
  const heading =
    squad.axis === "x" ? (forward ? 0 : Math.PI) : forward ? Math.PI / 2 : -Math.PI / 2;
  return {
    at:
      squad.axis === "x"
        ? { x: squad.anchor.x + offset, y: squad.anchor.y }
        : { x: squad.anchor.x, y: squad.anchor.y + offset },
    heading,
  };
}
export function formationOffset(behavior: SquadBehavior, slot: number, heading: number): Point {
  const o = FORMATIONS[behavior][slot] ?? { x: 0, y: 0 };
  const c = Math.cos(heading),
    s = Math.sin(heading);
  return { x: o.x * c - o.y * s, y: o.x * s + o.y * c };
}
/** Where one army robot stands at `seconds` when it is going about its day. */
/** Patrol squads march in a column: each robot walks the leader's path this much later. */
export const COLUMN_LAG = 1.8;
export function armyPosition(robot: ArmyRobot, seconds: number): Point {
  const squad = squadOf(robot);
  if (squad.behavior === "patrol")
    return wrapPoint(squadPose(squad, seconds - robot.slot * COLUMN_LAG).at);
  // Drill squads march in a line across their axis, the same way round in both directions,
  // so nobody jumps when the squad turns.
  const pose = squadPose(squad, seconds);
  const o = formationOffset("drill", robot.slot, squad.axis === "x" ? 0 : Math.PI / 2);
  return wrapPoint({ x: pose.at.x + o.x, y: pose.at.y + o.y });
}
/** Army robots near `center`, nearest first, at most `limit` (only these get drawn). */
export function armyNear(center: Point, seconds: number, radius: number, limit: number) {
  return ARMY.map((robot) => ({ robot, at: armyPosition(robot, seconds) }))
    .map((r) => ({ ...r, d: worldDistance(r.at, center) }))
    .filter((r) => r.d <= radius)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit);
}
for (const squad of SQUADS) squadById.set(squad.id, squad);
ARMY.forEach((r, i) => indexById.set(r.instanceId, i));
