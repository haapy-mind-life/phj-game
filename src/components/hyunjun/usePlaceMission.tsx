import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game-state";
import { CARS } from "@/game/cars";
import {
  createMission,
  actMission,
  missionTarget,
  MISSION_LABELS,
  type MissionKind,
  type PlaceMission,
} from "@/game/place-play";
import type { Point } from "@/game/adventure";
import { worldDistance } from "@/game/world-space";
export function usePlaceMission(pos: Point, enabled: boolean, message: (s: string) => void) {
  const { state, dispatch } = useGame();
  const [mission, setMission] = useState<PlaceMission | null>(null);
  const ref = useRef(mission);
  ref.current = mission;
  const [seconds, setSeconds] = useState(0);
  const [spray, setSpray] = useState<{ x: number; y: number; until: number } | null>(null);
  const elapsed = useRef(0);
  const running = !!mission && !mission.done && enabled;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (!document.hidden) {
        elapsed.current += 0.1;
        setSeconds(elapsed.current);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [running]);
  function start(kind: MissionKind) {
    const car = CARS.find((c) => c.kind === (kind === "delivery" ? "sport" : kind))!;
    if (!state.ownedCars.includes(car.id)) return null;
    elapsed.current = 0;
    setSeconds(0);
    const m = createMission(kind, crypto.randomUUID(), !!state.carUpgrades[car.id]?.special);
    ref.current = m;
    setMission(m);
    message(MISSION_LABELS[kind] + "! 반짝 표시를 찾아가자.");
    return car;
  }
  function act() {
    const m = ref.current;
    if (!m || m.done) return;
    const next = actMission(m, pos, elapsed.current);
    if (next === m) {
      message("반짝 표시까지 자동차로 이동해 봐!");
      return;
    }
    if (m.kind === "fire") {
      const target = missionTarget(m, elapsed.current);
      setSpray({ ...target, until: elapsed.current + 0.7 });
    }
    ref.current = next;
    setMission(next);
    if (next.done) {
      dispatch({ type: "settle-play", id: m.id, activity: m.kind, bonus: elapsed.current <= 90 });
      message(`성공! ⭐ ${elapsed.current <= 90 ? "보너스도 받았어!" : "별코인을 받았어!"}`);
    } else
      message(
        next.kind === "ambulance"
          ? "친구 탑승! 다음 표시로 안전하게 가자."
          : "잘했어! 다음 반짝 표시로 가 보자.",
      );
  }
  const target = mission ? missionTarget(mission, seconds) : null;
  const near =
    target && mission
      ? worldDistance(pos, target) <= (mission.kind === "fire" && mission.special ? 165 : 110)
      : false;
  return {
    mission,
    spray: spray && spray.until > seconds ? spray : null,
    start,
    act,
    target,
    near,
    seconds,
    end: () => {
      ref.current = null;
      setMission(null);
    },
    label: mission?.done
      ? "놀이 완료"
      : mission?.kind === "fire"
        ? "물 뿌리기"
        : mission?.kind === "ambulance"
          ? "태우기 · 내려주기"
          : mission?.kind === "police"
            ? "단서 찾기"
            : "꾸러미 전달",
  };
}
