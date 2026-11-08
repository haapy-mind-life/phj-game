import { isRocketPair, type RobotSpeciesId } from "./robot-catalog.ts";

// Tira turns into a machine egg and back, Emblus into an ambulance and back, Rocket and Rocket X
// into their cars, and Dual Rocket (the rocket pair) into the one dual car. The form lives only
// in the running game: after a reload or a map change the robot simply stands as a robot again,
// and no card or reward can be lost in between.
export type RobotForm = "robot" | "egg" | "ambulance" | "car";
export type FormState = { form: RobotForm; changing: boolean };
const ALT_FORM: Partial<Record<RobotSpeciesId, RobotForm>> = {
  "rb-tira": "egg",
  "rb-emblus": "ambulance",
  "rb-rocket": "car",
  "rb-rocket-x": "car",
};
/** The other form this team can take: a single robot's own, or the dual car for the rockets. */
export const altForm = (team: readonly RobotSpeciesId[]): RobotForm | undefined =>
  team.length === 1 ? ALT_FORM[team[0]!] : isRocketPair(team) ? "car" : undefined;
export const standing = (): FormState => ({ form: "robot", changing: false });
export const canTransform = (team: readonly RobotSpeciesId[]) => altForm(team) !== undefined;
/** Starts a change. Null when the robot has no other form or is already changing. */
export function beginTransform(team: readonly RobotSpeciesId[], s: FormState): FormState | null {
  if (!canTransform(team) || s.changing) return null;
  const other = altForm(team)!;
  return { form: s.form === "robot" ? other : "robot", changing: true };
}
export const finishTransform = (s: FormState): FormState => ({ ...s, changing: false });
/** Interrupted by map travel or anything else: back to the safe robot pose. */
export const interruptTransform = (s: FormState): FormState => (s.changing ? standing() : s);
/** A robot only swings its weapon on its own two feet. */
export const canStrikeInForm = (s: FormState) => s.form === "robot" && !s.changing;
