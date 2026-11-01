import { useEffect, useRef, useState } from "react";
import type { Point } from "@/game/adventure";
import { ARMY, armyPosition, squadOf } from "@/game/robot-army";
import { robotById } from "@/game/robot-catalog";
import { hasCard, resolveStrike, type RobotProgress } from "@/game/robot-engine";
import {
  BOSS_ARENA,
  GIANT_DAMAGE,
  GIANT_HP,
  GIANT_WEAPON,
  MINION_CAMP,
  MINION_RESPAWN_MS,
  freshBoss,
  freshWave,
  hitBoss,
  hitMinion,
  minionPosition,
  stepBoss,
} from "@/game/robot-giant-battle";
import {
  RALLY_RANGE,
  RALLY_SITE,
  callArmy,
  fusionPosition,
  idleFusion,
  splitFusion,
  stepFusion,
} from "@/game/robot-mass-fusion";
import { worldDelta, worldDistance } from "@/game/world-space";
import type { WorldAction } from "@/lib/world-model";

const TICK_MS = 100;
/** How close you have to walk to a legend for its card to land in the watch. */
const DISCOVER_RANGE = 260;
const VISIBLE_RADIUS = 1100;
const VISIBLE_LIMIT = 14;
const ARROWS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];

/**
 * The robot army on one clock: 100 robots on their routes, legends found by walking up to
 * them, the 100-robot rally and giant, the giant villain and the minions.
 */
export function useRobotArmy({
  pos,
  allowed,
  robots,
  dispatch,
  message,
  onGiant,
}: {
  pos: Point;
  /** On foot in the open village (same rule as the summoned robot). */
  allowed: boolean;
  robots: RobotProgress;
  dispatch: (action: WorldAction) => unknown;
  message: (text: string) => void;
  /** Called when the giant forms, so the small summoned robot goes back into the watch. */
  onGiant: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [fusion, setFusion] = useState(idleFusion);
  const [giantHp, setGiantHp] = useState(GIANT_HP);
  const [boss, setBoss] = useState(freshBoss);
  const [wave, setWave] = useState(() => freshWave(robots.minionWaves + 1));
  const [weaponOut, setWeaponOut] = useState(false);
  const [effect, setEffect] = useState<{ from: Point; to: Point; hit: boolean; at: number } | null>(
    null,
  );
  const lastStrike = useRef(-1e9);
  const paidEvent = useRef(0);
  const serial = useRef(0);
  const live = useRef({ pos, fusion, boss });
  live.current = { pos, fusion, boss };
  const giant = fusion.phase === "giant";
  const seconds = now / 1000;

  // One clock for the whole army, the rally, the boss and the minions.
  useEffect(() => {
    let last = Date.now();
    const t = window.setInterval(() => {
      const at = Date.now();
      const dt = Math.min(0.25, (at - last) / 1000);
      last = at;
      setNow(at);
      setFusion((f) => stepFusion(f, at));
      const { pos: p, fusion: f } = live.current;
      if (f.phase === "giant") {
        setBoss((b) => {
          const r = stepBoss(b, p, at, dt);
          if (r.giantDamage) setGiantHp((hp) => hp - r.giantDamage);
          return r.boss;
        });
      } else setBoss((b) => (b.phase === "retreat" ? stepBoss(b, null, at, dt).boss : b));
    }, TICK_MS);
    return () => clearInterval(t);
  }, []);

  // The giant forms: pay the fusion once, send the small robot home, full health.
  useEffect(() => {
    if (fusion.phase !== "giant" || paidEvent.current === fusion.eventId) return;
    paidEvent.current = fusion.eventId;
    dispatch({ type: "robot-army", kind: "massFusions", n: robots.massFusions + 1 });
    setGiantHp(GIANT_HP);
    onGiant();
    message("100대 합체 완성! 초대형 로봇에 탔어! 👹 남서쪽 거대 악당이나 졸개 로봇과 싸워 보자!");
  }, [fusion.phase, fusion.eventId, dispatch, robots.massFusions, onGiant, message]);
  // The giant breaks apart safely when its health runs out, or when you leave the open village.
  useEffect(() => {
    if (!giant) return;
    if (giantHp <= 0) {
      setFusion((f) => splitFusion(f, Date.now()));
      message("거대 로봇이 너무 많이 맞아서 다시 100대로 흩어졌어. 잃은 건 없어! 다시 모여 보자.");
    } else if (!allowed) setFusion((f) => splitFusion(f, Date.now()));
  }, [giant, giantHp, allowed, message]);
  // A cleared minion wave comes back after a while.
  useEffect(() => {
    if (!wave.clearedAt) return;
    const t = setTimeout(
      () => setWave(freshWave(wave.wave + 1)),
      Math.max(0, wave.clearedAt + MINION_RESPAWN_MS - Date.now()),
    );
    return () => clearTimeout(t);
  }, [wave]);
  // Walking up to a legend stores its card in the watch.
  useEffect(() => {
    if (!allowed || fusion.phase !== "idle") return;
    for (const robot of ARMY) {
      if (!robot.legendary || hasCard(robots, robot.species)) continue;
      if (worldDistance(armyPosition(robot, seconds), pos) > DISCOVER_RANGE) continue;
      dispatch({ type: "robot-discover", id: robot.species });
      message(
        `⭐ 전설 로봇 발견! ${robotById(robot.species).name} 카드가 시계에 저장됐어! 시계의 ⭐ 전설에서 불러 봐.`,
      );
      break;
    }
  }, [allowed, fusion.phase, pos, seconds, robots, dispatch, message]);

  const atRally = allowed && worldDistance(pos, RALLY_SITE) <= RALLY_RANGE;
  const call = () => {
    if (fusion.phase !== "idle") {
      message("군단이 이미 모이고 있어!");
      return;
    }
    if (!atRally) {
      message("100대를 부르려면 남쪽 🤖 군단 집결 광장으로 가야 해! 지도에서 갈 수 있어.");
      return;
    }
    const next = callArmy(
      ++serial.current,
      ARMY.map((r) => r.instanceId),
      seconds,
      Date.now(),
    );
    if (!next) return;
    setFusion(next);
    message("📣 로봇 군단 100대 집결! 마을 곳곳에서 로봇들이 광장으로 달려와!");
  };
  const split = () => {
    if (!giant) return;
    setFusion((f) => splitFusion(f, Date.now()));
    message("초대형 로봇이 다시 100대로 나뉘어 각자 마을로 돌아가!");
  };

  const minions = wave.minions.map((m, i) => ({ ...m, at: minionPosition(i, seconds) }));
  const strike = () => {
    if (!giant) return;
    const at = Date.now();
    setWeaponOut(true);
    window.setTimeout(() => setWeaponOut(false), 1200);
    const jobs = [
      ...(boss.phase !== "retreat" ? [{ kind: "boss" as const, id: "boss", at: boss.pos }] : []),
      ...minions
        .filter((m) => m.phase === "active")
        .map((m) => ({ kind: "minion" as const, id: m.id, at: m.at })),
    ].sort((a, b) => worldDistance(pos, a.at) - worldDistance(pos, b.at));
    const aim = jobs[0];
    if (!aim) {
      message("거대 빔을 꺼냈어! 지금은 맞힐 악당이 없어.");
      return;
    }
    const result = resolveStrike(GIANT_WEAPON, pos, aim.at, at, lastStrike.current);
    if (result === "cooldown") {
      message("거대 빔 충전 중이야!");
      return;
    }
    lastStrike.current = at;
    setEffect({ from: pos, to: aim.at, hit: result === "hit", at });
    if (result === "far") {
      message(
        `거대 빔! 너무 멀어. ${Math.round(worldDistance(pos, aim.at) / 50)}걸음 더 가까이 가자!`,
      );
      return;
    }
    if (aim.kind === "boss") {
      const r = hitBoss(boss, GIANT_DAMAGE, at);
      setBoss(r.boss);
      if (r.defeated) {
        dispatch({ type: "robot-army", kind: "bossWins", n: robots.bossWins + 1 });
        message("거대 악당을 물리쳤어! 고장 나서 수리하러 후퇴했어! 🔩 부품 +6");
      } else
        message(
          r.boss.shield > 0
            ? `거대 빔 명중! 방패가 막았어. 방패 ${r.boss.shield}`
            : `거대 빔 명중! 거대 악당 힘 ${r.boss.hp}`,
        );
    } else {
      const r = hitMinion(wave, aim.id, GIANT_DAMAGE, at);
      setWave(r.wave);
      if (r.cleared) {
        dispatch({ type: "robot-army", kind: "minionWaves", n: robots.minionWaves + 1 });
        message("졸개 로봇을 모두 물리쳤어! 🔩 부품 +2");
      } else message("거대 빔 한 방에 졸개 로봇이 고장 나서 도망갔어!");
    }
  };

  // What gets drawn: nearby robots only (the other robots keep going, unseen).
  // Positions come from the route or the rally, so robots walking in from far away show up.
  const visible = ARMY.map((robot) => ({
    robot,
    at: fusionPosition(fusion, robot.instanceId, armyPosition(robot, seconds), now),
  }))
    .filter((r): r is { robot: (typeof ARMY)[number]; at: Point } => r.at !== null)
    .map((r) => ({ ...r, d: worldDistance(r.at, pos) }))
    .filter((r) => r.d <= VISIBLE_RADIUS)
    .sort((a, b) => a.d - b.d)
    .slice(0, VISIBLE_LIMIT)
    .map((r) => ({
      ...r,
      behavior:
        fusion.phase === "gathering"
          ? fusion.arrived.includes(r.robot.instanceId)
            ? "arrived"
            : "rally"
          : fusion.phase === "returning"
            ? "returning"
            : squadOf(r.robot).behavior,
    }));
  const goal = giant
    ? boss.phase !== "retreat"
      ? { name: "거대 악당", at: BOSS_ARENA }
      : { name: "졸개 로봇", at: MINION_CAMP }
    : null;
  const compass = goal
    ? (() => {
        const d = worldDelta(pos, goal.at);
        const arrow = ARROWS[(Math.round(Math.atan2(d.y, d.x) / (Math.PI / 4)) + 8) % 8];
        return `🧭 ${goal.name} ${arrow} ${Math.round(Math.hypot(d.x, d.y) / 50)}걸음`;
      })()
    : null;
  return {
    now,
    seconds,
    visible,
    total: ARMY.length,
    unique: new Set(ARMY.map((r) => r.instanceId)).size,
    legendsFound: ARMY.filter((r) => r.legendary && hasCard(robots, r.species)).length,
    fusion,
    giant,
    giantHp,
    giantMax: GIANT_HP,
    boss,
    minions,
    weaponOut,
    effect,
    atRally,
    call,
    split,
    strike,
    compass,
  };
}
