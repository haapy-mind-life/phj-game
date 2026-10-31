import type { Point } from "@/game/adventure";
import { VILLAIN_NAME, VILLAIN_SPOT, WORKSHOP, type RobotSpecies } from "@/game/robot-catalog";
import type { Villain } from "@/game/robot-engine";
import { screenPoint, worldDistance } from "@/game/world-space";
import { RobotSpeciesArt, VillainArt, WorkshopArt } from "./RobotSpeciesArt";

/** Roaming robots, the villain and the workshop, drawn in world coordinates like People. */
export function RobotWorld({
  player,
  roaming,
  villain,
  level,
  nearVillain,
}: {
  player: Point;
  roaming: { robot: RobotSpecies; p: Point }[];
  villain: Villain;
  level: number;
  nearVillain: boolean;
}) {
  return (
    <>
      {roaming
        .filter(({ p }) => worldDistance(p, player) < 1000)
        .map(({ robot, p }) => (
          <div
            key={robot.id}
            className="hj-mech-roam"
            data-robot={robot.id}
            style={screenStyle(p, player)}
          >
            <RobotSpeciesArt robot={robot} moving size={78} />
            <b>{robot.name}</b>
          </div>
        ))}
      {worldDistance(WORKSHOP, player) < 1000 && (
        <div className="hj-mech-roam" data-workshop style={screenStyle(WORKSHOP, player)}>
          <WorkshopArt />
          <b>🔧 로봇 정비소</b>
        </div>
      )}
      {worldDistance(VILLAIN_SPOT, player) < 1000 && (
        <div
          className={`hj-mech-roam hj-villain${nearVillain ? " near" : ""}${villain.retreating ? " retreating" : ""}`}
          data-villain={villain.retreating ? "retreating" : "active"}
          style={screenStyle(VILLAIN_SPOT, player)}
        >
          {!villain.retreating && (
            <div
              className="hj-villain-hp"
              role="meter"
              aria-label="악당 로봇 힘"
              aria-valuemin={0}
              aria-valuemax={villain.max}
              aria-valuenow={villain.hp}
            >
              <i style={{ width: `${(villain.hp / villain.max) * 100}%` }} />
            </div>
          )}
          <VillainArt retreating={villain.retreating} />
          <b>{villain.retreating ? "수리하러 가는 중…" : `${VILLAIN_NAME} Lv.${level}`}</b>
        </div>
      )}
    </>
  );
}
const screenStyle = (p: Point, player: Point) => {
  const at = screenPoint(p, player);
  return { left: at.x, top: at.y };
};
