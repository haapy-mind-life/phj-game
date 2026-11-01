import { BuildingScene } from "./BuildingScene";
import { buildingRegion } from "@/game/family-room";
import { worldRectVisible } from "@/game/world-space";
import { VillageTerrain } from "./VillageTerrain";
import { usePlayerIdentity } from "./useFamilyAccount";
import { DiveScene } from "./DiveScene";
import { TruckScene } from "./TruckScene";
import { usePlaceMission } from "./usePlaceMission";
import { DELIVERY_GARAGE, MISSION_LABELS, type MissionKind } from "@/game/place-play";
import { WorldExpansion, WorldCopies, LegacySection, WorldOverlay } from "./WorldExpansion";
import { People } from "./People";
import { RobotWorld } from "./RobotWorld";
import { RobotWatch } from "./RobotWatch";
import { ROBOTS } from "@/game/robot-catalog";
import { RobotSpeciesArt } from "./RobotSpeciesArt";
import { useRobotWorld } from "./useRobotWorld";
import { RestaurantScene } from "./RestaurantScene";
import { useLivingWorld } from "./useLivingWorld";
import { LivingPanels, ActivityTargets } from "./LivingPanels";
import { worldDistance, isOcean } from "@/game/world-space";
import { RESTAURANT_ROOM } from "@/game/world-content";
import { RobotArt } from "./RobotArt";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONSTRUCTION,
  homeLot,
  islandAt,
  nearKidSpot,
  LANDMARKS,
  type KidSpot,
} from "@/game/kid-world";
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
import { FamilyRoomPanel, RemoteInteriorPlayers, RemotePlayers } from "./FamilyRoom";
import { restaurantRegion, type FamilyRegion } from "@/game/family-room";
import { useFamilyRoom } from "./useFamilyRoom";
import { UnifiedCoast, PlaneArt } from "./UnifiedCoast";
import {
  COAST,
  OCEAN,
  HOUSE_TIERS,
  OCEAN_DISCOVERIES,
  AIRPORT,
  RUNWAY,
  canLandPlane,
  canPlaneDive,
  canTakeOff,
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
const mapX = (x: number) => 10 + (x / MAP.width) * 320;
const mapY = (y: number) => 14 + (y / MAP.height) * 132;
export function Village() {
  const identity = usePlayerIdentity();
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
  const [message, setMessage] = useState("오늘은 어디로 가볼까? 길을 따라 걸어가 봐!");
  const [walking, setWalking] = useState(false);
  const [region, setRegion] = useState<LifeRegion>("village");
  const [lifePos, setLifePos] = useState<Point>({ ...LIFE_SPOTS.mansionInside });
  const [holding, setHolding] = useState<FoodId | null>(null);
  const [robotFollowing, setRobotFollowing] = useState(false);
  const [submarine, setSubmarine] = useState(false);
  const [plane, setPlane] = useState<"off" | "ground" | "air">("off");
  // The plane may also fly under open sea water; it pops back up when the sea ends.
  const [planeUnder, setPlaneUnder] = useState(false);
  // A plane left on an island stays there so the player can fly back.
  const [planeSpot, setPlaneSpot] = useState<Point | null>(null);
  const [buildFloors, setBuildFloors] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [submerged, setSubmerged] = useState(false);
  const [truckOpen, setTruckOpen] = useState(false);
  const nearLife = (point: Point, range = 180) => nearWorld(pos, point, range);
  const home = homeLot(state.homeLot);
  const atHome = nearWorld(pos, home, 185);
  const goHomeInside = () => {
    setRegion("mansion");
    setDiving(false);
    setLifePos({ x: 650, y: 650 });
    setDriving(false);
    setSubmarine(false);
    setPlane("off");
    setPlaneUnder(false);
    setAltitude(0);
    setMessage("우리 집 안으로 들어왔어! 부엌에서 음식을 집고 식탁에서 먹어 봐.");
  };
  const backToWorld = () => {
    setRegion("village");
    setPos({ x: home.x, y: home.y + 45 });
    returnPosition = { x: home.x, y: home.y + 45 };
    setMessage("내가 키운 집 앞으로 돌아왔어!");
  };
  const upgradeHome = () => {
    const next = HOUSE_TIERS[state.houseTier];
    if (!next) {
      setMessage("우리 집이 엄청 넓은 궁전으로 완성됐어!");
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
      if (nearWorld(lifePos, { x: 2525, y: 450 }, 260) && state.houseTier >= 5) {
        setMessage("첨벙! 궁전 수영장에서 신나게 수영했어! 🏊");
        return;
      }
      if (nearWorld(lifePos, { x: 2525, y: 1030 }, 260) && state.houseTier >= 5) {
        setMessage("슝~ 궁전 미끄럼틀 최고! 🛝");
        return;
      }
      setMessage("침대에서 쉬거나 부엌과 식탁을 찾아가 봐!");
      return;
    }
    if (plane !== "off") {
      if (plane === "air") {
        if (canPlaneDive(pos)) {
          setPlaneUnder(!planeUnder);
          setMessage(
            planeUnder
              ? "하늘로 슝! 다시 바다 위를 날고 있어."
              : "바닷속으로 슝! 물고기 사이를 날아 봐. 바다가 끝나도 쭉 갈 수 있어!",
          );
          return;
        }
        if (!canLandPlane(pos)) {
          setMessage("여기는 착륙할 수 없어! 땅이나 활주로, 섬을 찾아 봐.");
          return;
        }
        setPlane("ground");
        const island = islandAt(pos);
        setMessage(
          onRunway(pos)
            ? "활주로에 사뿐히 착륙!"
            : island
              ? island.name + "에 착륙했어! 내리기를 누르고 섬을 구경해 봐."
              : "땅에 착륙했어! 비행기에서 내릴 수 있어.",
        );
        return;
      }
      if (canTakeOff(pos)) {
        setPlane("air");
        setMessage(
          onRunway(pos)
            ? "이륙! 바다 위를 날다가 바닷속으로도 들어가 봐. 섬과 나라도 찾아 봐!"
            : "섬에서 이륙! 쭉 날아가 보자.",
        );
        return;
      }
      leavePlane();
      return;
    }
    if (planeSpot && nearLife(planeSpot, 220) && !submarine) {
      setDriving(false);
      setPlane("ground");
      setPos({ ...planeSpot });
      setPlaneSpot(null);
      setMessage("비행기 탑승! 한 번 더 누르면 섬에서 이륙해요.");
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
    if (atHome) {
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
    const island = islandAt(pos);
    if (island) {
      setMessage(island.emoji + " " + island.name + "에 왔어! 섬 구경 신난다!");
      return;
    }
    setMessage("집·푸드트럭·항구에 가까이 가서 행동을 눌러 봐.");
  };
  const leavePlane = () => {
    setPlane("off");
    setPlaneUnder(false);
    setAltitude(0);
    const island = islandAt(pos);
    if (island) {
      setPlaneSpot({ ...pos });
      setMessage(island.name + "에 내렸어! 비행기 옆에서 다시 탈 수 있어.");
    } else {
      setPlaneSpot(null);
      setMessage("비행기에서 내렸어. 활주로에서 다시 탈 수 있어.");
    }
  };
  const actKid = (spot: KidSpot) => {
    if (spot.kind === "landmark") return;
    if (spot.kind === "construction") {
      const next = buildFloors >= CONSTRUCTION.floors ? 0 : buildFloors + 1;
      setBuildFloors(next);
      setMessage(
        next === 0
          ? "🚧 새 빌딩 공사 시작! 다시 벽돌을 쌓아 보자."
          : next >= CONSTRUCTION.floors
            ? "🎉 빌딩 완성! 내가 지은 빌딩이야!"
            : "🧱 쿵쿵! " + next + "층까지 올렸어!",
      );
      return;
    }
    dispatch({ type: "move-house", lot: spot.lot.id });
    setMessage(
      "🚚 이사 완료! " +
        spot.lot.name +
        "에 우리 집이 생겼어. 문 앞에서 행동을 누르면 들어갈 수 있어.",
    );
  };
  const kidSpotLabel = (spot: KidSpot) =>
    spot.kind === "landmark"
      ? spot.landmark.name + " 들어가기"
      : spot.kind === "construction"
        ? buildFloors >= CONSTRUCTION.floors
          ? "새 공사 시작"
          : "공사 돕기 · 벽돌 쌓기"
        : "여기로 이사하기";
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
      if (state.houseTier >= 5 && nearWorld(lifePos, { x: 2525, y: 450 }, 260)) return "수영하기";
      if (state.houseTier >= 5 && nearWorld(lifePos, { x: 2525, y: 1030 }, 260))
        return "미끄럼틀 타기";
      return "집 탐험";
    }
    if (plane === "air")
      return canPlaneDive(pos)
        ? planeUnder
          ? "하늘로 슝"
          : "바닷속으로 슝"
        : canLandPlane(pos)
          ? "착륙하기"
          : "하늘 비행 중";
    if (plane === "ground") return canTakeOff(pos) ? "이륙하기" : "비행기에서 내리기";
    if (planeSpot && nearLife(planeSpot, 220) && !submarine) return "비행기 타기";
    if (nearLife(AIRPORT, 260) && !submarine) return "비행기 타기";
    if (submarine) {
      if (nearLife(COAST.harbor, 220) || nearLife({ x: 10200, y: 1010 }, 220)) return "잠수함 하차";
      if (OCEAN_DISCOVERIES.some((site) => nearLife(site, 190))) return "바다 보물 발견";
      return submerged ? "수면으로 상승" : "바닷속 잠수";
    }
    if (atHome) return "우리 집 들어가기";
    if (nearLife(COAST.truck, 275)) return "푸드트럭 영업";
    if (nearLife(COAST.harbor, 290) || nearLife({ x: 10300, y: 1010 }, 250)) return "잠수함 타기";
    if (nearLife(COAST.robot, 240)) return "아빠 로봇 동행";
    if (islandAt(pos)) return "섬 구경";
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
  const consoleShown = !mini && !drawing && !mapOpen && !garageOpen && !truckOpen && !station;
  const viewport = useRef<HTMLDivElement>(null);
  const portal = nearestPortal(pos);
  // After moving house, the old lot is an empty lot rather than the decorating entrance.
  const nearby = portal?.id === "house" && state.homeLot !== "original" ? null : portal;
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
  const robot = useRobotWorld({
    pos,
    seconds: living.seconds,
    allowed:
      region === "village" &&
      !living.interior &&
      plane === "off" &&
      !submarine &&
      !driving &&
      !diving,
    state,
    dispatch,
    message: setMessage,
  });
  const robotSpeed = robot.riding ? 1.25 : 1;
  const nearDrawing = Math.hypot(pos.x - 5010, pos.y - 520) < 110;
  // Each interior has its own family region; outdoor anchors stay fixed while inside.
  const familyRegion: FamilyRegion = living.building
    ? buildingRegion(living.building.id)
    : living.restaurant
      ? restaurantRegion(living.restaurant.id)
      : region === "mansion"
        ? "mansion"
        : "village";
  const familyPoint = living.interior ? living.inside : region === "mansion" ? lifePos : pos;
  const familyRoom = useFamilyRoom({
    region: familyRegion,
    x: familyPoint.x,
    y: familyPoint.y,
    facing: facing === -1 ? -1 : 1,
    outfit: state.outfit,
    moving: walking,
    active:
      (familyRegion !== "village" || (plane === "off" && !submarine)) &&
      !seaOpen &&
      !truckOpen &&
      !mini &&
      !drawing,
  });
  const missionPlay = usePlaceMission(
    pos,
    region === "village" &&
      !living.interior &&
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
    region === "village" && !living.interior && plane === "off" && !seaOpen
      ? worldDistance(pos, DELIVERY_GARAGE) < 180
        ? "delivery"
        : ((["police", "fire", "ambulance"] as const).find(
            (k) => worldDistance(pos, STATIONS[k]) < 180,
          ) ?? null)
      : null;
  const mission = missionPlay.mission;
  const kidSpot =
    region === "village" && !living.interior && plane === "off" && !submarine && !seaOpen
      ? nearKidSpot(pos, state.homeLot)
      : null;
  const kidView = useMemo(
    () => ({
      homeLot: state.homeLot,
      houseTier: state.houseTier,
      yard: state.yard,
      floors: buildFloors,
    }),
    [state.homeLot, state.houseTier, state.yard, buildFloors],
  );
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
    if (mission && !mission.done && region === "village" && !living.interior) {
      if (driving && carById(carId).kind === (mission.kind === "delivery" ? "sport" : mission.kind))
        missionPlay.act();
      else setMessage("차고에서 이 놀이에 맞는 자동차를 타고 와 봐!");
      return;
    }
    if (nearbyStation) {
      setStation(nearbyStation);
      return;
    }
    if (kidSpot && kidSpot.kind !== "landmark") {
      actKid(kidSpot);
      return;
    }
    if (robot.act()) return;
    if (living.interact()) return;
    if (region === "mansion") {
      actionLife();
      return;
    }
    if (plane !== "off" || submarine || atHome || pos.x > 5700 || nearWorld(pos, AIRPORT, 260)) {
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
      !living.blocked &&
      !robot.watchOpen,
    interact,
  );
  livingDirection.current = movement.direction;
  const direction = useRef(movement.direction);
  direction.current = movement.direction;
  useEffect(() => {
    if (!planeUnder || (plane === "air" && canPlaneDive(pos))) return;
    setPlaneUnder(false);
    if (plane === "air") setMessage("바다가 끝났어! 비행기가 물 밖으로 나와서 쭉 날아가.");
  }, [pos, plane, planeUnder]);
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
      if (moving && region === "mansion" && !living.interior)
        setLifePos((p) => stepLifePlayer("mansion", p, d, dt, state.houseTier));
      if (moving && region === "village" && !living.interior)
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
                    driving ? 1.48 * (state.carUpgrades[carId]?.engine ? 1.15 : 1) : robotSpeed,
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
    living.interior,
    living.blocked,
    living.ink,
    robotSpeed,
  ]);
  const sceneScale = living.interior
    ? Math.min(0.7, Math.max(0.35, size.w / 1500))
    : region === "mansion"
      ? 0.6
      : 1;
  const camera = living.interior
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
  const travelTo = (arrival: Point, words: string) => {
    robot.dismount();
    if (living.building) living.leaveBuilding();
    if (living.restaurant) living.leaveRestaurant();
    setRegion("village");
    setDiving(false);
    setSubmarine(false);
    setPlane("off");
    setPlaneUnder(false);
    setAltitude(0);
    setSubmerged(false);
    setDriving(false);
    setPos(arrival);
    returnPosition = arrival;
    setMapOpen(false);
    setMessage(words);
  };
  const robotWatchAllowed =
    region === "village" &&
    !living.interior &&
    !seaOpen &&
    !truckOpen &&
    !mini &&
    !drawing &&
    !station &&
    !garageOpen &&
    !mapOpen &&
    plane === "off" &&
    !submarine &&
    !driving &&
    !diving;
  const livingActionLabel =
    mission && !mission.done && region === "village" && !living.interior
      ? missionPlay.label
      : nearbyStation
        ? "놀이 시작"
        : kidSpot && kidSpot.kind !== "landmark"
          ? kidSpotLabel(kidSpot)
          : (robot.label() ?? living.label());
  return (
    <Shell
      active="home"
      title={`${identity.name}의 큰 세계 여행`}
      subtitle="마을에서 바닷가, 바다와 하늘까지! 왼쪽 조이스틱을 밀어 출발해요."
    >
      <div className="adv-toolbar" hidden={seaOpen || truckOpen}>
        <span>✦ 오늘의 모험은 네 마음대로 · {state.money} 별코인</span>
        <button onClick={() => setGarageOpen(true)} disabled={submarine || plane !== "off"}>
          🚗 자동차 {CARS.length}대
        </button>
        {region === "village" && (
          <span>
            🏠 우리 집 Lv.{state.houseTier}/{HOUSE_TIERS.length} · ✈️ 비행장은 바닷가 남쪽
          </span>
        )}
        <button onClick={() => setMapOpen((v) => !v)} aria-expanded={mapOpen}>
          지도 {mapOpen ? "접기" : "보기"}
        </button>
      </div>
      <div
        className={`adv-viewport${region === "mansion" || living.interior ? " adv-interior" : ""}`}
        ref={viewport}
        aria-label={
          living.building
            ? `직접 걸어 다니는 ${living.building.name} 실내`
            : region === "mansion"
              ? "직접 걸어 다니는 우리 집 실내"
              : "왼쪽 조이스틱으로 이동하는 서른 개 마을"
        }
        tabIndex={0}
      >
        {plane === "air" && planeUnder && (
          <div className="hj-under-sea" aria-hidden="true">
            <span>🐠</span>
            <span>🫧</span>
            <span>🐟</span>
            <span>🫧</span>
            <span>🐙</span>
          </div>
        )}
        <div
          className="adv-map"
          aria-hidden={seaOpen || truckOpen}

          style={{
            width: living.interior
              ? 1500
              : region === "village"
                ? MAP.width
                : LIFE_MAPS[region].width,
            height: living.interior
              ? 1100
              : region === "village"
                ? MAP.height
                : LIFE_MAPS[region].height,
            transform: `translate(${-camera.x * sceneScale}px,${-camera.y * sceneScale}px) scale(${sceneScale})`,
            transformOrigin: "0 0",
            visibility: seaOpen || truckOpen ? "hidden" : "visible",
          }}
        >
          {living.building ? (
            <>
              <BuildingScene
                building={living.building}
                onTalk={living.setTalk}
                player={living.inside}
                state={state}
                moving={walking}
                facing={facing}
              />
              <RemoteInteriorPlayers
                room={familyRoom}
                region={familyRegion}
                width={1500}
                height={1100}
              />
            </>
          ) : living.restaurant ? (
            <>
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
              <RemoteInteriorPlayers
                room={familyRoom}
                region={familyRegion}
                width={RESTAURANT_ROOM.width}
                height={RESTAURANT_ROOM.height}
              />
            </>
          ) : region === "village" ? (
            <WorldCopies center={pos} w={size.w} h={size.h}>
              <WorldExpansion center={pos} season={living.season} />
              <LegacySection center={pos} w={size.w} h={size.h}>
                <VillageTerrain
                  houseTier={state.houseTier}
                  yard={state.yard}
                  homeLot={state.homeLot}
                />
                {worldRectVisible(pos, size.w, size.h, {
                  x: 5500,
                  y: -250,
                  width: 5000,
                  height: 2300,
                }) && (
                  <UnifiedCoast
                    seconds={living.seconds}
                    parkedPlane={plane === "off"}
                    submarine={submarine}
                    submerged={submerged}
                    discovered={state.visitedSeaTreasures}
                    robotFollowing={true}
                  />
                )}

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
                {PORTALS.filter((g) => g.id !== "house" || state.homeLot === "original").map(
                  (g) => (
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
                  ),
                )}
              </LegacySection>
              <WorldExpansion center={pos} season={living.season} layer="landmarks" kid={kidView} />
              {planeSpot && plane === "off" && (
                <div className="hj-parked-plane" style={{ left: planeSpot.x, top: planeSpot.y }}>
                  <svg
                    width="200"
                    height="120"
                    viewBox="-140 -80 280 170"
                    aria-label="섬에 세운 비행기"
                  >
                    <PlaneArt />
                  </svg>
                </div>
              )}
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
              {region === "village" && !living.interior && (
                <>
                  <RobotWorld player={pos} roaming={robot.roaming} nearTarget={robot.nearTarget} />
                  {robot.summoned && !robot.riding && (
                    <div
                      className="hj-watch-helper"
                      data-watch-helper
                      style={{ left: pos.x + 85, top: pos.y + 30 }}
                    >
                      <div className="hj-watch-fused-actors">
                        {(robot.fusionActive.length > 1
                          ? robot.fusionActive
                          : [robot.summoned.id]
                        ).map((id) => (
                          <RobotSpeciesArt
                            key={id}
                            robot={
                              robot.fusionActive.length > 1
                                ? ROBOTS.find((r) => r.id === id)!
                                : robot.summoned!
                            }
                            size={robot.fusionActive.length > 1 ? 54 : 70}
                            moving={walking}
                            label={`소환된 ${id}`}
                          />
                        ))}
                      </div>
                      <b>
                        {robot.fusionActive.length > 1
                          ? `${robot.fusionActive.length}단 합체`
                          : robot.summoned.name}
                      </b>
                    </div>
                  )}
                  {robot.mission && (
                    <div
                      className="hj-watch-enemy"
                      data-watch-mission
                      style={{ left: robot.mission.target.x, top: robot.mission.target.y }}
                    >
                      {robot.mission.mode === "rescue" ? (
                        <FriendArt index={3} moving />
                      ) : (
                        <RobotSpeciesArt
                          robot={ROBOTS[3]}
                          moving
                          size={84}
                          label={robot.mission.mode === "thief" ? "도둑 로봇" : "악당 로봇"}
                        />
                      )}
                      <strong>
                        {robot.mission.mode === "rescue"
                          ? "친구를 도와줘!"
                          : robot.mission.mode === "thief"
                            ? "도둑 로봇"
                            : "악당 로봇"}
                      </strong>
                      <small>남은 단계 {robot.mission.hp}</small>
                    </div>
                  )}
                </>
              )}
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
                {plane === "air" && !planeUnder && (
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
                      className={`hj-plane-player${planeUnder ? " under" : ""}`}
                      style={{
                        transform: planeUnder
                          ? "translateY(10px) scale(1.15)"
                          : `translateY(${-altitude * 70}px) scale(${1 + altitude * 0.35})`,
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
                    <Mascot
                      identity={identity.id}
                      outfit={state.outfit}
                      small
                      moving={walking}
                      diving
                    />
                  ) : robot.riding ? (
                    <RobotSpeciesArt
                      robot={robot.riding}
                      moving={walking}
                      size={92}
                      label={`${identity.name}가 탄 ${robot.riding.name}`}
                    />
                  ) : driving ? (
                    <CarArt car={carById(carId)} size={98} />
                  ) : (
                    <Mascot identity={identity.id} outfit={state.outfit} small moving={walking} />
                  )}
                </div>
                <b>
                  {plane !== "off"
                    ? `${identity.name} 비행기${planeUnder ? " 🫧" : ""}`
                    : submarine
                      ? `${identity.name} 잠수함`
                      : driving
                        ? `${identity.name} 🚗`
                        : robot.riding
                          ? `${identity.name} 🤖`
                          : identity.name}
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
              {region === "village" && !seaOpen && !truckOpen && (
                <RemotePlayers room={familyRoom} region="village" player={pos} />
              )}
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
                renderPeople={(front) => (
                  <People
                    state={state}
                    scene="home"
                    player={lifePos}
                    seconds={living.seconds}
                    moving={walking}
                    onTalk={living.setTalk}
                    helperPosition={living.activity?.helper ?? null}
                    playerLayer={front ? "front" : "back"}
                    svg
                  />
                )}
                partyActive={state.halloween.active && living.season}
              />
              <ActivityTargets activity={living.activity} player={lifePos} />
              {region === "mansion" && (
                <RemoteInteriorPlayers
                  room={familyRoom}
                  region="mansion"
                  width={LIFE_MAPS.mansion.width}
                  height={LIFE_MAPS.mansion.height}
                />
              )}
            </>
          )}
        </div>
        {region === "village" && !living.interior && atHome && !seaOpen && !truckOpen && (
          <button
            className="kid-home-upgrade"
            onClick={upgradeHome}
            disabled={state.houseTier >= HOUSE_TIERS.length}
          >
            🏡{" "}
            {state.houseTier >= HOUSE_TIERS.length
              ? "집 완성!"
              : `집 확장 · ${HOUSE_TIERS[state.houseTier]!.cost} 별코인`}
          </button>
        )}
        {mission &&
          !mission.done &&
          region === "village" &&
          !living.interior &&
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
          <details className="hj-life-hud">
            <summary>🏠 집 메뉴 · Lv.{state.houseTier}</summary>
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
          </details>
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
              <button
                onClick={() => {
                  travelTo(
                    { x: 6060, y: 1040 },
                    "바닷가에 도착했어! 손님과 인사하고 항구도 구경해 봐.",
                  );
                }}
              >
                🌊 바닷가 · 푸드트럭
              </button>
              {[
                { label: "✈️ 비행장 · 섬 여행", x: AIRPORT.x, y: AIRPORT.y - 120 },
                ...LANDMARKS.map((l) => ({ label: l.emoji + " " + l.name, x: l.x, y: l.y + 90 })),
                { label: "🚧 공사장", x: CONSTRUCTION.x, y: CONSTRUCTION.y + 90 },
                { label: "🍔 맥도날드 시티점", x: 4700, y: 2470 },
                { label: "🍔 맥도날드 바닷가점", x: 13200, y: 1820 },
                ...(state.homeLot !== "original"
                  ? [{ label: "🏠 이사 간 우리 집", x: home.x, y: home.y + 60 }]
                  : []),
              ].map((d) => (
                <button
                  key={d.label}
                  onClick={() => {
                    travelTo({ x: d.x, y: d.y }, d.label + "에 도착했어!");
                  }}
                >
                  {d.label}
                </button>
              ))}
              {VILLAGES.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => {
                    travelTo(
                      { x: v.x, y: v.y + 65 },
                      `${v.name}에 도착했어! ${v.friend}에게 인사해 봐.`,
                    );
                  }}
                >
                  {i + 1}. {v.name}
                </button>
              ))}
            </div>
            <button
              className="adv-workshop"
              onClick={() => {
                travelTo({ x: 5010, y: 550 }, "별자리 공방에 도착했어!");
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
            {robot.riding && (
              <p className="hj-robot-card" data-robot-card>
                🃏 {robot.riding.name} 카드 {robot.uses}/7
              </p>
            )}
            <Joystick onMove={movement.setStick} />
            <div className="adv-action-buttons">
              {robotWatchAllowed && (
                <button
                  className="hj-watch-open"
                  data-watch-open
                  onClick={() => robot.setWatchOpen(true)}
                >
                  ⌚ 로봇 시계
                </button>
              )}
              {robotWatchAllowed && robot.activeRobot && (
                <>
                  <button className="hj-watch-skill" onClick={() => robot.useCard()}>
                    카드 기술 {robot.uses}/7
                  </button>
                  <button
                    className="hj-watch-skill"
                    onClick={() => robot.attack()}
                    disabled={!robot.mission}
                  >
                    무기 · 돕기
                  </button>
                </>
              )}
              {plane === "ground" && (
                <button className="hj-car-mode" onClick={leavePlane}>
                  내리기
                </button>
              )}
              {robot.riding ? (
                <button className="hj-car-mode" onClick={robot.dismount}>
                  내리기
                </button>
              ) : (
                region === "village" &&
                !living.interior &&
                plane === "off" &&
                !submarine && (
                  <button
                    className="hj-car-mode"
                    onClick={() => {
                      if (driving) {
                        setDriving(false);
                      } else setGarageOpen(true);
                    }}
                  >
                    {driving ? "내리기" : "차 타기"}
                  </button>
                )
              )}

              <button
                className="adv-map-button"
                onClick={() =>
                  living.building
                    ? living.leaveBuilding()
                    : living.restaurant
                      ? living.leaveRestaurant()
                      : region === "village"
                        ? setMapOpen(true)
                        : region === "coast"
                          ? goHomeInside()
                          : backToWorld()
                }
              >
                {living.building
                  ? "건물 밖으로"
                  : living.restaurant
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
                  atHome ||
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
      {robot.watchOpen && robotWatchAllowed && (
        <RobotWatch
          progress={state.robots}
          selected={robot.selected}
          onSelect={robot.setSelected}
          fusionIds={robot.fusionIds}
          onToggleFusion={robot.toggleFusionMember}
          onFuse={robot.fuse}
          activeId={robot.activeRobot?.id ?? null}
          onSummon={robot.summon}
          onUpgrade={robot.upgrade}
          onMission={robot.startMission}
          onClose={() => robot.setWatchOpen(false)}
        />
      )}
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
