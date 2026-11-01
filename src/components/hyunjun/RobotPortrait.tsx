import type { RobotSpecies } from "@/game/robot-catalog";
import { LegendaryRobotArt } from "./LegendaryRobotArt";
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
}: {
  robot: RobotSpecies;
  grade?: number;
  moving?: boolean;
  weaponOut?: boolean;
  size?: number;
  label?: string;
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
