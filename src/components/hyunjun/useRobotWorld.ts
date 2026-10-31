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
  type RobotSpeciesId,
} from "@/game/robot-catalog";
import { applyCardUse, hasCard } from "@/game/robot-engine";
import { worldDistance } from "@/game/world-space";
import type { GameState, WorldAction } from "@/lib/world-model";

/** Robots roaming the village, riding one, and using its card on the practice robot. */
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
  const [riding, setRiding] = useState<RobotSpeciesId | null>(null);
  const lastCard = useRef(0);
  useEffect(() => {
    if (!allowed && riding) setRiding(null);
  }, [allowed, riding]);
  const robots = state.robots;
  const roaming = ROBOTS.filter((r) => (r.starter || hasCard(robots, r.id)) && r.id !== riding).map(
    (robot) => ({ robot, p: robotPosition(robot, seconds) }),
  );
  const near = allowed
    ? roaming
        .map((r) => ({ ...r, d: worldDistance(pos, r.p) }))
        .filter((r) => r.d < MEET_RANGE)
        .sort((a, b) => a.d - b.d)[0]?.robot
    : undefined;
  const ridingRobot = riding ? robotById(riding) : null;
  const nearTarget = !!riding && worldDistance(pos, PRACTICE_TARGET) < PRACTICE_RANGE;
  const uses = riding ? (robots.cards[riding]?.uses ?? 0) : 0;
  const label = (): string | null => {
    if (!allowed) return null;
    if (ridingRobot && nearTarget) return `카드 쓰기 (${uses}/${CARD_USES_TO_UNLOCK})`;
    if (!riding && near) return `${near.name} ${hasCard(robots, near.id) ? "타기" : "만나기"}`;
    return null;
  };
  const act = (): boolean => {
    if (!allowed) return false;
    if (ridingRobot && nearTarget) {
      if (uses >= CARD_USES_TO_UNLOCK) {
        message(`${ridingRobot.name} 카드는 7번을 다 채웠어! 새로 열린 로봇도 타 봐.`);
        return true;
      }
      const now = Date.now();
      if (now - lastCard.current < CARD_COOLDOWN_MS) {
        message("카드 충전 중이야! 조금만 기다려.");
        return true;
      }
      lastCard.current = now;
      const opened = applyCardUse(robots, ridingRobot.id).unlocked;
      dispatch({ type: "robot-card", id: ridingRobot.id });
      message(
        opened
          ? `축하해! 새로운 로봇 카드가 열렸어! 🃏 ${robotById(opened).name}`
          : `${ridingRobot.skill}! 연습 로봇에 맞았어! 카드 ${uses + 1}/${CARD_USES_TO_UNLOCK} · 카드를 7번 사용하면 더 강한 로봇을 사용할 수 있어!`,
      );
      return true;
    }
    if (!riding && near) {
      if (!hasCard(robots, near.id)) {
        dispatch({ type: "robot-meet", id: near.id });
        message(`${near.name}을 만났어! 🃏 ${near.name} 카드를 받았어. 한 번 타 볼까?`);
      } else {
        setRiding(near.id);
        message(`${near.name}에 탔어! 연습 로봇에게 가서 카드를 써 봐.`);
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
  return { riding: ridingRobot, roaming, nearTarget, uses, label, act, dismount };
}
