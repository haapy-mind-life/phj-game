import {
  nearTownBuilding,
  TOWN_BUILDINGS,
  BUILDING_ROOM,
  stepBuilding,
} from "@/game/world/building-interiors";
import { homeLot } from "@/game/world/kid-world";
import { stepRestaurant } from "@/game/play/restaurant";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/game-state";
import type { Point } from "@/game/world/adventure";
import {
  ACTORS,
  actorMayBeNear,
  actorScene,
  patrolPosition,
  nearActor,
  portalHasPriority,
  homeActorPosition,
} from "@/game/world/actors";
import {
  RESTAURANTS,
  RESTAURANT_ROOM as ROOM,
  FESTIVALS,
  isHalloween,
  FOOD_PRICES,
  restaurantById,
} from "@/game/world/world-content";
import { worldDistance } from "@/game/world/world-space";
import {
  newActivity,
  tickActivity,
  actActivity,
  type Activity,
  type ActivityKind,
} from "@/game/play/activities";
import { canWalkHome } from "@/game/world/life-world";
export function useLivingWorld({
  pos,
  lifePos,
  region,
  submarine,
  message,
  setPos,
  direction,
  vehicle,
  suspended = false,
}: {
  pos: Point;
  lifePos: Point;
  region: string;
  submarine: boolean;
  vehicle: string | null;
  suspended?: boolean;
  message: (s: string) => void;
  setPos: (p: Point) => void;
  direction: React.RefObject<() => Point>;
}) {
  const { state, dispatch, getState } = useGame();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const restaurant = restaurantId ? restaurantById(restaurantId)! : null;
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const building = TOWN_BUILDINGS.find((b) => b.id === buildingId) ?? null;
  const interior = !!restaurant || !!building;
  const [inside, setInside] = useState<Point>(ROOM.entry);
  const returnAnchor = useRef(pos);
  const [meal, setMeal] = useState<number | null>(null);
  const heldMeal = useRef<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [job, setJob] = useState<{ id: string; delivered: number; carrying: boolean } | null>(null);
  const [talk, setTalk] = useState<string | null>(null);
  const [wardrobe, setWardrobe] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const rewarded = useRef(new Set<string>());
  const [seconds, setSeconds] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const activityRef = useRef(activity);
  activityRef.current = activity;
  const current = useRef({
    pos,
    lifePos,
    region,
    companions: state.companions.length,
    houseTier: state.houseTier,
    paused: suspended || !!talk || wardrobe || menuOpen,
  });
  current.current = {
    pos,
    lifePos,
    region,
    companions: state.companions.length,
    houseTier: state.houseTier,
    paused: suspended || !!talk || wardrobe || menuOpen,
  };
  const season = isHalloween(now);
  const seasonRef = useRef(season);
  seasonRef.current = season;
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden && !current.current.paused) setSeconds((s) => s + 0.1);
      setActivity((a) => {
        if (!a || a.done || document.hidden || current.current.paused) return a;
        if (a.kind === "festival" && !seasonRef.current) return null;
        const c = current.current;
        return tickActivity(
          a,
          0.1,
          a.kind === "home" ? c.lifePos : c.pos,
          c.companions,
          c.houseTier,
        );
      });
    }, 100);
    const calendar = setInterval(() => setNow(new Date()), 10000);
    return () => {
      clearInterval(timer);
      clearInterval(calendar);
    };
  }, []);
  useEffect(() => {
    if (!activity?.done || !activity.won || rewarded.current.has(activity.id)) return;
    rewarded.current.add(activity.id);
    dispatch({
      type: "settle-activity",
      id: activity.id,
      activity: activity.kind,
      completed: true,
    });
    message("함께 놀이 성공! 별코인을 받았어!");
  }, [activity, dispatch, message]);
  useEffect(() => {
    if (!interior) return;
    let raf = 0,
      last = 0;
    const loop = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (!suspended && !menuOpen && !talk) {
        const d = direction.current();
        setInside((p) => (building ? stepBuilding : stepRestaurant)(p, d, dt));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [interior, building, suspended, menuOpen, talk, direction]);
  useEffect(() => {
    setActivity((a) =>
      a && ((a.kind === "home" && region !== "mansion") || (a.kind === "sea" && !submarine))
        ? null
        : a,
    );
  }, [region, submarine]);
  const scene = interior ? "restaurant" : region === "mansion" ? "home" : "world";
  const player = interior ? inside : region === "mansion" ? lifePos : pos;
  const nearbyActor = ACTORS.filter(
    (a) =>
      actorScene(a, state, scene) === scene &&
      !state.companions.includes(a.id) &&
      (scene !== "world" || actorMayBeNear(a, player, 180)),
  ).find((a) => {
    let p: Point;
    if (scene === "home") {
      p = homeActorPosition(a.id, state.guests);
    } else if (scene === "world") p = patrolPosition(a, seconds);
    else return false;
    return nearActor(p, player, scene);
  });
  const nearRestaurant =
    scene === "world" && !submarine
      ? RESTAURANTS.find((r) => worldDistance(pos, { x: r.x, y: r.y + 100 }) < 170)
      : undefined;
  const nearBuilding = scene === "world" && !submarine ? nearTownBuilding(pos) : null;
  const festival =
    scene === "world" && !submarine
      ? FESTIVALS.find((f) => worldDistance(f, pos) < 230)
      : undefined;
  function leaveRestaurant() {
    setRestaurantId(null);
    setPos(returnAnchor.current);
    heldMeal.current = null;
    setMeal(null);
    setJob(null);
    setMenuOpen(false);
    message("식당 앞 마을로 돌아왔어!");
  }
  function leaveBuilding() {
    setBuildingId(null);
    setPos(returnAnchor.current);
    message(`${building?.name} 앞 마을로 돌아왔어!`);
  }
  function interact(): boolean {
    if (building) {
      if (worldDistance(inside, BUILDING_ROOM.exit) < 110) leaveBuilding();
      else if (worldDistance(inside, BUILDING_ROOM.activity) < 230) message(building.response);
      else message("안쪽으로 걸어가서 둘러보고, 문 앞에서 밖으로 나가 봐!");
      return true;
    }
    if (activity) {
      if (!activity.done) setActivity((a) => (a ? actActivity(a, player) : a));
      return true;
    }
    if (scene === "world" && vehicle) return false;
    if (restaurant) {
      if (Math.hypot(inside.x - ROOM.exit.x, inside.y - ROOM.exit.y) < 110) {
        leaveRestaurant();
        return true;
      }
      if (Math.hypot(inside.x - ROOM.counter.x, inside.y - ROOM.counter.y) < 260) {
        if (job) {
          if (!job.carrying) {
            setJob({ ...job, carrying: true });
            message("음식을 받았어! 손님에게 전달해 봐.");
          }
        } else setMenuOpen(true);
        return true;
      }
      if (
        job?.carrying &&
        Math.hypot(inside.x - ROOM.customer.x, inside.y - ROOM.customer.y) < 230
      ) {
        const delivered = job.delivered + 1;
        if (delivered === 3) {
          dispatch({
            type: "settle-activity",
            id: job.id,
            activity: "restaurant",
            completed: true,
          });
          message("세 손님에게 모두 전달했어! +45 별코인");
          setJob(null);
        } else {
          setJob({ ...job, delivered, carrying: false });
          message(`${delivered}/3 전달! 카운터에서 다음 음식을 받아 봐.`);
        }
        return true;
      }
      if (meal !== null && Math.hypot(inside.x - ROOM.table.x, inside.y - ROOM.table.y) < 300) {
        heldMeal.current = null;
        setMeal(null);
        message("냠냠! 친구들과 맛있게 먹었어!");
        return true;
      }
      if (nearbyActor) {
        setTalk(nearbyActor.id);
        return true;
      }
      message("카운터에서 주문하고 식탁 가까이에서 먹어 봐.");
      return true;
    }
    if (nearRestaurant) {
      returnAnchor.current = { x: nearRestaurant.x, y: nearRestaurant.y + 130 };
      setRestaurantId(nearRestaurant.id);
      setInside({ ...ROOM.entry });
      message(`${nearRestaurant.name}에 왔어! 직접 걸어서 카운터로 가 보자.`);
      return true;
    }
    if (nearBuilding) {
      returnAnchor.current = { ...nearBuilding.door };
      setBuildingId(nearBuilding.id);
      setInside({ ...BUILDING_ROOM.entry });
      message(`${nearBuilding.name}에 들어왔어! 안쪽으로 걸어가 보자.`);
      return true;
    }
    if (festival && season) {
      start("festival", festival);
      return true;
    }
    if (
      nearbyActor &&
      !portalHasPriority(pos, scene) &&
      !(scene === "world" && worldDistance(pos, homeLot(state.homeLot)) < 185)
    ) {
      setTalk(nearbyActor.id);
      return true;
    }
    return false;
  }
  function label() {
    if (building) {
      if (worldDistance(inside, BUILDING_ROOM.exit) < 110) return "건물 밖으로";
      if (worldDistance(inside, BUILDING_ROOM.activity) < 230) return building.action;
      return `${building.name} 둘러보기`;
    }
    if (activity) return activity.done ? "놀이 결과" : "가까운 놀이 대상";
    if (scene === "world" && vehicle) return null;
    if (restaurant) {
      if (Math.hypot(inside.x - ROOM.exit.x, inside.y - ROOM.exit.y) < 110) return "식당 밖으로";
      if (Math.hypot(inside.x - ROOM.counter.x, inside.y - ROOM.counter.y) < 260)
        return job ? "음식 받기" : "음식 주문";
      if (job?.carrying && Math.hypot(inside.x - ROOM.customer.x, inside.y - ROOM.customer.y) < 230)
        return "손님에게 전달";
      if (meal !== null && Math.hypot(inside.x - ROOM.table.x, inside.y - ROOM.table.y) < 300)
        return "음식 먹기";
      return "식당 둘러보기";
    }
    if (nearRestaurant) return `${nearRestaurant.name} 들어가기`;
    if (nearBuilding) return `${nearBuilding.name} 들어가기`;
    if (festival && season) return "할로윈 축제 참여";
    if (
      nearbyActor &&
      !portalHasPriority(pos, scene) &&
      !(scene === "world" && worldDistance(pos, homeLot(state.homeLot)) < 185)
    )
      return `${nearbyActor.name} 대화`;
    return null;
  }
  function start(kind: ActivityKind, origin: Point) {
    setActivity(newActivity(kind, origin, `${kind}-${crypto.randomUUID()}`));
    message(
      kind === "home"
        ? "공을 찾아 아빠·친구에게 던져 봐!"
        : "가까이 가서 행동 버튼을 눌러 모아 봐!",
    );
  }
  function social(mode: "follow" | "invite" | "leave") {
    if (!talk) return;
    const before = getState();
    const after = dispatch({ type: "companion", id: talk, mode });
    if (before === after) message("함께할 수 있는 친구는 네 명이야. 먼저 한 명과 인사해 줘.");
    else
      message(
        mode === "invite"
          ? "우리 집에 먼저 가 있을게!"
          : mode === "follow"
            ? "좋아! 같이 놀러 가자!"
            : "다음에 또 같이 놀자!",
      );
    setTalk(null);
  }
  function buyMeal(index: number) {
    if (heldMeal.current !== null) {
      message("손에 든 음식을 먼저 먹어 봐.");
      return;
    }
    const before = getState();
    const after = dispatch({ type: "buy-meal", priceIndex: index });
    if (after === before) {
      message("별코인이 부족해. 식당 아르바이트로 벌어 보자!");
      return;
    }
    heldMeal.current = index;
    setMeal(index);
    setMenuOpen(false);
    message(`${restaurant?.menu[index]}를 받았어. 식탁으로 가 보자!`);
  }
  return {
    restaurant,
    building,
    interior,
    leaveBuilding,
    aboard: scene === "world" ? vehicle : null,
    inside,
    meal,
    job,
    menuOpen,
    setMenuOpen,
    buyMeal,
    startJob: () => {
      setJob({ id: `restaurant-${crypto.randomUUID()}`, delivered: 0, carrying: true });
      setMenuOpen(false);
      message("첫 음식을 받았어! 손님 세 명에게 전달하면 45 별코인이야.");
    },
    leaveRestaurant,
    talk,
    setTalk,
    social,
    wardrobe,
    setWardrobe,
    activity,
    setActivity,
    start,
    seconds,
    season,
    scene,
    player,
    interact,
    label,
    blocked: !!talk || wardrobe || menuOpen,
    ink: activity?.ink ?? 0,
  };
}
