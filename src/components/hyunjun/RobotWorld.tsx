import type { Point } from "@/game/adventure";
import { PRACTICE_TARGET, type RobotSpecies } from "@/game/robot-catalog";
import { screenPoint, worldDistance } from "@/game/world-space";
import { RobotSpeciesArt } from "./RobotSpeciesArt";

/** Roaming robots and the practice robot, drawn in world coordinates like People. */
export function RobotWorld({
  player,
  roaming,
  nearTarget,
}: {
  player: Point;
  roaming: { robot: RobotSpecies; p: Point }[];
  nearTarget: boolean;
}) {
  return (
    <>
      {roaming
        .filter(({ p }) => worldDistance(p, player) < 1000)
        .map(({ robot, p }) => {
          const at = screenPoint(p, player);
          return (
            <div
              key={robot.id}
              className="hj-mech-roam"
              data-robot={robot.id}
              style={{ left: at.x, top: at.y }}
            >
              <RobotSpeciesArt robot={robot} moving size={78} />
              <b>{robot.name}</b>
            </div>
          );
        })}
      {worldDistance(PRACTICE_TARGET, player) < 1000 && (
        <div
          className={`hj-mech-roam hj-practice${nearTarget ? " near" : ""}`}
          data-practice-robot
          style={screenStyle(PRACTICE_TARGET, player)}
        >
          <svg viewBox="0 0 110 130" width="84" height="99" role="img" aria-label="연습 로봇">
            <ellipse cx="55" cy="124" rx="34" ry="5" fill="#355e6426" />
            <rect x="47" y="84" width="16" height="38" fill="#8a7a6a" />
            <rect x="24" y="116" width="62" height="9" rx="3" fill="#6b5d50" />
            <circle cx="55" cy="50" r="40" fill="#fff" stroke="#e05a4f" strokeWidth="8" />
            <circle cx="55" cy="50" r="24" fill="#fff" stroke="#e05a4f" strokeWidth="8" />
            <circle cx="55" cy="50" r="8" fill="#e05a4f" />
          </svg>
          <b>연습 로봇</b>
        </div>
      )}
    </>
  );
}
const screenStyle = (p: Point, player: Point) => {
  const at = screenPoint(p, player);
  return { left: at.x, top: at.y };
};
