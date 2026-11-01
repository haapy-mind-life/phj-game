import type { Point } from "@/game/adventure";
import { robotById } from "@/game/robot-catalog";
import { BLAST_RADIUS, BOSS_HP, BOSS_SHIELD } from "@/game/robot-giant-battle";
import { RALLY_SITE } from "@/game/robot-mass-fusion";
import { screenPoint, worldDistance } from "@/game/world-space";
import { GiantBossArt, MinionRobotArt } from "./GiantArt";
import { RobotPortrait } from "./RobotPortrait";
import type { useRobotArmy } from "./useRobotArmy";
import { WorldOverlay } from "./WorldExpansion";

const INSIGNIA = ["#ffd23f", "#ff7a6b", "#7fd4ff", "#a6e86b", "#d7a6ff"];
/**
 * The army's world actors near the player: squad robots on their routes, the rally square,
 * the giant villain and the minions. The full 100-robot registry is reported on the root
 * element so checks read the engine, not just what happens to be on screen.
 */
export function RobotArmyView({
  player,
  army,
}: {
  player: Point;
  army: ReturnType<typeof useRobotArmy>;
}) {
  const { fusion, boss } = army;
  const at = (p: Point) => {
    const s = screenPoint(p, player);
    return { left: s.x, top: s.y };
  };
  return (
    <div
      className="hj-army"
      data-army-total={army.total}
      data-army-unique={army.unique}
      data-army-visible={army.visible.length}
      data-mass-phase={fusion.phase}
      data-mass-participants={new Set(fusion.participants).size}
      data-mass-arrived={new Set(fusion.arrived).size}
      data-giant-hp={army.giant ? army.giantHp : undefined}
    >
      {army.visible.map(({ robot, at: p, behavior }) => {
        const species = robotById(robot.species);
        return (
          <div
            key={robot.instanceId}
            className={`hj-army-robot${robot.legendary ? " legend" : ""}`}
            data-army-id={robot.instanceId}
            data-behavior={behavior}
            data-legend={robot.legendary ? robot.species : undefined}
            data-x={Math.round(p.x)}
            data-y={Math.round(p.y)}
            style={at(p)}
          >
            <RobotPortrait robot={species} moving size={robot.legendary ? 58 : 46} />
            {robot.legendary ? (
              <b>⭐ {species.name}</b>
            ) : (
              <i style={{ background: INSIGNIA[robot.variant] }}>{robot.instanceId.slice(-3)}</i>
            )}
          </div>
        );
      })}
      {worldDistance(RALLY_SITE, player) < 1500 && (
        <div className="hj-rally" style={at(RALLY_SITE)} data-rally>
          <div className="hj-rally-ring" />
          <b>
            🤖 군단 집결 광장
            {fusion.phase === "gathering" && ` · ${new Set(fusion.arrived).size}/100`}
          </b>
        </div>
      )}
      {worldDistance(boss.pos, player) < 1500 && (
        <div
          className="hj-boss"
          style={at(boss.pos)}
          data-boss-phase={boss.phase}
          data-boss-hp={boss.hp}
          data-boss-shield={boss.shield}
          data-x={Math.round(boss.pos.x)}
          data-y={Math.round(boss.pos.y)}
        >
          {boss.phase !== "retreat" && (
            <div className="hj-boss-bars">
              <div role="meter" aria-label="거대 악당 방패" aria-valuenow={boss.shield}>
                <i className="shield" style={{ width: `${(boss.shield / BOSS_SHIELD) * 100}%` }} />
              </div>
              <div role="meter" aria-label="거대 악당 힘" aria-valuenow={boss.hp}>
                <i style={{ width: `${(boss.hp / BOSS_HP) * 100}%` }} />
              </div>
            </div>
          )}
          <div key={boss.hp + boss.shield} className="hj-boss-hit">
            <GiantBossArt phase={boss.phase} shield={boss.shield > 0} size={260} />
          </div>
          <b>{boss.phase === "retreat" ? "수리하러 후퇴 중…" : "👹 거대 톱니 황제"}</b>
        </div>
      )}
      {army.minions.map(
        (m, i) =>
          worldDistance(m.at, player) < 1300 && (
            <div
              key={m.id}
              className="hj-minion"
              data-minion={m.phase}
              data-x={Math.round(m.at.x)}
              data-y={Math.round(m.at.y)}
              style={at(m.at)}
            >
              <MinionRobotArt phase={m.phase} variant={i} size={58} />
            </div>
          ),
      )}
      {(boss.target && boss.phase === "telegraph") || army.effect ? (
        <WorldOverlay center={player}>
          {boss.target && boss.phase === "telegraph" && (
            <circle
              className="hj-blast-warning"
              data-blast
              cx={screenPoint(boss.target, player).x}
              cy={screenPoint(boss.target, player).y}
              r={BLAST_RADIUS}
            />
          )}
          {army.effect && <Beam key={army.effect.at} effect={army.effect} player={player} />}
        </WorldOverlay>
      ) : null}
    </div>
  );
}
function Beam({
  effect,
  player,
}: {
  effect: NonNullable<ReturnType<typeof useRobotArmy>["effect"]>;
  player: Point;
}) {
  const from = screenPoint(effect.from, player);
  const to = screenPoint(effect.to, player);
  const k = effect.hit ? 1 : 0.4;
  const end = { x: from.x + (to.x - from.x) * k, y: from.y - 120 + (to.y - from.y) * k };
  return (
    <g className="hj-strike" data-giant-beam={effect.hit ? "hit" : "miss"}>
      <path
        d={`M${from.x} ${from.y - 120}L${end.x} ${end.y}`}
        stroke="#8ef6ff"
        strokeWidth="26"
        strokeLinecap="round"
      />
      {effect.hit && <circle cx={end.x} cy={end.y} r="60" fill="#d8fbff" opacity=".8" />}
    </g>
  );
}
