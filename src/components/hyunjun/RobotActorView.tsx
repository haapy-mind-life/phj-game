import type { CSSProperties } from "react";
import type { Point } from "@/game/adventure";
import type { RobotSpecies } from "@/game/robot-catalog";
import { FusedRobotArt } from "./FusedRobotArt";
import { SummonBeamArt } from "./MissionArt";
import { RobotSpeciesArt } from "./RobotSpeciesArt";
import type { ActorPhase } from "./useRobotWorld";

const GATHER_FROM = [
  { x: -150, y: 0 },
  { x: 150, y: 0 },
  { x: 0, y: -150 },
];
/**
 * The summoned robot as one world actor, in every phase. Its engine state is written to data-*
 * attributes so browser checks assert the game state, not just the picture.
 */
export function RobotActorView({
  team,
  others,
  grades,
  phase,
  mode,
  weaponOut,
  moving,
  poweringUp,
  label,
  world,
  style,
}: {
  team: RobotSpecies[];
  others: RobotSpecies[];
  grades: number[];
  phase: ActorPhase;
  mode: "follow" | "ride";
  weaponOut: boolean;
  moving: boolean;
  poweringUp: boolean;
  label: string;
  world: Point;
  style?: CSSProperties;
}) {
  const core = team[0];
  if (!core) return null;
  const fusionPhase =
    phase === "gathering" ||
    phase === "assembling" ||
    phase === "splitting" ||
    phase === "returning"
      ? phase
      : team.length > 1
        ? "fused"
        : "single";
  return (
    <div
      className={`hj-robot-actor${poweringUp ? " powering-up" : ""}`}
      data-robot-actor
      data-mode={mode}
      data-phase={phase}
      data-team={team.map((r) => r.id).join(",")}
      data-grade={grades[0] ?? 0}
      data-weapon={weaponOut ? "drawn" : "stowed"}
      data-fusion-phase={fusionPhase}
      data-x={Math.round(world.x)}
      data-y={Math.round(world.y)}
      style={style}
    >
      {phase === "summoning" && (
        <div className="hj-summon-beam">
          <SummonBeamArt color={core.color} size={140} />
        </div>
      )}
      {phase === "gathering" ? (
        // The members walk in from around the core before locking together.
        <div className="hj-gather-group">
          {others.map((r, i) => (
            <div
              key={r.id}
              className="hj-gather-member"
              style={
                {
                  "--gx": `${GATHER_FROM[i]!.x}px`,
                  "--gy": `${GATHER_FROM[i]!.y}px`,
                } as CSSProperties
              }
            >
              <RobotSpeciesArt robot={r} grade={grades[i] ?? 0} moving size={70} />
            </div>
          ))}
        </div>
      ) : phase === "assembling" || phase === "splitting" ? (
        <FusedRobotArt
          key={phase}
          team={phase === "splitting" ? [core, ...others] : team}
          grades={grades}
          weaponOut={false}
          size={team.length + others.length > 2 ? 210 : 190}
          label={label}
          phase={phase}
        />
      ) : team.length > 1 ? (
        <FusedRobotArt
          team={team}
          grades={grades}
          weaponOut={weaponOut}
          moving={moving}
          size={team.length > 2 ? 210 : 190}
          label={label}
          phase="fused"
        />
      ) : (
        <div className="hj-solo-row">
          <RobotSpeciesArt
            robot={core}
            grade={grades[0] ?? 0}
            moving={moving}
            weaponOut={weaponOut}
            size={grades[0] ? 92 : 82}
            label={label}
          />
          {phase === "returning" &&
            others.map((r) => (
              <div key={r.id} className="hj-beam-out" data-returning={r.id}>
                <RobotSpeciesArt robot={r} size={64} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
