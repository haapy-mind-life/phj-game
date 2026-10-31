import { useEffect, useRef, useState } from "react";
import type { Point } from "@/game/adventure";
import {
  BATTLE_RANGE,
  CARD_COOLDOWN_MS,
  CARD_USES_TO_UNLOCK,
  GRADES,
  MAX_GRADE,
  MEET_RANGE,
  ROBOTS,
  ROBOT_ENERGY,
  UPGRADE_COST,
  VILLAIN_HIT_MS,
  VILLAIN_NAME,
  VILLAIN_SPOT,
  WIN_PARTS,
  WORKSHOP,
  WORKSHOP_RANGE,
  robotById,
  robotPosition,
  type RobotSpecies,
  type RobotSpeciesId,
} from "@/game/robot-catalog";
import {
  applyCardUse,
  freshVillain,
  fusionTeam,
  gradeOf,
  hasCard,
  hitVillain,
  maxFusion,
  villainMaxHp,
  teamPower,
  type RobotProgress,
} from "@/game/robot-engine";
import { worldDistance } from "@/game/world-space";
import type { GameState, WorldAction } from "@/lib/world-model";

export const robotName = (robot: RobotSpecies, robots: RobotProgress) => {
  const grade = gradeOf(robots, robot.id);
  return grade > 0 ? `${GRADES[grade]} ${robot.name}` : robot.name;
};

/** Robots roaming the village, riding and fusing them, fighting the villain and upgrading. */
export function useRobotWorld({
  pos,
  seconds,
  allowed,
  state,
  dispatch,
  message,
}: {
  pos: Point;
  seconds: number;
  /** On foot in the open village: not inside, not in a car, plane, submarine or lake. */
  allowed: boolean;
  state: GameState;
  dispatch: (action: WorldAction) => unknown;
  message: (text: string) => void;
}) {
  const robots = state.robots;
  const [riding, setRiding] = useState<RobotSpeciesId | null>(null);
  const [size, setSize] = useState(1);
  const [villain, setVillain] = useState(() => freshVillain(robots.wins));
  // Hits taken this ride. Energy is derived from it, so splitting and re-joining a fusion
  // can't refill the bar: joining robots raise the maximum, leaving robots lower it again.
  const [damage, setDamage] = useState(0);
  const lastCard = useRef(0);
  const team = riding ? fusionTeam(robots, riding, size) : [];
  const energyMax = ROBOT_ENERGY + (team.length - 1) * 2;
  const energy = Math.max(0, energyMax - damage);
  const getOff = () => {
    setRiding(null);
    setSize(1);
    setDamage(0);
  };
  useEffect(() => {
    if (!allowed && riding) getOff();
  }, [allowed, riding]);
  // A switched-off villain comes back from repairs a little tougher: endless adventure.
  useEffect(() => {
    if (!villain.retreating) return;
    const t = setTimeout(
      () => setVillain(freshVillain(robots.wins)),
      Math.max(0, villain.back - Date.now()),
    );
    return () => clearTimeout(t);
  }, [villain, robots.wins]);
  // The first villain is made before the save loads; an untouched one follows the saved wins.
  useEffect(() => {
    if (
      !villain.retreating &&
      villain.hp === villain.max &&
      villain.max !== villainMaxHp(robots.wins)
    )
      setVillain(freshVillain(robots.wins));
  }, [villain, robots.wins]);
  const ridingRobot = riding ? robotById(riding) : null;
  const nearVillain = !!riding && worldDistance(pos, VILLAIN_SPOT) < BATTLE_RANGE;
  const fighting = nearVillain && !villain.retreating;
  // The villain fights back; an empty energy bar breaks the robot down, but nothing is lost.
  useEffect(() => {
    if (!fighting) return;
    const t = setInterval(() => setDamage((d) => d + 1), VILLAIN_HIT_MS);
    return () => clearInterval(t);
  }, [fighting]);
  useEffect(() => {
    if (energy > 0 || !riding) return;
    getOff();
    message("로봇이 고장 났어! 정비소에서 금방 고쳤어. 합체해서 더 세게 다시 도전해 봐!");
  }, [energy, riding, message]);
  const nearWorkshop = allowed && worldDistance(pos, WORKSHOP) < WORKSHOP_RANGE;
  const roaming = ROBOTS.filter(
    (r) => (r.starter || hasCard(robots, r.id)) && !team.includes(r.id),
  ).map((robot) => ({ robot, p: robotPosition(robot, seconds) }));
  const near = allowed
    ? roaming
        .map((r) => ({ ...r, d: worldDistance(pos, r.p) }))
        .filter((r) => r.d < MEET_RANGE)
        .sort((a, b) => a.d - b.d)[0]?.robot
    : undefined;
  const uses = riding ? (robots.cards[riding]?.uses ?? 0) : 0;
  const grade = riding ? gradeOf(robots, riding) : 0;
  const ridingName = ridingRobot
    ? (team.length > 1 ? `${team.length}단 합체 ` : "") + robotName(ridingRobot, robots)
    : "";
  const label = (): string | null => {
    if (!allowed) return null;
    if (fighting) return `카드 쓰기 (${uses}/${CARD_USES_TO_UNLOCK})`;
    if (nearWorkshop)
      return !ridingRobot
        ? "정비소 · 로봇을 타고 와"
        : grade >= MAX_GRADE
          ? "정비소 · 최고로 강화됨"
          : `강화하기 (부품 ${Math.min(robots.parts, UPGRADE_COST)}/${UPGRADE_COST})`;
    if (!riding && near) return `${near.name} ${hasCard(robots, near.id) ? "타기" : "만나기"}`;
    return null;
  };
  const cardOnVillain = () => {
    if (!ridingRobot) return;
    const now = Date.now();
    if (now - lastCard.current < CARD_COOLDOWN_MS) {
      message("카드 충전 중이야! 조금만 기다려.");
      return;
    }
    lastCard.current = now;
    const opened = applyCardUse(robots, ridingRobot.id).unlocked;
    dispatch({ type: "robot-card", id: ridingRobot.id });
    const hit = hitVillain(villain, teamPower(robots, team), now);
    setVillain(hit.villain);
    const words = [
      hit.defeated
        ? `물리쳤어! ${VILLAIN_NAME}이 고장 나서 수리하러 도망갔어! 🔩 부품 +${WIN_PARTS}`
        : `${ridingRobot.skill}! ${VILLAIN_NAME}에 맞았어! 남은 힘 ${hit.villain.hp}/${hit.villain.max}`,
    ];
    if (hit.defeated) dispatch({ type: "robot-win", win: robots.wins + 1 });
    if (opened) words.unshift(`축하해! 새로운 로봇 카드가 열렸어! 🃏 ${robotById(opened).name}`);
    else if (uses < CARD_USES_TO_UNLOCK)
      words.push(`카드 ${uses + 1}/${CARD_USES_TO_UNLOCK} · 7번 사용하면 더 강한 로봇이 열려!`);
    message(words.join(" · "));
  };
  const act = (): boolean => {
    if (!allowed) return false;
    if (fighting) {
      cardOnVillain();
      return true;
    }
    if (nearWorkshop) {
      if (!ridingRobot) message("고칠 로봇을 타고 정비소로 와 봐!");
      else if (grade >= MAX_GRADE)
        message(`${robotName(ridingRobot, robots)}은 지금 최고로 강화됐어!`);
      else if (robots.parts < UPGRADE_COST)
        message(
          `부품이 ${UPGRADE_COST - robots.parts}개 더 필요해. ${VILLAIN_NAME}을 물리치면 부품을 받아!`,
        );
      else {
        dispatch({ type: "robot-upgrade", id: ridingRobot.id });
        message(`뚝딱뚝딱! ${ridingRobot.name}이 강화 ${ridingRobot.name}이 됐어! 힘이 더 세졌어!`);
      }
      return true;
    }
    if (!riding && near) {
      if (!hasCard(robots, near.id)) {
        dispatch({ type: "robot-meet", id: near.id });
        message(`${near.name}을 만났어! 🃏 ${near.name} 카드를 받았어. 한 번 타 볼까?`);
      } else {
        setRiding(near.id);
        setDamage(0);
        message(`${robotName(near, robots)}에 탔어! 남쪽의 ${VILLAIN_NAME}에게 카드를 써 봐.`);
      }
      return true;
    }
    return false;
  };
  const canFuse = !!riding && maxFusion(robots) >= 2;
  const nextSize = size >= maxFusion(robots) ? 1 : size + 1;
  const fuseLabel = !canFuse ? null : nextSize === 1 ? "합체 풀기" : `${nextSize}단 합체`;
  const fuse = () => {
    if (!riding || !canFuse) return;
    const next = fusionTeam(robots, riding, nextSize);
    setSize(nextSize);
    message(
      nextSize === 1
        ? "합체를 풀었어! 로봇 친구들이 다시 마을로 돌아갔어."
        : `${nextSize}단 합체! ${next.map((id) => robotById(id).name).join(" + ")} 💥 힘 ${teamPower(robots, next)}!`,
    );
  };
  const dismount = () => {
    if (!riding) return;
    getOff();
    message(`${robotById(riding).name}에서 내렸어.`);
  };
  return {
    riding: ridingRobot,
    ridingName,
    team: team.map(robotById),
    grades: team.map((id) => gradeOf(robots, id)),
    roaming,
    villain,
    nearVillain,
    energy,
    energyMax,
    uses,
    parts: robots.parts,
    label,
    act,
    dismount,
    fuse,
    fuseLabel,
  };
}
