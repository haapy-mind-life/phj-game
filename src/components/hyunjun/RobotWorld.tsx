import type { Point } from "@/game/adventure";
import {
  RESCUE_PATCHES,
  RESCUE_SPOT,
  VILLAIN_NAME,
  VILLAIN_SPOT,
  WORKSHOP,
  robotById,
} from "@/game/robot-catalog";
import { screenPoint, worldDistance } from "@/game/world-space";
import { FriendArt } from "./FriendArt";
import { FirePatchArt, ThiefRobotArt } from "./MissionArt";
import { RobotActorView } from "./RobotActorView";
import { VillainArt, WorkshopArt } from "./RobotSpeciesArt";
import type { useRobotWorld } from "./useRobotWorld";
import { WorldOverlay } from "./WorldExpansion";

const PATCH_AT = [
  { x: -95, y: 20 },
  { x: 95, y: 20 },
  { x: 0, y: 75 },
];
/** World actors of the robot watch, drawn in world coordinates like People. */
export function RobotWorld({
  player,
  robot,
  level,
  moving,
}: {
  player: Point;
  robot: ReturnType<typeof useRobotWorld>;
  level: number;
  moving: boolean;
}) {
  const { actor, villain, mission, effect } = robot;
  const near = (p: Point) => worldDistance(p, player) < 1100;
  const rescue = mission?.mode === "rescue" ? mission : null;
  const thief = mission?.mode === "thief" ? mission.thief : null;
  const rescueState = !rescue
    ? null
    : rescue.thanked
      ? "thanked"
      : rescue.rescue.phase === "safe"
        ? "safe"
        : actor && worldDistance(robot.actorPos, RESCUE_SPOT) < 300
          ? "rescuing"
          : "danger";
  return (
    <>
      {actor?.mode === "follow" && (
        <RobotActorView
          team={robot.team}
          others={actor.others.map(robotById)}
          grades={robot.grades}
          phase={actor.phase}
          mode="follow"
          weaponOut={robot.weaponOut}
          moving={moving}
          poweringUp={Date.now() - robot.powerUpAt < 1500}
          label={`소환된 ${robot.team.map((r) => r.name).join("+")}`}
          world={actor.pos}
          style={screenStyle(actor.pos, player)}
        />
      )}
      {near(WORKSHOP) && (
        <div className="hj-mech-roam" data-workshop style={screenStyle(WORKSHOP, player)}>
          <WorkshopArt />
          <b>🔧 로봇 정비소</b>
        </div>
      )}
      {near(VILLAIN_SPOT) && (
        <div
          className={`hj-mech-roam hj-villain${robot.nearVillain ? " near" : ""}${villain.retreating ? " retreating" : ""}`}
          data-villain={villain.retreating ? "retreating" : "active"}
          data-hp={villain.hp}
          data-max={villain.max}
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
          {/* Re-keyed per hit so the knock-back plays every time. */}
          <div key={villain.hp} className={villain.hp < villain.max ? "hj-knockback" : undefined}>
            <VillainArt retreating={villain.retreating} />
          </div>
          <b>{villain.retreating ? "수리하러 가는 중…" : `${VILLAIN_NAME} Lv.${level}`}</b>
        </div>
      )}
      {rescue && near(RESCUE_SPOT) && (
        <div
          className="hj-mech-roam hj-rescue"
          data-rescue={rescueState}
          data-burning={rescue.rescue.burning}
          style={screenStyle(RESCUE_SPOT, player)}
        >
          <span className="hj-rescue-bubble">
            {rescueState === "thanked"
              ? "고마워! 💛"
              : rescueState === "safe"
                ? "살았다!"
                : "도와줘!"}
          </span>
          <FriendArt index={3} moving={rescueState === "thanked"} />
          {PATCH_AT.slice(0, RESCUE_PATCHES).map((o, i) => (
            <div
              key={i}
              className="hj-fire-patch"
              data-patch={i < rescue.rescue.burning ? "burning" : "out"}
              style={{ transform: `translate(${o.x}px, ${o.y}px)` }}
            >
              <FirePatchArt out={i >= rescue.rescue.burning} size={70} />
            </div>
          ))}
          <b>위험한 친구</b>
        </div>
      )}
      {thief && near(thief.pos) && (
        <div
          className="hj-mech-roam hj-thief"
          data-thief={thief.phase}
          data-x={Math.round(thief.pos.x)}
          data-y={Math.round(thief.pos.y)}
          data-stamina={thief.stamina}
          style={screenStyle(thief.pos, player)}
        >
          <ThiefRobotArt phase={thief.phase} moving={thief.phase === "fleeing"} size={86} />
          <b>도둑 로봇</b>
        </div>
      )}
      {effect && (
        <WorldOverlay center={player}>
          <EffectLine key={effect.at} effect={effect} player={player} />
        </WorldOverlay>
      )}
    </>
  );
}
function EffectLine({
  effect,
  player,
}: {
  effect: NonNullable<ReturnType<typeof useRobotWorld>["effect"]>;
  player: Point;
}) {
  const from = screenPoint(effect.from, player);
  const to = screenPoint(effect.to, player);
  // A miss stops short of the target.
  const reach = effect.hit ? 1 : 0.45;
  const end = { x: from.x + (to.x - from.x) * reach, y: from.y - 40 + (to.y - from.y) * reach };
  const color =
    effect.kind === "cannon" ? "#8ee6ff" : effect.kind === "wind" ? "#b9fff2" : "#ffe45c";
  return (
    <g className={`hj-strike hj-strike-${effect.kind}`} data-strike={effect.hit ? "hit" : "miss"}>
      <path
        d={`M${from.x} ${from.y - 40}Q${(from.x + end.x) / 2} ${Math.min(from.y, end.y) - 120} ${end.x} ${end.y}`}
        stroke={color}
        strokeWidth={effect.kind === "cannon" ? 18 : 10}
        strokeLinecap="round"
        fill="none"
      />
      {effect.hit && <circle cx={end.x} cy={end.y} r="34" fill={color} opacity=".7" />}
    </g>
  );
}
const screenStyle = (p: Point, player: Point) => {
  const at = screenPoint(p, player);
  return { left: at.x, top: at.y };
};
