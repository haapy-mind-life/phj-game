import { useCallback, useEffect, useRef, useState } from "react";
import { isWalkable, type Point } from "@/game/world/adventure";
import {
  BATTLE_RANGE,
  FOLLOW_GAP,
  GRADES,
  MAX_GRADE,
  MISSION_PARTS,
  RESCUE_SPOT,
  ROBOT_ENERGY,
  UPGRADE_COST,
  VILLAIN_HIT_MS,
  VILLAIN_NAME,
  VILLAIN_SPOT,
  WIN_PARTS,
  WORKSHOP,
  WORKSHOP_RANGE,
  robotById,
  type RobotMissionMode,
  type RobotSpecies,
  type RobotSpeciesId,
} from "@/game/robot/robot-catalog";
import {
  applyCardUse,
  freshVillain,
  gradeOf,
  hitVillain,
  isWatchCardAvailable,
  resolveStrike,
  teamPower,
  teamWeapon,
  validFusion,
  villainMaxHp,
  type RobotProgress,
} from "@/game/robot/robot-engine";
import {
  douseRescue,
  hitThief,
  startRescue,
  startThief,
  stepThief,
  type Rescue,
  type Thief,
} from "@/game/robot/robot-missions";
import { worldDelta, worldDistance, wrapPoint } from "@/game/world/world-space";
import type { GameState, WorldAction } from "@/lib/world-model";

export const robotName = (robot: RobotSpecies, robots: RobotProgress) => {
  const grade = gradeOf(robots, robot.id);
  return grade > 0 ? `${GRADES[grade]} ${robot.name}` : robot.name;
};
/**
 * summoning → active. A fusion goes gathering (members walk together) → assembling (parts lock
 * into one body) → active; splitting goes splitting → returning (members beam back) → active.
 */
export type ActorPhase =
  "summoning" | "active" | "gathering" | "assembling" | "splitting" | "returning";
export type RobotActor = {
  team: RobotSpeciesId[];
  mode: "follow" | "ride";
  phase: ActorPhase;
  /** World position while following; riding uses the player's position. */
  pos: Point;
  /** Members gathering for a fusion, or leaving after a split. */
  others: RobotSpeciesId[];
};
export type StrikeEffect = { kind: string; from: Point; to: Point; hit: boolean; at: number };
/** `id` ties delayed mission steps to the mission that started them. */
export type RobotMission = { id: number } & (
  | { mode: "villain" }
  | { mode: "rescue"; rescue: Rescue; thanked: boolean }
  | { mode: "thief"; thief: Thief; rewarded: boolean }
);
export type WatchTab = "summon" | "fuse" | "mission" | "army" | "legend";
type Job = { kind: "villain" | "rescue" | "thief"; at: Point };
const SUMMON_MS = 900;
const GATHER_MS = 800;
const ASSEMBLE_MS = 1400;
const SPLIT_MS = 800;
const RETURN_MS = 900;
const WEAPON_SHOW_MS = 1300;
const ARROWS = ["→", "↘", "↓", "↙", "←", "↖", "↑", "↗"];

/** The robot watch: summon a robot, fuse 2–3 robots, fight, rescue and catch the thief. */
export function useRobotWorld({
  pos,
  facing,
  allowed,
  state,
  dispatch,
  message,
  watchOpen,
  setWatchOpen,
}: {
  pos: Point;
  facing: number;
  /** On foot in the open village: not inside, not in a car, plane, submarine or lake. */
  allowed: boolean;
  state: GameState;
  dispatch: (action: WorldAction) => unknown;
  message: (text: string) => void;
  /** Owned by the screen so movement and the living world pause while the watch is open. */
  watchOpen: WatchTab | false;
  setWatchOpen: (tab: WatchTab | false) => void;
}) {
  const robots = state.robots;
  const [actor, setActor] = useState<RobotActor | null>(null);
  const [villain, setVillain] = useState(() => freshVillain(robots.wins));
  const [mission, setMission] = useState<RobotMission | null>(null);
  // Hits taken this summon. Energy is derived from it, so splitting and re-joining a fusion
  // can't refill the bar.
  const [damage, setDamage] = useState(0);
  const [effect, setEffect] = useState<StrikeEffect | null>(null);
  const [weaponOut, setWeaponOut] = useState(false);
  const [powerUpAt, setPowerUpAt] = useState(0);
  const lastStrike = useRef(-1e9);
  const timers = useRef<number[]>([]);
  // Mission steps outlive summons and fusions, so recalling a robot never cancels a reward.
  const missionTimers = useRef<number[]>([]);
  const missionSerial = useRef(0);
  // Joining robots bring extra energy only on the first fusion of a summon.
  const fusedThisSummon = useRef(false);
  const weaponTimer = useRef(0);
  const live = useRef({ pos, facing, actor, mission });
  live.current = { pos, facing, actor, mission };
  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  /** Runs `fn` on the mission later only if it is still the same mission. */
  const laterMission = (id: number, ms: number, fn: (m: RobotMission) => RobotMission | null) => {
    missionTimers.current.push(
      window.setTimeout(() => setMission((m) => (m?.id === id ? fn(m) : m)), ms),
    );
  };
  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(
    () => () => {
      timers.current.forEach((t) => clearTimeout(t));
      missionTimers.current.forEach((t) => clearTimeout(t));
      clearTimeout(weaponTimer.current);
    },
    [],
  );

  const team = actor?.team ?? [];
  const busy = !!actor && actor.phase !== "active";
  const actorPos = actor ? (actor.mode === "ride" ? pos : actor.pos) : pos;
  const energyMax = ROBOT_ENERGY + (Math.max(1, team.length) - 1) * 2;
  const energy = Math.max(0, energyMax - damage);
  const recall = useCallback(
    (words?: string) => {
      clearTimers();
      fusedThisSummon.current = false;
      setActor(null);
      setDamage(0);
      setWeaponOut(false);
      if (words) message(words);
    },
    [clearTimers, message],
  );
  // Cars, planes, submarines, the lake and buildings send the robot back into the watch.
  useEffect(() => {
    if (!allowed && actor) recall("로봇이 시계 속으로 돌아갔어. 다시 부르려면 시계를 열어 봐!");
    if (!allowed) setWatchOpen(false);
  }, [allowed, actor, recall, setWatchOpen]);
  // The first villain is made before the save loads; an untouched one follows the saved wins.
  useEffect(() => {
    if (
      !villain.retreating &&
      villain.hp === villain.max &&
      villain.max !== villainMaxHp(robots.wins)
    )
      setVillain(freshVillain(robots.wins));
  }, [villain, robots.wins]);
  // A switched-off villain comes back from repairs a little tougher: endless adventure.
  useEffect(() => {
    if (!villain.retreating) return;
    const t = setTimeout(
      () => setVillain(freshVillain(robots.wins)),
      Math.max(0, villain.back - Date.now()),
    );
    return () => clearTimeout(t);
  }, [villain, robots.wins]);

  // World tick: a following robot walks after the player, and the thief runs.
  const thiefRunning = mission?.mode === "thief" && !mission.rewarded;
  const following = actor?.mode === "follow";
  useEffect(() => {
    if (!following && !thiefRunning) return;
    let last = performance.now();
    const t = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const { pos: p, facing: f, actor: a, mission: m } = live.current;
      if (a?.mode === "follow") {
        const behind = wrapPoint({ x: p.x - f * FOLLOW_GAP, y: p.y + 10 });
        const goal = isWalkable(behind) ? behind : p;
        const d = worldDelta(a.pos, goal);
        const len = Math.hypot(d.x, d.y);
        if (len > 4) {
          // Far behind (after map travel) the robot jumps; otherwise it walks a little faster
          // than the player so it never gets left behind.
          const move = len > 900 ? len : Math.min(len, 320 * dt);
          setActor((cur) =>
            cur && cur.mode === "follow"
              ? {
                  ...cur,
                  pos: wrapPoint({
                    x: cur.pos.x + (d.x / len) * move,
                    y: cur.pos.y + (d.y / len) * move,
                  }),
                }
              : cur,
          );
        }
      }
      if (m?.mode === "thief" && !m.rewarded) {
        const chaser = a ? (a.mode === "ride" ? p : a.pos) : p;
        setMission((cur) =>
          cur?.mode === "thief"
            ? { ...cur, thief: stepThief(cur.thief, chaser, dt, Date.now()) }
            : cur,
        );
      }
    }, 50);
    return () => clearInterval(t);
  }, [following, thiefRunning]);

  // The villain fights back while the robot is close; an empty energy bar sends the robot back
  // into the watch, but nothing is lost.
  const nearVillain = !!actor && worldDistance(actorPos, VILLAIN_SPOT) < BATTLE_RANGE;
  const fighting = nearVillain && !villain.retreating && !busy;
  useEffect(() => {
    if (!fighting) return;
    const t = setInterval(() => setDamage((d) => d + 1), VILLAIN_HIT_MS);
    return () => clearInterval(t);
  }, [fighting]);
  useEffect(() => {
    if (energy > 0 || !actor) return;
    recall("로봇이 고장 났어! 시계가 금방 고쳐 줄 거야. 합체해서 더 세게 다시 도전해 봐!");
  }, [energy, actor, recall]);

  const summon = (id: RobotSpeciesId) => {
    if (!allowed || !isWatchCardAvailable(robots, id)) return;
    dispatch({ type: "robot-meet", id });
    clearTimers();
    const at = wrapPoint({ x: pos.x + facing * 110, y: pos.y + 10 });
    fusedThisSummon.current = false;
    setActor({
      team: [id],
      // Hyunjun chose riding (2026-11-01); following is still one tap away in the watch.
      mode: actor?.mode ?? "ride",
      phase: "summoning",
      pos: isWalkable(at) ? at : { ...pos },
      others: [],
    });
    setDamage(0);
    setWatchOpen(false);
    later(SUMMON_MS, () => setActor((a) => (a ? { ...a, phase: "active" } : a)));
    message(`${robotName(robotById(id), robots)} 소환! 로봇에 탔어. 조이스틱으로 직접 움직여 봐!`);
  };
  const fuse = (ids: RobotSpeciesId[]) => {
    if (!allowed) return;
    if (!validFusion(robots, ids)) {
      message("시계에서 서로 다른 로봇을 2개 또는 3개 골라 줘!");
      return;
    }
    for (const id of ids) dispatch({ type: "robot-meet", id });
    clearTimers();
    // The first fusion of a summon adds the members' energy; later ones keep the energy the
    // robot has, so splitting and re-fusing can't refill the bar.
    const fresh0 = !fusedThisSummon.current;
    fusedThisSummon.current = true;
    const nextMax = ROBOT_ENERGY + (ids.length - 1) * 2;
    if (!fresh0) setDamage(nextMax - energy);
    const fresh = wrapPoint({ x: pos.x + facing * 110, y: pos.y + 10 });
    const center = actor?.mode === "ride" ? pos : (actor?.pos ?? fresh);
    setActor({
      team: ids,
      mode: actor?.mode ?? "ride",
      phase: "gathering",
      pos: center,
      others: ids,
    });
    setWatchOpen(false);
    message(`${ids.length}단 합체 시작! ${ids.map((id) => robotById(id).name).join(" + ")}`);
    later(GATHER_MS, () => setActor((a) => (a ? { ...a, phase: "assembling", others: [] } : a)));
    later(GATHER_MS + ASSEMBLE_MS, () => {
      dispatch({ type: "robot-fuse", ids });
      setActor((a) => (a ? { ...a, phase: "active" } : a));
      message(
        `${ids.length}단 합체 완성! 한 몸이 된 합체 로봇이야 💥 힘 ${teamPower(robots, ids)} · ${teamWeapon(ids).name}`,
      );
    });
  };
  const split = () => {
    if (!actor || team.length < 2 || busy) return;
    const others = team.slice(1);
    const core = team[0]!;
    setActor({ ...actor, phase: "splitting", others });
    later(SPLIT_MS, () =>
      setActor((a) => (a ? { ...a, team: [core], phase: "returning", others } : a)),
    );
    later(SPLIT_MS + RETURN_MS, () =>
      setActor((a) => (a ? { ...a, phase: "active", others: [] } : a)),
    );
    // The core keeps the energy it had, up to its own smaller bar.
    setDamage(ROBOT_ENERGY - Math.min(energy, ROBOT_ENERGY));
    message("합체 해제! 로봇 친구들은 시계 속으로 돌아갔어. 카드는 그대로야.");
  };
  const setMode = (mode: "follow" | "ride") => {
    if (!actor) return;
    setActor({ ...actor, mode, pos: { ...pos } });
    message(
      mode === "ride" ? "로봇에 탔어! 조이스틱으로 직접 움직여 봐." : "로봇이 내 뒤를 따라와!",
    );
  };

  const startMission = (mode: RobotMissionMode) => {
    if (!actor) {
      message("먼저 시계에서 로봇을 소환해 줘!");
      return;
    }
    setWatchOpen(false);
    const id = ++missionSerial.current;
    if (mode === "villain") {
      setMission({ id, mode });
      message(`${VILLAIN_NAME}이 나타났어! 남쪽으로 가서 무기로 막아 줘!`);
    } else if (mode === "rescue") {
      setMission({ id, mode, rescue: startRescue(), thanked: false });
      message("친구가 불꽃 덤불에 갇혔어! 북동쪽으로 가서 구해 주자!");
    } else {
      setMission({ id, mode, thief: startThief(), rewarded: false });
      message("도둑 로봇이 별코인 자루를 들고 서쪽 들판으로 도망갔어! 경찰 로봇과 잡아 보자!");
    }
  };
  // The weapon aims at the nearest job, so a far swing is honestly "too far".
  const jobs: Job[] = [];
  if (!villain.retreating) jobs.push({ kind: "villain", at: VILLAIN_SPOT });
  if (mission?.mode === "rescue" && mission.rescue.phase === "danger")
    jobs.push({ kind: "rescue", at: RESCUE_SPOT });
  if (
    mission?.mode === "thief" &&
    (mission.thief.phase === "fleeing" || mission.thief.phase === "stunned")
  )
    jobs.push({ kind: "thief", at: mission.thief.pos });
  const aim =
    jobs.sort((a, b) => worldDistance(actorPos, a.at) - worldDistance(actorPos, b.at))[0] ?? null;
  const weapon = team.length ? teamWeapon(team) : null;

  /** Counts one valid skill use on every robot in the team (same judgement as the hit). */
  const countUse = () => {
    let progress = robots;
    const words: string[] = [];
    for (const id of team) {
      const r = applyCardUse(progress, id);
      if (r.progress === progress) continue;
      progress = r.progress;
      dispatch({ type: "robot-card", id });
      const name = robotById(id).name;
      if (r.poweredUp) words.push(`파워 업! ${name}이 강화 ${name}이 됐어!`);
      if (r.unlocked) words.push(`새로운 로봇 카드가 열렸어! 🃏 ${robotById(r.unlocked).name}`);
    }
    if (words.length) setPowerUpAt(Date.now());
    return words;
  };
  const strike = () => {
    if (!actor || !weapon || busy) {
      message(actor ? "합체하는 중이야! 잠깐만." : "먼저 시계에서 로봇을 소환해 줘!");
      return;
    }
    const now = Date.now();
    setWeaponOut(true);
    clearTimeout(weaponTimer.current);
    weaponTimer.current = window.setTimeout(() => setWeaponOut(false), WEAPON_SHOW_MS);
    if (!aim) {
      message(`${weapon.name}을 꺼냈어! 지금은 맞힐 상대가 없어.`);
      return;
    }
    const result = resolveStrike(weapon, actorPos, aim.at, now, lastStrike.current);
    if (result === "cooldown") {
      message(`${weapon.name} 충전 중이야! 조금만 기다려.`);
      return;
    }
    lastStrike.current = now;
    setEffect({ kind: weapon.kind, from: actorPos, to: aim.at, hit: result === "hit", at: now });
    if (result === "far") {
      const steps = Math.round(worldDistance(actorPos, aim.at) / 50);
      message(`${weapon.name}! 앗, 너무 멀어. ${steps}걸음 더 가까이 가자!`);
      return;
    }
    const power = teamPower(robots, team);
    const words: string[] = [];
    if (aim.kind === "villain") {
      const hit = hitVillain(villain, power, now);
      setVillain(hit.villain);
      if (hit.defeated) {
        dispatch({ type: "robot-win", win: robots.wins + 1 });
        words.push(
          `물리쳤어! ${VILLAIN_NAME}이 고장 나서 수리하러 도망갔어! 🔩 부품 +${WIN_PARTS}`,
        );
        if (mission?.mode === "villain") setMission(null);
      } else
        words.push(`${weapon.name} 명중! ${VILLAIN_NAME} 힘 ${hit.villain.hp}/${hit.villain.max}`);
    } else if (aim.kind === "rescue" && mission?.mode === "rescue") {
      const amount = robotById(team[1] ?? team[0]!).family === "fire" ? 2 : 1;
      const rescue = douseRescue(mission.rescue, amount);
      setMission({ ...mission, rescue });
      if (rescue.phase === "safe") {
        // Paid right away; only the friend's thank-you waits a moment.
        dispatch({ type: "robot-mission", mode: "rescue", n: robots.rescues + 1 });
        words.push(`불꽃 덤불이 다 꺼졌어! 친구가 안전해졌어! 🔩 부품 +${MISSION_PARTS}`);
        laterMission(mission.id, 1200, (m) => {
          message(`친구: "고마워, 로봇아! 덕분에 살았어!"`);
          return m.mode === "rescue" ? { ...m, thanked: true } : m;
        });
        laterMission(mission.id, 6000, () => null);
      } else words.push(`${weapon.name}로 덤불을 껐어! 남은 불꽃 ${rescue.burning}개`);
    } else if (aim.kind === "thief" && mission?.mode === "thief") {
      const police = team.some((id) => robotById(id).family === "police");
      const hit = hitThief(mission.thief, police, now);
      if (hit.caught) {
        dispatch({ type: "robot-mission", mode: "thief", n: robots.catches + 1 });
        setMission({ ...mission, thief: hit.thief, rewarded: true });
        words.push(`도둑 로봇을 잡았어! 별코인 자루를 되찾았어! 🔩 부품 +${MISSION_PARTS}`);
        laterMission(mission.id, 2000, (m) =>
          m.mode === "thief" ? { ...m, thief: { ...m.thief, phase: "retreating" } } : m,
        );
        laterMission(mission.id, 6000, () => null);
      } else {
        setMission({ ...mission, thief: hit.thief });
        words.push(
          !police && hit.thief.stamina <= 1
            ? "도둑이 멈췄어! 그런데 잡으려면 경찰 로봇이 있어야 해!"
            : `${weapon.name} 명중! 도둑이 비틀거려. 남은 힘 ${hit.thief.stamina}`,
        );
      }
    }
    words.push(...countUse());
    message(words.join(" · "));
  };

  const nearWorkshop = allowed && worldDistance(pos, WORKSHOP) < WORKSHOP_RANGE;
  const core = actor ? robotById(team[0]!) : null;
  const coreGrade = core ? gradeOf(robots, core.id) : 0;
  const label = (): string | null => {
    if (!nearWorkshop) return null;
    return !core
      ? "정비소 · 로봇을 불러 와"
      : coreGrade >= MAX_GRADE
        ? "정비소 · 최고로 강화됨"
        : `강화하기 (부품 ${Math.min(robots.parts, UPGRADE_COST)}/${UPGRADE_COST})`;
  };
  const act = (): boolean => {
    if (!nearWorkshop) return false;
    if (!core) message("고칠 로봇을 시계에서 불러서 정비소로 와 봐!");
    else if (coreGrade >= MAX_GRADE) message(`${robotName(core, robots)}은 지금 최고로 강화됐어!`);
    else if (robots.parts < UPGRADE_COST)
      message(`부품이 ${UPGRADE_COST - robots.parts}개 더 필요해. 임무를 해서 부품을 모아 봐!`);
    else {
      dispatch({ type: "robot-upgrade", id: core.id });
      setPowerUpAt(Date.now());
      message(`뚝딱뚝딱! ${core.name}이 ${GRADES[coreGrade + 1]} ${core.name}이 됐어!`);
    }
    return true;
  };
  /** Map travel takes the robot along. */
  const arrive = (at: Point) => setActor((a) => (a ? { ...a, pos: { ...at } } : a));

  const goal =
    mission?.mode === "rescue" && !mission.thanked
      ? { name: "친구 구하기", at: RESCUE_SPOT }
      : mission?.mode === "thief" && !mission.rewarded
        ? { name: "도둑 잡기", at: mission.thief.pos }
        : mission?.mode === "villain"
          ? { name: "악당 막기", at: VILLAIN_SPOT }
          : null;
  const compass = goal
    ? (() => {
        const d = worldDelta(pos, goal.at);
        const arrow = ARROWS[(Math.round(Math.atan2(d.y, d.x) / (Math.PI / 4)) + 8) % 8];
        return `🧭 ${goal.name} ${arrow} ${Math.round(Math.hypot(d.x, d.y) / 50)}걸음`;
      })()
    : null;
  return {
    actor,
    actorPos,
    busy,
    team: team.map(robotById),
    grades: team.map((id) => gradeOf(robots, id)),
    weapon,
    weaponOut,
    effect,
    powerUpAt,
    villain,
    nearVillain,
    mission,
    energy,
    energyMax,
    uses: core ? (robots.cards[core.id]?.uses ?? 0) : 0,
    parts: robots.parts,
    watchOpen,
    setWatchOpen,
    summon,
    fuse,
    split,
    setMode,
    recall,
    startMission,
    strike,
    label,
    act,
    arrive,
    compass,
  };
}
