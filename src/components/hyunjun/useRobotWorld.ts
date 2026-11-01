import { useEffect, useRef, useState } from "react";
import type { Point } from "@/game/adventure";
import {
  CARD_COOLDOWN_MS,
  CARD_USES_TO_UNLOCK,
  MEET_RANGE,
  PRACTICE_RANGE,
  PRACTICE_TARGET,
  ROBOTS,
  robotById,
  robotPosition,
  type RobotMissionMode,
  type RobotSpeciesId,
} from "@/game/robot-catalog";
import {
  applyCardUse,
  hasCard,
  isWatchCardAvailable,
  upgradeCost,
  WATCH_GRADES,
} from "@/game/robot-engine";
import { worldDistance } from "@/game/world-space";
import type { GameState, WorldAction } from "@/lib/world-model";

/** Watch summons robot helpers to the open world; no card is physically inserted. */
export function useRobotWorld({
  pos, seconds, allowed, state, dispatch, message,
}: {
  pos: Point;
  seconds: number;
  allowed: boolean;
  state: GameState;
  dispatch: (action: WorldAction) => unknown;
  message: (text: string) => void;
}) {
  const [riding, setRiding] = useState<RobotSpeciesId | null>(null);
  const [summoned, setSummoned] = useState<RobotSpeciesId | null>(null);
  const [watchOpen, setWatchOpen] = useState(false);
  const [selected, setSelected] = useState<RobotSpeciesId>("rb-police");
  const [fusionIds, setFusionIds] = useState<RobotSpeciesId[]>([]);
  const [fusionActive, setFusionActive] = useState<RobotSpeciesId[]>([]);
  const [mission, setMission] = useState<{
    id: string;
    mode: RobotMissionMode;
    hp: number;
  } | null>(null);
  const lastCard = useRef(0);
  const missionSerial = useRef(0);
  useEffect(() => {
    if (!allowed) {
      setRiding(null);
      setSummoned(null);
      setFusionActive([]);
      setMission(null);
      setWatchOpen(false);
    }
  }, [allowed]);
  const robots = state.robots;
  const roaming = ROBOTS.filter((r) => (r.starter || hasCard(robots, r.id)) && r.id !== riding && r.id !== summoned)
    .map((robot) => ({ robot, p: robotPosition(robot, seconds) }));
  const near = allowed
    ? roaming.map((r) => ({ ...r, d: worldDistance(pos, r.p) }))
      .filter((r) => r.d < MEET_RANGE).sort((a,b) => a.d - b.d)[0]?.robot
    : undefined;
  const ridingRobot = riding ? robotById(riding) : null;
  const summonedRobot = summoned ? robotById(summoned) : null;
  const activeId = summoned ?? riding;
  const activeRobot = activeId ? robotById(activeId) : null;
  const nearTarget = !!activeId && worldDistance(pos, PRACTICE_TARGET) < PRACTICE_RANGE;
  const uses = activeId ? (robots.cards[activeId]?.uses ?? 0) : 0;
  const summon = (id: RobotSpeciesId) => {
    if (!allowed || !isWatchCardAvailable(robots, id)) return;
    if (!hasCard(robots, id)) dispatch({ type: "robot-meet", id });
    setSelected(id);
    setSummoned(id);
    setRiding(null);
    setFusionActive([]);
    setMission(null);
    setWatchOpen(false);
    message(`${robotById(id).name} 소환! 시계에서 카드 그림을 고르니 로봇이 나타났어!`);
  };
  const activateCard = (): boolean => {
    if (!allowed || !activeId) return false;
    if (uses >= CARD_USES_TO_UNLOCK) {
      message(`${activeRobot?.name} 카드 7/7 완료! 더 강한 카드가 열렸어.`);
      return true;
    }
    const now = Date.now();
    if (now - lastCard.current < CARD_COOLDOWN_MS) {
      message("카드 기술이 충전 중이야!");
      return true;
    }
    lastCard.current = now;
    const unlocked = applyCardUse(robots, activeId).unlocked;
    dispatch({ type: "robot-card", id: activeId });
    message(unlocked
      ? `축하해! 새로운 로봇 카드가 열렸어! ${robotById(unlocked).name} · 시계를 열어 봐!`
      : `${activeRobot?.skill}! 카드 ${uses + 1}/7 · 일곱 번 쓰면 업그레이드!`);
    return true;
  };
  const toggleFusionMember = (id: RobotSpeciesId) => {
    if (!isWatchCardAvailable(robots, id)) return;
    setFusionIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id)
      : current.length < 3 ? [...current, id] : current);
  };
  const fuse = () => {
    const ids = fusionIds;
    if (ids.length < 2 || ids.length > 3 || new Set(ids).size !== ids.length ||
        ids.some((id) => !isWatchCardAvailable(robots, id))) {
      message("시계에서 서로 다른 로봇을 2개 또는 3개 골라 줘!");
      return;
    }
    for (const id of ids) if (!hasCard(robots, id)) dispatch({ type: "robot-meet", id });
    dispatch({ type: "robot-fuse", ids });
    setFusionActive([...ids]);
    setSummoned(ids[0]);
    setRiding(null);
    setMission(null);
    setWatchOpen(false);
    message(`합체 성공! ${ids.length}단 합체 로봇 출동!`);
  };
  const startMission = (mode: RobotMissionMode) => {
    if (!allowed || !activeId) {
      message("먼저 소환 시계에서 로봇을 불러 줘!");
      return;
    }
    missionSerial.current += 1;
    setMission({ mode, hp: mode === "villain" ? 3 : 2, id: `${Date.now()}-${missionSerial.current}` });
    setWatchOpen(false);
    message(mode === "villain" ? "악당 로봇 출현! 기술과 무기로 막아 줘!"
      : mode === "rescue" ? "친구가 위험해! 로봇을 움직여 구하러 가자!"
      : "도둑 로봇을 발견했어! 경찰 로봇과 함께 잡아 보자!");
  };
  const attack = () => {
    if (!allowed || !activeId || !mission) {
      message("시계로 로봇을 소환하고 임무를 골라 줘!");
      return;
    }
    const nextHp = mission.hp - (fusionActive.length >= 2 ? 2 : 1);
    if (nextHp > 0) {
      setMission({ ...mission, hp: nextHp });
      activateCard();
      message(`${activeRobot?.skill} 발사! ${mission.mode === "rescue" ? "구조 지점" : "악당"}까지 ${nextHp}번 남았어!`);
      return;
    }
    dispatch({ type: "robot-mission", id: mission.id, mode: mission.mode });
    activateCard();
    setMission(null);
    message(mission.mode === "villain" ? "악당을 물리쳤어! 강화 재료를 받았어!"
      : mission.mode === "rescue" ? "친구 구출 성공! 정말 고마워!"
      : "도둑 로봇을 잡았어! 마을이 안전해졌어!");
  };
  const upgrade = () => {
    const cost = upgradeCost(robots.grade);
    if (robots.grade >= WATCH_GRADES.length - 1) {
      message("다이아몬드 최강 등급이야!");
      return;
    }
    if (robots.materials < cost) {
      message(`강화 재료 ${cost}개가 필요해! 임무를 완료해서 모아 보자.`);
      return;
    }
    dispatch({ type: "robot-upgrade" });
    message(`로봇 업그레이드! ${WATCH_GRADES[robots.grade + 1]} 등급이 됐어!`);
  };
  const label = (): string | null => {
    if (!allowed) return null;
    if (activeRobot && nearTarget && !mission) return `카드 쓰기 (${uses}/${CARD_USES_TO_UNLOCK})`;
    if (!riding && near && !summoned) return `${near.name} ${hasCard(robots, near.id) ? "타기" : "만나기"}`;
    return null;
  };
  const act = (): boolean => {
    if (!allowed) return false;
    if (activeRobot && nearTarget && !mission) return activateCard();
    if (!riding && near && !summoned) {
      if (!hasCard(robots, near.id)) {
        dispatch({ type: "robot-meet", id: near.id });
        message(`${near.name}을 만났어! 시계에 로봇 카드가 저장됐어.`);
      } else {
        setRiding(near.id);
        message(`${near.name}에 탔어! 소환 시계도 열어 봐.`);
      }
      return true;
    }
    return false;
  };
  const dismount = () => {
    if (!riding) return;
    setRiding(null);
    message(`${robotById(riding).name}에서 내렸어.`);
  };
  return {
    riding: ridingRobot, summoned: summonedRobot, activeRobot,
    fusionActive, fusionIds, toggleFusionMember, fuse,
    mission, startMission, attack, upgrade,
    watchOpen, setWatchOpen, selected, setSelected, summon,
    roaming, nearTarget, uses, label, act, dismount, activateCard,
  };
}
