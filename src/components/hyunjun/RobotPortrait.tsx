import type { RobotSpecies } from "@/game/robot/robot-catalog";
import type { RobotForm } from "@/game/robot/robot-forms";
import { LegendaryRobotArt } from "./LegendaryRobotArt";
import { ROSTER_ART_IDS } from "./robot-art-kit";
import { RobotRosterArt } from "./RobotRosterArt";
import { RobotSpeciesArt } from "./RobotSpeciesArt";

/**
 * One robot picture for every place it appears — watch card, watch screen, world actor and
 * army — so the card always looks like the robot that comes out (RW-02).
 */
export function RobotPortrait({
  robot,
  grade = 0,
  moving = false,
  weaponOut = false,
  size = 96,
  label = robot.name,
  form = "robot",
  changing = false,
  facing = -1,
}: {
  robot: RobotSpecies;
  grade?: number;
  moving?: boolean;
  weaponOut?: boolean;
  size?: number;
  label?: string;
  /** Tira and Emblus only: egg or ambulance, and the moment in between. */
  form?: RobotForm;
  changing?: boolean;
  /** Side-view art turns to face the way it walks (+1 is right). */
  facing?: number;
}) {
  return robot.legendary ? (
    <LegendaryRobotArt
      legend={robot.legendary}
      grade={grade}
      moving={moving}
      weaponOut={weaponOut}
      size={size * 1.1}
      label={label}
    />
  ) : ROSTER_ART_IDS.has(robot.id) ? (
    <RobotRosterArt
      id={robot.id}
      grade={grade}
      moving={moving}
      weaponOut={weaponOut}
      size={size}
      label={label}
      form={form}
      changing={changing}
      facing={facing}
    />
  ) : (
    <RobotSpeciesArt
      robot={robot}
      grade={grade}
      moving={moving}
      weaponOut={weaponOut}
      size={size}
      label={label}
    />
  );
}
