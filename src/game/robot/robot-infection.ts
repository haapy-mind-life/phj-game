import type { Point } from "../world/adventure.ts";
import { armyNear, type ArmyRobot } from "./robot-army.ts";
import { isRosterId } from "./robot-catalog.ts";

// The mist virus: a few army robots near the player turn purple and are healed one by one with
// Emblus's antidote weapon. It is a state on top of the army, never saved: the robots keep
// walking their routes, the army stays 100, and a reload just leaves everyone healthy.
export const MIST_TARGETS = 3;
export const MIST_RANGE = 1100;
export type Mist = { eventId: number; infected: string[]; cured: string[] };
/** Regular robots only: a legend still to be found, Tira and Emblus stay out of it. */
export const canCatchMist = (robot: ArmyRobot) => !robot.legendary && !isRosterId(robot.species);
export function mistTargets(center: Point, seconds: number): string[] {
  return armyNear(center, seconds, MIST_RANGE, 100)
    .filter((r) => canCatchMist(r.robot))
    .slice(0, MIST_TARGETS)
    .map((r) => r.robot.instanceId);
}
/** Null when no army robot is close enough to catch it. */
export function startMist(eventId: number, targets: readonly string[]): Mist | null {
  const infected = [...new Set(targets)].slice(0, MIST_TARGETS);
  return infected.length ? { eventId, infected, cured: [] } : null;
}
export const stillInfected = (m: Mist) => m.infected.filter((id) => !m.cured.includes(id));
export const isInfected = (m: Mist | null, id: string) =>
  !!m && m.infected.includes(id) && !m.cured.includes(id);
export const mistCleared = (m: Mist) => stillInfected(m).length === 0;
/** Only a robot that is infected right now can be healed, and only once. */
export function cureRobot(m: Mist, id: string): Mist {
  return isInfected(m, id) ? { ...m, cured: [...m.cured, id] } : m;
}
