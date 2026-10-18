import { DiveScene } from "./DiveScene";
import { TruckScene } from "./TruckScene";
import { usePlaceMission } from "./usePlaceMission";
import { DELIVERY_GARAGE, MISSION_LABELS, type MissionKind } from "@/game/place-play";
import { WorldExpansion, WorldCopies, LegacySection, WorldOverlay } from "./WorldExpansion";
import { People } from "./People";
import { RestaurantScene } from "./RestaurantScene";
import { useLivingWorld } from "./useLivingWorld";
import { LivingPanels, ActivityTargets } from "./LivingPanels";
import { worldDistance, isOcean } from "@/game/world-space";
import { RESTAURANT_ROOM } from "@/game/world-content";
import { RobotArt } from "./RobotArt";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CANDY_SPOTS,
  candySpotsForHouse,
  DECOR,
  DECOR_LIMIT,
  PARTY_DECOR_NEEDED,
  YARD,
  halloweenDecorCount,
  useGame,
} from "@/lib/game-state";
import {
  MAP,
  SPAWN,
  PORTALS,
  cameraAt,
  nearestPortal,
  stepPlayer,
  type MiniKind,
  type Point,
} from "@/game/adventure";
import { Mascot } from "./Art";
import { FriendArt } from "./FriendArt";
import { Garage, loadCarId, saveCarId } from "./Garage";
import { CarArt } from "./CarArt";
import { carById, CARS } from "@/game/cars";
import { WorldScenes } from "./WorldScenes";
import { LifeWorldScene } from "./LifeWorldScene";
import { FamilyRoomPanel, RemotePlayers } from "./FamilyRoom";
import { useFamilyRoom } from "./useFamilyRoom";
import { UnifiedCoast, GrowingHome, PlaneArt, YardDecor } from "./UnifiedCoast";
import {
  COAST,
  OCEAN,
  HOUSE_TIERS,
  OCEAN_DISCOVERIES,
  AIRPORT,
  RUNWAY,
  canLandPlane,
  nearWorld,
  onRunway,
  stepPlane,
  stepSubmarine,
} from "@/game/unified-world";
import {
  FOOD_MENU,
  LIFE_MAPS,
  LIFE_SPOTS,
  LIFE_REGION_LABELS,
  nearbyTreasure,
  stepLifePlayer,
  type LifeRegion,
  type FoodId,
} from "@/game/life-world";
import { playGameSiren } from "@/game/siren";
import {
  WORLD_CALLS,
  STATIONS,
  CAMP,
  distance,
  canHelp,
  helpProgress,
  nextCallIndex,
  routeDirection,
  isNearLake,
  enterLake,
  diveStep,
  leaveLake,
  isNearCamp,
  thiefPosition,
} from "@/game/world-events";
import { Shell } from "./Shell";
import { MiniGame } from "./MiniGame";
import { useMovement } from "./useMovement";
import { Joystick } from "./Joystick";
import { VILLAGES } from "@/game/villages";
import { Constellation } from "./Constellation";
import "./adventure.css";
let returnPosition: Point = { ...SPAWN };
const trees = Array.from({ length: 75 }, (_, i) => ({
  x: 80 + ((i * 379) % 2640),
  y: 80 + ((i * 587) % 1640),
})).filter(
  (p) =>
    Math.abs(p.y - 850) > 130 &&
    Math.abs(p.x - 1350) > 130 &&
    !PORTALS.some((g) => Math.hypot(g.x - p.x, g.y - p.y) < 180),
);
function Cottage({ x, y, color, label }: { x: number; y: number; color: string; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="120" cy="180" rx="145" ry="25" fill="#46614d15" />
      <rect
        x="12"
        y="30"
        width="216"
        height="150"
        rx="18"
        fill="#fff6dc"
        stroke="#e6d4b5"
        strokeWidth="6"
      />
      <path d="M-10 55 120-28 250 55Z" fill={color} />
      <path
        d="M-10 55 120-28 250 55"
        fill="none"
        stroke="#ffffff80"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <rect x="98" y="96" width="45" height="84" rx="20" fill="#a48770" />
      <circle cx="132" cy="145" r="4" fill="#f3d98a" />
      {[37, 166].map((xx) => (
        <g key={xx}>
          <rect
            x={xx}
            y="85"
            width="40"
            height="43"
            rx="10"
            fill="#bddde0"
            stroke="white"
            strokeWidth="5"
          />
          <path d={`M${xx + 20} 86v42M${xx} 107h40`} stroke="white" strokeWidth="4" />
        </g>
      ))}
      <text x="120" y="76" textAnchor="middle" fontSize="15" fill="#665847">
        {label}
      </text>
    </g>
  );
}
const mapX = (x: number) => 10 + (x / MAP.width) * 320;
const mapY = (y: number) => 14 + (y / MAP.height) * 132;
export function Village() {
  const { state, dispatch, ready } = useGame();
  const nav = useNavigate();
  const [seaOpen, setSeaOpen] = useState(false);
  const [station, setStation] = useState<MissionKind | null>(null);
  const diveReturn = useRef({ driving: false });
  const [pos, setPos] = useState<Point>(() => ({ ...returnPosition }));
  const [size, setSize] = useState({ w: 960, h: 600 });
  const [mini, setMini] = useState<MiniKind | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [message, setMessage] = useState("현준아, 오늘은 어디로 가볼까? 길을 따라 걸어가 봐!");
  const [walking, setWalking] = useState(false);
  const [region, setRegion] = useState<LifeRegion>("village");
  const [lifePos, setLifePos] = useState<Point>({ ...LIFE_SPOTS.mansionInside });
  const [holding, setHolding] = useState<FoodId | null>(null);
  const [robotFollowing, setRobotFollowing] = useState(false);
  const [submarine, setSubmarine] = useState(false);
  const [plane, setPlane] = useState<"off" | "ground" | "air">("off");
  const [altitude, setAltitude] = useState(0);
  const [submerged, setSubmerged] = useState(false);
  const [truckOpen, setTruckOpen] = useState(false);
  const nearLife = (point: Point, range = 180) => nearWorld(pos, point, range);
  const atOriginalHouse = nearWorld(pos, { x: 480, y: 565 }, 185);
  const goHomeInside = () => {
    setRegion("mansion");
    setDiving(false);
    setLifePos({ x: 650, y: 650 });
    setDriving(false);
    setSubmarine(false);
    setPlane("off");
    setAltitude(0);
    setMessage("현준이 집 안으로 들어왔어! 부엌에서 음식을 집고 식탁에서 먹어 봐.");
  };
  const backToWorld = () => {
    setRegion("village");
    setPos({ x: 480, y: 610 });
    returnPosition = { x: 480, y: 610 };
    setMessage("내가 키운 집 앞으로 돌아왔어!");
  };
  const upgradeHome = () => {
    const next = HOUSE_TIERS[state.houseTier];
    if (!next) {
      setMessage("우리 집이 최고의 성으로 완성됐어!");
      return;
    }
    if (state.money < next.cost) {
      setMessage("집을 키우려면 " + next.cost + " 별코인이 필요해. 푸드트럭 장사를 해보자!");
      return;
    }
    dispatch({ type: "upgrade-house" });
    setMessage("축하해! 우리 집이 " + next.name + "으로 커졌어!");
  };
  const actionLife = () => {
    if (region === "mansion") {
      if (nearWorld(lifePos, LIFE_SPOTS.mansionExit, 180)) {
        backToWorld();
        return;
      }
      const candy =
        state.halloween.active && living.season
          ? candySpotsForHouse(state.houseTier).find(
              (c) => !state.halloween.candy.includes(c.id) && nearWorld(lifePos, c, 170),
            )
          : undefined;
      if (candy) {
        dispatch({ type: "collect-candy", id: candy.id });
        setMessage(
          state.halloween.candy.length + 1 >= CANDY_SPOTS.length
            ? "사탕을 모두 모았어! 할로윈 파티 대성공! 🎃"
            : "사탕 발견! 🍬 " + (state.halloween.candy.length + 1) + "/" + CANDY_SPOTS.length,
        );
        return;
      }
      if (nearWorld(lifePos, LIFE_SPOTS.mansionKitchen, 300)) {
        setHolding("pizza");
        setMessage("피자를 손에 들었어! 식탁에서 먹어 보자.");
        return;
      }
      if (nearWorld(lifePos, LIFE_SPOTS.mansionDining, 310) && holding) {
        setHolding(null);
        setMessage("냠냠! 맛있게 먹었어!");
        return;
      }
      if (nearWorld(lifePos, { x: 350, y: 550 }, 170)) {
        setMessage("폭신한 침대에서 쭉 기지개! 다시 신나게 놀자.");
        return;
      }
      setMessage("침대에서 쉬거나 부엌과 식탁을 찾아가 봐!");
      return;
    }
    if (plane !== "off") {
      if (plane === "air") {
        if (!canLandPlane(pos)) {
          setMessage("바다 위에는 착륙할 수 없어! 땅이나 활주로를 찾아 봐.");
          return;
        }
        setPlane("ground");
        setMessage(
          onRunway(pos) ? "활주로에 사뿐히 착륙!" : "땅에 착륙했어! 비행기에서 내릴 수 있어.",
        );
        return;
      }
      if (onRunway(pos)) {
        setPlane("air");
        setMessage("이륙! 조이스틱으로 하늘을 날아 큰 바다까지 가 봐.");
        return;
      }
      setPlane("off");
      setAltitude(0);
      setMessage("비행기에서 내렸어. 활주로에서 다시 탈 수 있어.");
      return;
    }
    if (nearLife(AIRPORT, 260) && !submarine) {
      setDriving(false);
      setPlane("ground");
      setPos({ ...AIRPORT });
      setMessage("비행기 탑승! 활주로에서 한 번 더 누르면 이륙해요.");
      return;
    }
    if (submarine) {
      if (nearLife({ x: 10200, y: 1010 }, 220)) {
        setSubmarine(false);
        setSubmerged(false);
        setPos({ x: 10320, y: 1050 });
        setMessage("동쪽 항구에 도착했어!");
        return;
      }
      if (nearLife(COAST.harbor, 220)) {
        setSubmarine(false);
        setSubmerged(false);
        setPos({ x: COAST.harbor.x - 150, y: COAST.harbor.y + 40 });
        setMessage("항구에 돌아왔어!");
        return;
      }
      const found = OCEAN_DISCOVERIES.find((site) => nearLife(site, 190));
      if (found) {
        dispatch({ type: "explore-sea", id: found.id });
        setMessage(found.name + " 발견! 바닷속 탐험 성공!");
        return;
      }
      setSubmerged((v) => !v);
      setMessage(submerged ? "잠수함이 수면으로 올라왔어." : "잠수함이 바닷속 깊이 잠수했어!");
      return;
    }
    if (atOriginalHouse) {
      goHomeInside();
      return;
    }
    if (nearLife(COAST.truck, 275)) {
      living.setActivity(null);
      missionPlay.end();
      setTruckOpen(true);
      setMessage("손님이 주문한 메뉴를 준비하자!");
      return;
    }
    if (nearLife({ x: 10300, y: 1010 }, 250)) {
      setDriving(false);
      diveReturn.current = { driving };
      living.setActivity(null);
      missionPlay.end();
      setSeaOpen(true);
      setMessage("동쪽 항구에서 잠수함 탑승!");
      return;
    }
    if (nearLife(COAST.harbor, 290)) {
      setDriving(false);
      diveReturn.current = { driving };
      living.setActivity(null);
      missionPlay.end();
      setSeaOpen(true);
      setMessage("잠수함 탑승! 오른쪽 버튼으로 잠수하고 조이스틱으로 탐험하자.");
      return;
    }
    if (nearLife(COAST.robot, 240)) {
      setRobotFollowing((v) => !v);
      setMessage(robotFollowing ? "로봇이 여기서 쉬고 있어." : "아빠 로봇이 함께 따라다녀!");
      return;
    }
    setMessage("집·푸드트럭·항구에 가까이 가서 행동을 눌러 봐.");
  };
  const actionLifeLabel = () => {
    if (region === "mansion") {
      if (nearWorld(lifePos, LIFE_SPOTS.mansionExit, 180)) return "집 밖으로";
      if (
        state.halloween.active &&
        living.season &&
        candySpotsForHouse(state.houseTier).some(
          (c) => !state.halloween.candy.includes(c.id) && nearWorld(lifePos, c, 170),
        )
      )
        return "사탕 줍기";
      if (nearWorld(lifePos, LIFE_SPOTS.mansionKitchen, 300)) return "음식 집기";
      if (nearWorld(lifePos, LIFE_SPOTS.mansionDining, 310) && holding) return "음식 먹기";
      return "집 탐험";
    }
    if (plane === "air") return canLandPlane(pos) ? "착륙하기" : "하늘 비행 중";
    if (plane === "ground") return onRunway(pos) ? "이륙하기" : "비행기에서 내리기";
    if (nearLife(AIRPORT, 260) && !submarine) return "비행기 타기";
    if (submarine) {
      if (nearLife(COAST.harbor, 220) || nearLife({ x: 10200, y: 1010 }, 220)) return "잠수함 하차";
      if (OCEAN_DISCOVERIES.some((site) => nearLife(site, 190))) return "바다 보물 발견";
      return submerged ? "수면으로 상승" : "바닷속 잠수";
    }
    if (atOriginalHouse) return "우리 집 들어가기";
    if (nearLife(COAST.truck, 275)) return "푸드트럭 영업";
    if (nearLife(COAST.harbor, 290) || nearLife({ x: 10300, y: 1010 }, 250)) return "잠수함 타기";
    if (nearLife(COAST.robot, 240)) return "아빠 로봇 동행";
    return "주변 살펴보기";
  };
  const [garageOpen, setGarageOpen] = useState(false);
  const [decorOpen, setDecorOpen] = useState(false);
  const [carId, setCarId] = useState(loadCarId);
  useEffect(() => {
    if (ready && !state.ownedCars.includes(carId)) {
      setCarId("car-001");
      saveCarId("car-001");
    }
  }, [ready, state.ownedCars, carId]);
  const [driving, setDriving] = useState(false);
  const [diving, setDiving] = useState(false);
  const [camping, setCamping] = useState(false);
  const [facing, setFacing] = useState(1);
  const familyRoom = useFamilyRoom({
    region,
    x: region === "village" ? pos.x : lifePos.x,
    y: region === "village" ? pos.y : lifePos.y,
    facing: facing === -1 ? -1 : 1,
    outfit: state.outfit,
    moving: walking,
  });
  const consoleShown = !mini && !drawing && !mapOpen && !garageOpen && !truckOpen;
  const viewport = useRef<HTMLDivElement>(null);
  const nearby = nearestPortal(pos);
  const livingDirection = useRef<() => Point>(() => ({ x: 0, y: 0 }));
  const living = useLivingWorld({
    pos,
    lifePos,
    region,
    submarine: seaOpen,
    suspended: seaOpen || truckOpen || !!station || garageOpen || mapOpen || !!mini || drawing,
    message: setMessage,
    setPos,
    direction: livingDirection,
    vehicle: submarine ? "잠수함" : plane !== "off" ? "비행기" : driving ? "자동차" : null,
  });
  const district = [...VILLAGES].sort((a, b) => worldDistance(a, pos) - worldDistance(b, pos))[0];
  const nearDrawing = Math.hypot(pos.x - 5010, pos.y - 520) < 110;
  const missionPlay = usePlaceMission(
    pos,
    region === "village" &&
      !living.restaurant &&
      !seaOpen &&
      !truckOpen &&
      !garageOpen &&
      !mapOpen &&
      !station &&
      !mini &&
      !drawing &&
      !living.blocked,
    setMessage,
  );
  const nearbyStation: MissionKind | null =
    region === "village" && !living.restaurant && plane === "off" && !seaOpen
      ? worldDistance(pos, DELIVERY_GARAGE) < 180
        ? "delivery"
        : ((["police", "fire", "ambulance"] as const).find(
            (k) => worldDistance(pos, STATIONS[k]) < 180,
          ) ?? null)
      : null;
  const mission = missionPlay.mission;
  const interact = () => {
    if (
      !ready ||
      mini ||
      drawing ||
      garageOpen ||
      seaOpen ||
      truckOpen ||
      station ||
      living.blocked
    )
      return;
    if (mission && !mission.done && region === "village" && !living.restaurant) {
      if (driving && carById(carId).kind === (mission.kind === "delivery" ? "sport" : mission.kind))
        missionPlay.act();
      else setMessage("차고에서 이 놀이에 맞는 자동차를 타고 와 봐!");
      return;
    }
    if (nearbyStation) {
      setStation(nearbyStation);
      return;
    }
    if (living.interact()) return;
    if (region === "mansion") {
      actionLife();
      return;
    }
    if (
      plane !== "off" ||
      submarine ||
      atOriginalHouse ||
      pos.x > 5700 ||
      nearWorld(pos, AIRPORT, 260)
    ) {
      actionLife();
      return;
    }

    if (diving) {
      const shore = leaveLake(pos);
      setPos(shore);
      returnPosition = shore;
      setDiving(false);
      setMessage("물속 탐험을 마치고 안전하게 호숫가로 나왔어!");
      return;
    }
    if (isNearCamp(pos) && !driving) {
      setCamping((v) => !v);
      setMessage(
        camping ? "캠핑을 정리했어. 다음에는 어디로 갈까?" : "텐트를 치고 캠핑을 시작했어!",
      );
      return;
    }
    if (isNearLake(pos) && !driving) {
      const lakePos = enterLake(pos);
      setPos(lakePos);
      returnPosition = lakePos;
      setDiving(true);
      setMessage("잠수 시작! 조이스틱으로 호수 속을 헤엄쳐 보자.");
      return;
    }
    if (nearDrawing) {
      setDrawing(true);
      return;
    }
    if (nearby) {
      returnPosition = { ...pos };
      if ("game" in nearby) setMini(nearby.game);
      else void nav({ to: nearby.target });
    } else if (Math.hypot(pos.x - 1420, pos.y - 1030) < 100) {
      dispatch({ type: "feed-animal", id: "bori" });
      setMessage("보리: 멍멍! 같이 놀아줘서 고마워!");
    } else {
      setMessage(
        "왼쪽 조이스틱을 밀어 친구나 놀이 입구로 가 봐! 오른쪽 지도 버튼으로 마을 여행도 할 수 있어.",
      );
    }
  };
  const movement = useMovement(
    !mini &&
      !drawing &&
      !mapOpen &&
      !garageOpen &&
      !truckOpen &&
      !seaOpen &&
      !station &&
      !living.blocked,
    interact,
  );
  livingDirection.current = movement.direction;
  const direction = useRef(movement.direction);
  direction.current = movement.direction;
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (
      mini ||
      drawing ||
      mapOpen ||
      garageOpen ||
      truckOpen ||
      seaOpen ||
      station ||
      living.blocked
    ) {
      setWalking(false);
      return;
    }
    let raf = 0,
      last = 0;
    const loop = (now: number) => {
      const input = direction.current();
      const d = living.ink > 0 ? { x: input.x * 0.5, y: input.y * 0.5 } : input;
      const moving = Boolean(d.x || d.y);
      setWalking(moving);
      if (d.x) setFacing(d.x > 0 ? 1 : -1);
      const dt = last ? (now - last) / 1000 : 0;
      if (moving && region === "mansion" && !living.restaurant)
        setLifePos((p) => stepLifePlayer("mansion", p, d, dt, state.houseTier));
      if (moving && region === "village" && !living.restaurant)
        setPos((p) => {
          const next = submarine
            ? stepSubmarine(p, d, dt)
            : plane === "air"
              ? stepPlane(p, d, dt)
              : diving
                ? diveStep(p, d, dt)
                : stepPlayer(
                    p,
                    d,
                    dt,
                    driving ? 1.48 * (state.carUpgrades[carId]?.engine ? 1.15 : 1) : 1,
                  );
          returnPosition = submarine
            ? { x: COAST.harbor.x - 150, y: COAST.harbor.y + 40 }
            : plane === "air"
              ? canLandPlane(next)
                ? next
                : { ...AIRPORT }
              : next;
          return next;
        });
      setAltitude((a) => Math.max(0, Math.min(1, a + (plane === "air" ? 1 : -1) * dt * 1.4)));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [
    mini,
    drawing,
    mapOpen,
    garageOpen,
    truckOpen,
    seaOpen,
    station,
    state.carUpgrades,
    carId,
    diving,
    driving,
    region,
    submarine,
    plane,
    state.houseTier,
    living.restaurant,
    living.blocked,
    living.ink,
  ]);
  const sceneScale = living.restaurant
    ? Math.min(0.7, Math.max(0.35, size.w / 1500))
    : region === "mansion"
      ? 0.6
      : 1;
  const camera = living.restaurant
    ? {
        x: Math.max(
          0,
          Math.min(1500 - size.w / sceneScale, living.inside.x - size.w / sceneScale / 2),
        ),
        y: Math.max(
          0,
          Math.min(1100 - size.h / sceneScale, living.inside.y - size.h / sceneScale / 2),
        ),
      }
    : region === "village"
      ? cameraAt(pos, size.w, size.h)
      : {
          x: Math.max(
            0,
            Math.min(
              LIFE_MAPS[region].width - size.w / sceneScale,
              lifePos.x - size.w / sceneScale / 2,
            ),
          ),
          y: Math.max(
            0,
            Math.min(
              LIFE_MAPS[region].height - size.h / sceneScale,
              lifePos.y - size.h / sceneScale / 2,
            ),
          ),
        };
  const livingActionLabel =
    mission && !mission.done && region === "village" && !living.restaurant
      ? missionPlay.label
      : nearbyStation
        ? "놀이 시작"
        : living.label();
  return (
    <Shell
      active="home"
      title="현준이의 큰 세계 여행"
      subtitle="마을에서 바닷가, 바다와 하늘까지! 왼쪽 조이스틱을 밀어 출발해요."
    >
      <div className="adv-toolbar" hidden={seaOpen || truckOpen}>
        <span>✦ 오늘의 모험은 네 마음대로 · {state.money} 별코인</span>
        <button
          onClick={() => {
            if (living.restaurant) {
              living.leaveRestaurant();
              return;
            }
            living.setActivity(null);
            if (region !== "village") {
              backToWorld();
              return;
            }
            const coastArrival = { x: 6060, y: 1040 };
            setDiving(false);
            setSubmarine(false);
            setPlane("off");
            setAltitude(0);
            setSubmerged(false);
            setDriving(false);
            setPos(coastArrival);
            returnPosition = coastArrival;
            setMessage("바닷가 마을이야! 서쪽 길로 걸어서 마을까지 돌아갈 수 있어.");
          }}
        >
          🌊 {region === "village" ? "해변 안내" : "집 밖으로"}
        </button>
        <button onClick={() => setGarageOpen(true)} disabled={submarine || plane !== "off"}>
          🚗 자동차 {CARS.length}대
        </button>
        {region === "village" && (
          <span>🏠 우리 집 Lv.{state.houseTier}/4 · ✈️ 비행장은 바닷가 남쪽</span>
        )}
        <button onClick={() => setMapOpen((v) => !v)} aria-expanded={mapOpen}>
          지도 {mapOpen ? "접기" : "보기"}
        </button>
      </div>
      <div
        className={`adv-viewport${region === "mansion" || living.restaurant ? " adv-interior" : ""}`}
        ref={viewport}
        aria-label={
          region === "mansion"
            ? "직접 걸어 다니는 우리 집 실내"
            : "왼쪽 조이스틱으로 이동하는 서른 개 마을"
        }
        tabIndex={0}
      >
        <div
          className="adv-map"
          aria-hidden={seaOpen || truckOpen}

          style={{
            width: living.restaurant
              ? 1500
              : region === "village"
                ? MAP.width
                : LIFE_MAPS[region].width,
            height: living.restaurant
              ? 1100
              : region === "village"
                ? MAP.height
                : LIFE_MAPS[region].height,
            transform: `translate(${-camera.x * sceneScale}px,${-camera.y * sceneScale}px) scale(${sceneScale})`,
            transformOrigin: "0 0",
            visibility: seaOpen || truckOpen ? "hidden" : "visible",
          }}
        >
          {living.restaurant ? (
            <RestaurantScene
              restaurant={living.restaurant}
              player={living.inside}
              state={state}
              moving={walking}
              facing={facing}
              meal={living.meal}
              carrying={!!living.job?.carrying}
              customerIndex={living.job?.delivered ?? 0}
              seconds={living.seconds}
              onTalk={living.setTalk}
            />
          ) : region === "village" ? (
            <WorldCopies center={pos} w={size.w} h={size.h}>
              <WorldExpansion center={pos} season={living.season} />
              <LegacySection center={pos} w={size.w} h={size.h}>
                <svg
                  className="adv-terrain"
                  viewBox="0 0 10200 1800"
                  style={{ width: 10200, height: 1800 }}
                  aria-hidden="true"
                >
                  <defs>
                    <pattern id="grass" width="95" height="83" patternUnits="userSpaceOnUse">
                      <rect width="95" height="83" fill="#d7e7b9" />
                      <path
                        d="m20 30 3-6 3 6m44 37 3-5 3 5"
                        fill="none"
                        stroke="#bace9c"
                        strokeWidth="2"
                      />
                      <circle cx="75" cy="22" r="2" fill="#f9f6d9" />
                    </pattern>
                  </defs>
                  <rect width={MAP.width} height={MAP.height} fill="url(#grass)" />
                  <path
                    d="M2700 850H5600M0 850H90M3200 400V1500M4000 400V1500M5000 400V1500M3200 500H5100M3200 1350H5100"
                    stroke="#f5e7ca"
                    strokeWidth="100"
                    fill="none"
                  />
                  {VILLAGES.filter((v) => v.x > 2800 && v.y < 1800).map((v) => (
                    <g key={v.id}>
                      <ellipse
                        cx={v.x}
                        cy={v.y - 90}
                        rx="245"
                        ry="155"
                        fill={v.color}
                        opacity="0.7"
                      />
                      <text x={v.x} y={v.y - 235} textAnchor="middle" fontSize="30" fill="#40564d">
                        {v.name}
                      </text>
                      {Array.from({ length: 12 }, (_, i) => (
                        <g
                          key={i}
                          transform={`translate(${v.x - 230 + (i % 6) * 90} ${v.y - 170 + Math.floor(i / 6) * 90})`}
                        >
                          {v.id === "apple" || v.id === "pineapple" ? (
                            <>
                              <rect x="-5" y="5" width="10" height="40" rx="4" fill="#b48f69" />
                              <circle cy="-5" r="26" fill="#8cb589" />
                              <circle
                                cx="10"
                                cy="-4"
                                r="10"
                                fill={v.id === "apple" ? "#e48a7c" : "#f1cf66"}
                              />
                            </>
                          ) : (
                            <path
                              d="M0-22 18 0 0 24-18 0Z"
                              fill={
                                v.id === "diamond"
                                  ? "#89bfe2"
                                  : v.id === "emerald"
                                    ? "#58aa8d"
                                    : "#78b8c0"
                              }
                              stroke="white"
                              strokeWidth="3"
                            />
                          )}
                        </g>
                      ))}
                    </g>
                  ))}
                  <text x="5010" y="370" textAnchor="middle" fontSize="30" fill="#6c6395">
                    별자리 공방
                  </text>
                  <circle cx="5010" cy="430" r="48" fill="#b7abd8" />
                  <text x="5010" y="448" textAnchor="middle" fontSize="50" fill="#fff2c1">
                    ★
                  </text>
                  <ellipse cx="530" cy="1270" rx="350" ry="290" fill="#c5dca9" />
                  <ellipse cx="1270" cy="360" rx="400" ry="230" fill="#c7dfc2" />
                  <path
                    d="M90 850H1600V620H2550V1100H2030M2550 850H2700M1350 120V1680M480 850V540M2380 620V520M550 850V1320M1250 850V390M2225 1100V1450"
                    fill="none"
                    stroke="#ecdbb8"
                    strokeWidth="110"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M90 850H1600V620H2550V1100H2030M2550 850H2700M1350 120V1680"
                    fill="none"
                    stroke="#f5e7ca"
                    strokeWidth="78"
                    strokeLinecap="round"
                  />
                  <circle cx="1350" cy="850" r="155" fill="#f5e7ca" />
                  <circle cx="1350" cy="815" r="68" fill="#e6d6be" />
                  <circle cx="1350" cy="808" r="55" fill="#a7d6dc" />
                  <circle cx="1350" cy="802" r="33" fill="#c8edf0" />
                  <path
                    d="M1350 802v-43m-14 20q14-25 28 0"
                    fill="none"
                    stroke="#fafff4"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <rect
                    x="1740"
                    y="710"
                    width="650"
                    height="310"
                    rx="100"
                    fill="#92cdd5"
                    stroke="#bcdbb3"
                    strokeWidth="22"
                  />
                  <path
                    d="M1800 810q60-20 120 0m180 100q65-20 130 0m-340 20q45-10 90 0"
                    stroke="#d3edf0"
                    strokeWidth="5"
                    fill="none"
                  />
                  <rect x="1985" y="970" width="100" height="98" rx="8" fill="#c49d79" />
                  {[986, 1006, 1026, 1046].map((y) => (
                    <path key={y} d={`M1985 ${y}h100`} stroke="#a78165" strokeWidth="3" />
                  ))}
                  <g transform="translate(245 155)">
                    <GrowingHome tier={state.houseTier} />
                    <YardDecor items={state.yard} />
                  </g>
                  <Cottage x={2100} y={1170} color="#92b8a0" label="FARM" />
                  <g transform="translate(2260 300)">
                    <rect x="5" y="15" width="30" height="155" rx="10" fill="#f2bd70" />
                    <rect x="205" y="15" width="30" height="155" rx="10" fill="#f2bd70" />
                    <rect
                      y="0"
                      width="240"
                      height="70"
                      rx="20"
                      fill="#fdf6dc"
                      stroke="#edbf7f"
                      strokeWidth="6"
                    />
                    <text x="120" y="44" textAnchor="middle" fill="#73664e" fontSize="24">
                      PARK RUNNER
                    </text>
                    <path
                      d="M35 90h170"
                      stroke="#fffdf2"
                      strokeWidth="18"
                      strokeDasharray="18 18"
                    />
                    <path
                      d="M35 90h170"
                      stroke="#879a8c"
                      strokeWidth="18"
                      strokeDasharray="18 18"
                      strokeDashoffset="18"
                    />
                  </g>
                  {trees.map((t, i) => (
                    <g key={i} transform={`translate(${t.x} ${t.y})`}>
                      <ellipse cy="35" rx="35" ry="12" fill="#597b4120" />
                      <rect x="-7" y="0" width="14" height="40" rx="5" fill="#b79c79" />
                      <circle cy="-10" r="39" fill={i % 2 ? "#9abf8e" : "#a8c790"} />
                      <circle cx="-20" r="27" fill="#b8d29c" />
                      <circle cx="22" cy="-3" r="25" fill="#a2c189" />
                      {i % 3 === 0 && <circle cx="16" cy="-20" r="6" fill="#efd69b" />}
                    </g>
                  ))}
                  <text x="550" y="1120" textAnchor="middle" fontSize="32" fill="#688756">
                    토토의 보물 숲
                  </text>
                  <text x="1250" y="240" textAnchor="middle" fontSize="32" fill="#668a72">
                    별빛 미니 파크
                  </text>
                  <text x="2065" y="820" textAnchor="middle" fontSize="28" fill="#4f93a1">
                    반짝 호수
                  </text>
                  <g transform="translate(1110 280)">
                    <path
                      d="M0 70 25 0h80l25 70M25 0v55m80-55v55"
                      stroke="#be9b7e"
                      strokeWidth="8"
                      fill="none"
                    />
                    <path d="M30 57h28m18 0h28" stroke="#e5a995" strokeWidth="9" />
                  </g>
                  <g transform="translate(500 1180)">
                    <rect width="90" height="65" rx="12" fill="#c9a072" />
                    <path d="M0 25h90M45 0v65" stroke="#f9df9b" strokeWidth="8" />
                    <circle cx="45" cy="32" r="10" fill="#f4cf74" />
                  </g>
                  {[0, 1, 2].map((i) => (
                    <g key={i} transform={`translate(${2120 + i * 76} 1470)`}>
                      <rect width="55" height="100" rx="15" fill="#c0a17b" />
                      {[20, 50, 80].map((y) => (
                        <path
                          key={y}
                          d={`M28 ${y + 10}v-15m0 8q-20 0-15-10 15 0 15 10 0-10 15-10 5 10-15 10`}
                          stroke="#8db685"
                          strokeWidth="5"
                          fill="#a9c58e"
                        />
                      ))}
                    </g>
                  ))}
                </svg>
                <UnifiedCoast
                  seconds={living.seconds}
                  parkedPlane={plane === "off"}
                  submarine={submarine}
                  submerged={submerged}
                  discovered={state.visitedSeaTreasures}
                  robotFollowing={true}
                />

                <WorldScenes
                  player={pos}
                  call={null}
                  phase="idle"
                  progress={0}
                  thiefStep={0}
                  siren={false}
                  diving={diving}
                  camping={camping}
                />
                {PORTALS.map((g) => (
                  <div
                    className={`adv-gate ${nearby?.id === g.id ? "near" : ""}`}
                    key={g.id}
                    style={{ left: g.x, top: g.y }}
                  >
                    <span>
                      {g.id === "runner"
                        ? "달리기"
                        : g.id === "house"
                          ? "꾸미기"
                          : g.id === "farm"
                            ? "키우기"
                            : "놀기"}
                    </span>
                    <b>{g.name}</b>
                    <i />
                  </div>
                ))}
              </LegacySection>
              <WorldExpansion center={pos} season={living.season} layer="landmarks" />
              {
                <People
                  state={state}
                  scene="world"
                  hideFollowers={submarine || plane !== "off" || driving || diving}
                  player={pos}
                  seconds={living.seconds}
                  moving={walking}
                  onTalk={living.setTalk}
                  helperPosition={living.activity?.helper ?? null}
                />
              }
              <LegacySection center={pos} w={size.w} h={size.h}>
                {" "}
                <div
                  className={`adv-gate ${nearDrawing ? "near" : ""}`}
                  style={{ left: 5010, top: 520 }}
                >
                  <span>손가락 · 펜 놀이</span>
                  <b>별자리 공방</b>
                  <i />
                </div>
                <div className="adv-dog" style={{ left: 1420, top: 1030 }}>
                  <svg width="72" height="88" viewBox="0 0 110 145">
                    <ellipse cx="55" cy="105" rx="31" ry="22" fill="#d4ac86" />
                    <path
                      d="M33 115v20M76 115v20"
                      stroke="#b78c68"
                      strokeWidth="13"
                      strokeLinecap="round"
                    />
                    <path
                      d="M82 103q25-25 18-35"
                      fill="none"
                      stroke="#b78c68"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <circle cx="55" cy="58" r="33" fill="#eed0ac" />
                    <ellipse cx="27" cy="60" rx="10" ry="25" fill="#9c715a" />
                    <ellipse cx="84" cy="60" rx="10" ry="25" fill="#9c715a" />
                    <circle cx="43" cy="56" r="4" fill="#493f3b" />
                    <circle cx="67" cy="56" r="4" fill="#493f3b" />
                    <ellipse cx="55" cy="72" rx="8" ry="6" fill="#493f3b" />
                    <path d="M55 78v10" stroke="#e59b9c" strokeWidth="8" strokeLinecap="round" />
                  </svg>
                  <b>보리</b>
                </div>
              </LegacySection>
              <div
                className={`adv-player ${walking ? "walking" : ""}`}
                style={{ left: pos.x, top: pos.y }}
              >
                {plane === "air" && (
                  <div
                    className="hj-plane-shadow"
                    style={{
                      opacity: 0.35 - altitude * 0.15,
                      transform: `translateX(-50%) scale(${1 - altitude * 0.25})`,
                    }}
                  />
                )}
                <div style={{ transform: `scaleX(${facing})` }}>
                  {plane !== "off" ? (
                    <div
                      className="hj-plane-player"
                      style={{
                        transform: `translateY(${-altitude * 70}px) scale(${1 + altitude * 0.35})`,
                      }}
                    >
                      <svg
                        width="200"
                        height="120"
                        viewBox="-140 -80 280 170"
                        role="img"
                        aria-label="빨간 비행기"
                      >
                        <PlaneArt />
                      </svg>
                    </div>
                  ) : submarine ? (
                    <svg
                      className={`hj-submarine-player${walking ? " moving" : ""}`}
                      width="176"
                      height="110"
                      viewBox="0 0 176 110"
                      role="img"
                      aria-label="노란 잠수함"
                    >
                      <g className="hj-sub-wake" fill="#c3f5ff" opacity=".7">
                        <circle cx="8" cy="24" r="5" />
                        <circle cx="18" cy="9" r="3" />
                      </g>
                      <ellipse
                        cx="83"
                        cy="76"
                        rx="74"
                        ry="29"
                        fill="#ffc956"
                        stroke="#f9f1cc"
                        strokeWidth="7"
                      />
                      <path
                        d="M71 51V19H124"
                        fill="none"
                        stroke="#ffd977"
                        strokeWidth="17"
                        strokeLinecap="round"
                      />
                      <rect x="74" y="18" width="32" height="33" rx="7" fill="#ffc956" />
                      <circle
                        cx="48"
                        cy="72"
                        r="17"
                        fill="#a3e8ec"
                        stroke="white"
                        strokeWidth="4"
                      />
                      <circle
                        cx="90"
                        cy="72"
                        r="17"
                        fill="#a3e8ec"
                        stroke="white"
                        strokeWidth="4"
                      />
                      <circle
                        cx="131"
                        cy="72"
                        r="17"
                        fill="#a3e8ec"
                        stroke="white"
                        strokeWidth="4"
                      />
                      <path
                        d="M14 66L2 44V95L14 83"
                        fill="#ffdd72"
                        stroke="#f8f0d0"
                        strokeWidth="5"
                      />
                    </svg>
                  ) : diving ? (
                    <Mascot outfit={state.outfit} small moving={walking} diving />
                  ) : driving ? (
                    <CarArt car={carById(carId)} size={98} />
                  ) : (
                    <Mascot outfit={state.outfit} small moving={walking} />
                  )}
                </div>
                <b>
                  {plane !== "off"
                    ? "현준 비행기"
                    : submarine
                      ? "현준 잠수함"
                      : driving
                        ? "현준 🚗"
                        : "현준"}
                </b>
              </div>
              <WorldOverlay center={pos}>
                {missionPlay.spray && (
                  <path
                    className="kid-water-spray"
                    d={`M${pos.x} ${pos.y - 30}Q${pos.x + 80} ${pos.y - 170} ${missionPlay.spray.x} ${missionPlay.spray.y - 40}`}
                    stroke="#8ee6ff"
                    strokeWidth={mission?.special ? 24 : 16}
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
                <g transform={`translate(${DELIVERY_GARAGE.x} ${DELIVERY_GARAGE.y - 100})`}>
                  <rect
                    x="-90"
                    y="-55"
                    width="180"
                    height="62"
                    rx="20"
                    fill="#fff5d4"
                    stroke="#d5ac5f"
                    strokeWidth="4"
                  />
                  <text textAnchor="middle" y="-18" fontSize="24">
                    📦 배달 차고
                  </text>
                </g>
                {mission && !mission.done && missionPlay.target && (
                  <g transform={`translate(${missionPlay.target.x} ${missionPlay.target.y})`}>
                    <ellipse
                      rx={mission.kind === "fire" && mission.special ? 165 : 110}
                      ry="38"
                      fill="#ffe17d55"
                      stroke="#ffca50"
                      strokeWidth="5"
                      strokeDasharray="12 8"
                    />
                    <text y="-110" textAnchor="middle" fontSize="28" fill="#604c32">
                      여기로!
                    </text>
                    {mission.kind === "ambulance" || mission.kind === "police" ? (
                      <g transform="translate(-42 -110)">
                        <FriendArt
                          index={mission.kind === "police" ? 4 : 7}
                          moving={mission.kind === "police"}
                        />
                      </g>
                    ) : (
                      <text y="-45" textAnchor="middle" fontSize="60">
                        {mission.kind === "fire" ? "🔥" : "📦"}
                      </text>
                    )}
                  </g>
                )}
              </WorldOverlay>
              <ActivityTargets activity={living.activity} player={pos} />
            </WorldCopies>
          ) : (
            <>
              <LifeWorldScene
                region={region}
                player={lifePos}
                outfit={state.outfit}
                moving={walking}
                facing={facing}
                following={false}
                holding={holding}
                submarine={submarine}
                explored={state.visitedSeaTreasures}
                houseTier={state.houseTier}
                room={state.room}
                decor={state.decor}
                candy={state.halloween.candy}
                partyActive={state.halloween.active && living.season}
              />
              <svg className="home-people" width="2200" height="1500">
                <People
                  state={state}
                  scene="home"
                  player={lifePos}
                  seconds={living.seconds}
                  moving={walking}
                  onTalk={living.setTalk}
                  helperPosition={living.activity?.helper ?? null}
                  svg
                />
              </svg>
              <ActivityTargets activity={living.activity} player={lifePos} />
            </>
          )}
          {!living.restaurant && <RemotePlayers room={familyRoom} region={region} />}
        </div>
        {region === "village" &&
          !living.restaurant &&
          atOriginalHouse &&
          !seaOpen &&
          !truckOpen && (
            <button
              className="kid-home-upgrade"
              onClick={upgradeHome}
              disabled={state.houseTier >= 4}
            >
              🏡{" "}
              {state.houseTier >= 4
                ? "집 완성!"
                : `집 확장 · ${HOUSE_TIERS[state.houseTier]!.cost} 별코인`}
            </button>
          )}
        {mission &&
          !mission.done &&
          region === "village" &&
          !living.restaurant &&
          !seaOpen &&
          !truckOpen &&
          !mapOpen && (
            <div className="kid-mission-hud">
              <b>
                {MISSION_LABELS[mission.kind]} · {mission.step}/
                {mission.kind === "ambulance" && !mission.special ? 4 : 3}
              </b>
              <small>
                반짝 표시{" "}
                {Math.round(missionPlay.target ? worldDistance(pos, missionPlay.target) : 0)}m{" "}
                {mission.kind !== "police" || mission.special
                  ? missionPlay.target
                    ? routeDirection(pos, missionPlay.target)
                    : ""
                  : "큰길을 따라 단서를 찾아봐"}
              </small>
              <button onClick={missionPlay.end}>그만하기</button>
            </div>
          )}
        {region !== "village" && (
          <div className="hj-life-hud">
            <b>{LIFE_REGION_LABELS[region]}</b>
            <small>부엌에서 음식 집기 · 식탁에서 먹기</small>
            <span>💰 {state.money} 별코인</span>
            {region === "mansion" && (
              <>
                <button onClick={() => void nav({ to: "/house" })}>🪑 가구 고르기 · 배치</button>
                <button onClick={() => setDecorOpen((v) => !v)}>
                  {decorOpen ? "꾸미기 닫기" : "🎨 집 안 꾸미기"}
                </button>
              </>
            )}
            {holding && (
              <span>손에 든 음식: {FOOD_MENU.find((food) => food.id === holding)?.name}</span>
            )}
          </div>
        )}
        {region === "mansion" && decorOpen && (
          <div className="hj-decor-panel" role="group" aria-label="집 안 꾸미기">
            <header>
              <b>
                지금 서 있는 곳에 놓기 ({state.decor.length}/{DECOR_LIMIT})
              </b>
              <button onClick={() => setDecorOpen(false)} aria-label="집 꾸미기 닫기">
                닫기
              </button>
            </header>
            <div>
              {DECOR.map((d) => (
                <button
                  key={d.id}
                  disabled={!ready || state.money < d.cost || state.decor.length >= DECOR_LIMIT}
                  onClick={() => {
                    dispatch({ type: "place-decor", id: d.id, x: lifePos.x, y: lifePos.y + 40 });
                    setMessage(d.name + "을(를) 놓았어!");
                  }}
                >
                  {d.emoji} {d.name} · {d.cost}
                </button>
              ))}
            </div>
            <button
              disabled={!state.decor.length}
              onClick={() => {
                const near = state.decor
                  .map((d, i) => ({ i, dist: Math.hypot(d.x - lifePos.x, d.y - lifePos.y - 40) }))
                  .sort((a, b) => a.dist - b.dist)[0];
                if (near && near.dist < 260) dispatch({ type: "remove-decor", index: near.i });
                else setMessage("치울 장식 가까이로 가 봐!");
              }}
            >
              가까운 장식 치우기
            </button>
            <b>마당 꾸미기</b>
            <div>
              {YARD.map((y) => (
                <button
                  key={y.id}
                  aria-pressed={state.yard.includes(y.id)}
                  disabled={!ready || (!state.yard.includes(y.id) && state.money < y.cost)}
                  onClick={() => dispatch({ type: "toggle-yard", id: y.id })}
                >
                  {y.emoji} {y.name} · {state.yard.includes(y.id) ? "켜짐" : y.cost}
                </button>
              ))}
            </div>
            <button
              disabled={
                !ready ||
                !living.season ||
                state.halloween.active ||
                halloweenDecorCount(state.decor) < PARTY_DECOR_NEEDED
              }
              onClick={() => {
                dispatch({ type: "start-party" });
                setMessage("할로윈 파티 시작! 집 안 곳곳의 사탕 🍬을 모아 봐!");
                setDecorOpen(false);
              }}
            >
              {!living.season
                ? "🎃 파티는 10월에 열려요"
                : state.halloween.active
                  ? "🎃 파티 중!"
                  : halloweenDecorCount(state.decor) < PARTY_DECOR_NEEDED
                    ? `🎃 파티: 할로윈 장식 ${PARTY_DECOR_NEEDED}개 필요`
                    : "🎃 할로윈 파티 열기"}
            </button>
          </div>
        )}
        {!seaOpen && !truckOpen && <LivingPanels living={living} />}
        {living.ink > 0 && <div className="ink-cloud" aria-hidden="true" />}
        {seaOpen && (
          <DiveScene
            onClose={() => {
              setSeaOpen(false);
              setDriving(diveReturn.current.driving);
              setMessage("탐험을 마치고 출발 항구로 돌아왔어!");
            }}
          />
        )}
        {truckOpen && (
          <TruckScene
            onClose={() => {
              setTruckOpen(false);
              setMessage("해변으로 돌아왔어. 다음에 또 장사하자!");
            }}
          />
        )}
        <FamilyRoomPanel room={familyRoom} />
        <div className="adv-location">
          {living.restaurant
            ? living.restaurant.name
            : region !== "village"
              ? LIFE_REGION_LABELS[region]
              : nearDrawing
                ? "별자리 공방"
                : pos.x >= OCEAN.start - 40
                  ? "큰 바다"
                  : pos.x >= 5600
                    ? "바닷가 마을"
                    : (district?.name ?? "우리 마을")}
        </div>
        {mapOpen && region === "village" && (
          <div className="adv-globe" role="dialog" aria-label="세계 지도">
            <header>
              <b>끝이 이어지는 세계 지도</b>
              <button onClick={() => setMapOpen(false)}>닫기</button>
            </header>
            <svg viewBox="0 0 340 160" aria-hidden="true">
              <rect x="10" y="14" width="320" height="132" rx="14" fill="#d7e7b9" />
              <rect
                x={mapX(5600)}
                y="14"
                width={mapX(OCEAN.start) - mapX(5600)}
                height="132"
                fill="#f2dfa2"
              />
              <rect
                x={mapX(OCEAN.start)}
                y="14"
                width={330 - mapX(OCEAN.start)}
                height="132"
                rx="0"
                fill="#5db3d6"
              />
              <text x={mapX(5600) + 4} y="28" fontSize="9" fill="#7a6a35">
                바닷가
              </text>
              <text x={mapX(OCEAN.start) + 8} y="28" fontSize="9" fill="#fff">
                큰 바다
              </text>
              <rect
                x={mapX(RUNWAY.x1)}
                y={mapY(RUNWAY.y) - 2}
                width={mapX(RUNWAY.x2) - mapX(RUNWAY.x1)}
                height="4"
                fill="#6b6f7a"
              />
              <text x={mapX(AIRPORT.x)} y={mapY(RUNWAY.y) - 5} fontSize="9" textAnchor="middle">
                ✈️
              </text>
              <text
                x={mapX(COAST.harbor.x)}
                y={mapY(COAST.harbor.y)}
                fontSize="10"
                textAnchor="middle"
              >
                ⚓
              </text>
              <text
                x={mapX(COAST.truck.x)}
                y={mapY(COAST.truck.y)}
                fontSize="10"
                textAnchor="middle"
              >
                🚚
              </text>
              {VILLAGES.map((v, i) => (
                <g key={v.id}>
                  <circle
                    cx={mapX(v.x)}
                    cy={mapY(v.y)}
                    r="7"
                    fill={v.color}
                    stroke="#fff"
                    strokeWidth="1"
                  />
                  <text x={mapX(v.x)} y={mapY(v.y) + 3} textAnchor="middle" fontSize="8">
                    {i + 1}
                  </text>
                </g>
              ))}
              <circle
                cx={mapX(pos.x)}
                cy={mapY(pos.y)}
                r="5"
                fill="#cb5e64"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
            <small>
              마을을 누르면 바로 여행! 세계의 동서·남북 끝이 이어져요. 30개 마을을 탐험해 봐!
            </small>
            <div className="adv-destinations">
              {VILLAGES.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => {
                    const next = { x: v.x, y: v.y + 65 };
                    setDiving(false);
                    setPos(next);
                    returnPosition = next;
                    setMapOpen(false);
                    setMessage(`${v.name}에 도착했어! ${v.friend}에게 인사해 봐.`);
                  }}
                >
                  {i + 1}. {v.name}
                </button>
              ))}
            </div>
            <button
              className="adv-workshop"
              onClick={() => {
                setPos({ x: 5010, y: 550 });
                returnPosition = { x: 5010, y: 550 };
                setMapOpen(false);
                setDrawing(true);
              }}
            >
              ★ 별자리 공방에서 놀기
            </button>
          </div>
        )}
        {!mini && !drawing && !mapOpen && !garageOpen && !truckOpen && !seaOpen && !station && (
          <div className="adv-bottom adv-console">
            <p className="adv-touch-hint">{message}</p>
            <Joystick onMove={movement.setStick} />
            {region === "village" && !living.restaurant && plane === "off" && !submarine && (
              <button
                className="hj-car-mode"
                onClick={() => {
                  if (driving) {
                    setDriving(false);
                  } else setGarageOpen(true);
                }}
              >
                {driving ? "차에서 내리기" : "자동차 타기"}
              </button>
            )}
            <div className="adv-action-buttons">
              <button
                className="adv-map-button"
                onClick={() =>
                  living.restaurant
                    ? living.leaveRestaurant()
                    : region === "village"
                      ? setMapOpen(true)
                      : region === "coast"
                        ? goHomeInside()
                        : backToWorld()
                }
              >
                {living.restaurant
                  ? "식당 밖으로"
                  : region === "village"
                    ? "지도"
                    : region === "coast"
                      ? "큰 집"
                      : "집 밖으로"}
              </button>
              <button className="adv-interact" onClick={interact} disabled={!ready}>
                {livingActionLabel ??
                  (region === "mansion" ||
                  plane !== "off" ||
                  submarine ||
                  atOriginalHouse ||
                  pos.x > 5700 ||
                  nearWorld(pos, AIRPORT, 260)
                    ? actionLifeLabel()
                    : diving
                      ? "물 밖으로 나오기"
                      : isNearCamp(pos) && !driving
                        ? "캠핑하기"
                        : isNearLake(pos) && !driving
                          ? "잠수하기"
                          : nearDrawing
                            ? "별자리 그리기"
                            : nearby
                              ? `${nearby.name} · 시작`
                              : Math.hypot(pos.x - 1420, pos.y - 1030) < 100
                                ? "보리 돌보기"
                                : "놀이 · 대화")}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="adv-footer">
        <p role="status" className={consoleShown ? "adv-sr" : undefined}>
          {message}
        </p>
        <span>왼쪽 조이스틱으로 이동 · 오른쪽 버튼으로 놀이와 대화</span>
      </div>
      {station && (
        <div className="hj-garage-backdrop">
          <section
            className="kid-station"
            role="dialog"
            aria-modal="true"
            aria-label="장소 놀이 선택"
          >
            <h2>
              {station === "delivery"
                ? "📦 배달 차고"
                : STATIONS[station].badge + " " + STATIONS[station].label}
            </h2>
            <p>{MISSION_LABELS[station]}</p>
            <p>표시를 찾아 이동하며 도와줘! 시간은 충분해.</p>
            <button
              onClick={() => {
                const car = missionPlay.start(station);
                if (!car) return;
                living.setActivity(null);
                setCarId(car.id);
                saveCarId(car.id);
                setDriving(true);
                setStation(null);
              }}
              disabled={
                !state.ownedCars.includes(
                  CARS.find((c) => c.kind === (station === "delivery" ? "sport" : station))!.id,
                )
              }
            >
              🚗 출발!
            </button>
            {!state.ownedCars.includes(
              CARS.find((c) => c.kind === (station === "delivery" ? "sport" : station))!.id,
            ) && <p>차고에서 전용 차를 구입하면 열려요.</p>}
            <button
              onClick={() => {
                setStation(null);
                setGarageOpen(true);
              }}
            >
              자동차 차고
            </button>
            <button onClick={() => setStation(null)}>돌아가기</button>
          </section>
        </div>
      )}
      {garageOpen && (
        <Garage
          selected={carId}
          onSelect={(id) => {
            setCarId(id);
            saveCarId(id);
            setDriving(true);
          }}
          onClose={() => setGarageOpen(false)}
        />
      )}
      {drawing && (
        <Constellation
          onClose={() => {
            setDrawing(false);
            setMessage("별자리가 반짝반짝! 다음 마을로 떠나 볼까?");
            viewport.current?.focus();
          }}
        />
      )}
      {mini && (
        <MiniGame
          kind={mini}
          onClose={() => {
            setMini(null);
            setMessage("잘 놀았어! 이번에는 다른 곳도 가볼까?");
            viewport.current?.focus();
          }}
        />
      )}
    </Shell>
  );
}
