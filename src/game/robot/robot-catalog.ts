import type { Point } from "../world/adventure.ts";

// Robots from Hyunjun's robot fusion request (docs/robot-fusion/2026-10-31-v1.0) and the
// 2026-11-01 robot watch update (docs/robot-fusion/2026-11-01-watch-integration).
// `workName` keeps the name Hyunjun gave; screens show the descriptive `name` until the
// display names are checked (02_REVIEW_AND_SUPPLEMENT.md R4).
export type RobotFamily = "police" | "fire" | "sky";
export type RobotSpeciesId =
  | "rb-police"
  | "rb-fire"
  | "rb-sky"
  | "rb-thunder-police"
  | "rb-volcano-fire"
  | "rb-laser-sky"
  | LegendId;
/** The six legendary robots (requirements v3 RA-102): their own robots, not the six above. */
export type LegendId =
  "lg-shield" | "lg-wing" | "lg-deep" | "lg-steel" | "lg-thunder" | "lg-guardian";
export type RobotMissionMode = "villain" | "rescue" | "thief";
export type WeaponKind = "sword" | "cannon" | "wind";
/** Each robot carries its own weapon; a fusion fights with the weapon on its arms. */
export type Weapon = {
  name: string;
  kind: WeaponKind;
  /** World distance from the robot that still counts as a hit. */
  range: number;
  cooldownMs: number;
};
export type RobotSpecies = {
  id: RobotSpeciesId;
  name: string;
  workName: string;
  family: RobotFamily;
  skill: string;
  color: string;
  accent: string;
  /** Upgraded robots carry an extra mark (bolt, lava, laser) on top of the family body. */
  mark: "none" | "bolt" | "lava" | "laser";
  weapon: Weapon;
  /** Starter cards are stored in the watch from the start; others open after 7 uses. */
  starter: boolean;
  /** Using this robot's card 7 times opens this card (RBQ-06 provisional answer). */
  unlocks?: RobotSpeciesId;
  /** Legendary robots are found in the world, never bought or drawn by chance. */
  legendary?: LegendId;
  /** What this robot brings to the team, shown in the watch (provisional, RAQ-06). */
  role?: string;
  /** Where to look for a legend, shown in the watch until it is found. */
  hint?: string;
};
export const CARD_USES_TO_UNLOCK = 7;
const SWORD: Weapon = { name: "빛 검", kind: "sword", range: 170, cooldownMs: 1100 };
const CANNON: Weapon = { name: "물대포", kind: "cannon", range: 260, cooldownMs: 1400 };
const WIND: Weapon = { name: "회오리 부메랑", kind: "wind", range: 220, cooldownMs: 1200 };
export const ROBOTS: readonly RobotSpecies[] = [
  {
    id: "rb-police",
    name: "경찰 로봇",
    workName: "메탈 폴리스",
    family: "police",
    skill: "사이렌 빔",
    color: "#4f7fd1",
    accent: "#f2f6ff",
    mark: "none",
    weapon: SWORD,
    starter: true,
    unlocks: "rb-thunder-police",
  },
  {
    id: "rb-fire",
    name: "소방 로봇",
    workName: "파이어 레스큐",
    family: "fire",
    skill: "물대포",
    color: "#e05a4f",
    accent: "#ffe7a8",
    mark: "none",
    weapon: CANNON,
    starter: true,
    unlocks: "rb-volcano-fire",
  },
  {
    id: "rb-sky",
    name: "하늘 로봇",
    workName: "스카이 이글",
    family: "sky",
    skill: "회오리 날개",
    color: "#46a99a",
    accent: "#e8fff9",
    mark: "none",
    weapon: WIND,
    starter: true,
    unlocks: "rb-laser-sky",
  },
  {
    id: "rb-thunder-police",
    name: "번개 경찰 로봇",
    workName: "썬더 폴리스",
    family: "police",
    skill: "번개 사이렌",
    color: "#3d5fb8",
    accent: "#ffe45c",
    mark: "bolt",
    weapon: { ...SWORD, name: "번개 검", range: 190 },
    starter: false,
  },
  {
    id: "rb-volcano-fire",
    name: "화산 소방 로봇",
    workName: "볼케이노 킹",
    family: "fire",
    skill: "용암 방패",
    color: "#c2412f",
    accent: "#ffb347",
    mark: "lava",
    weapon: { ...CANNON, name: "거대 물대포", range: 290 },
    starter: false,
  },
  {
    id: "rb-laser-sky",
    name: "레이저 하늘 로봇",
    workName: "레이저 팔콘",
    family: "sky",
    skill: "레이저 날개",
    color: "#7a5cc9",
    accent: "#9ef3ff",
    mark: "laser",
    weapon: { ...WIND, name: "레이저 부메랑", range: 250 },
    starter: false,
  },
];
// Legend names are working names until Hyunjun names them (RAQ-06). Each one fights with an
// existing weapon kind so strikes and effects work unchanged, and lends a family look to 2·3
// robot fusions.
export const LEGENDS: readonly RobotSpecies[] = [
  {
    id: "lg-shield",
    name: "방패 전설 로봇",
    workName: "방패 전설 로봇",
    family: "police",
    skill: "거대 방패",
    color: "#c9d3dd",
    accent: "#3f6fd1",
    mark: "none",
    weapon: { name: "방패 돌진", kind: "sword", range: 200, cooldownMs: 1000 },
    starter: false,
    legendary: "lg-shield",
    role: "막아 주기 · 거대 합체의 방패 어깨",
    hint: "캐릭터 마을 왼쪽 위 길을 왔다 갔다 해.",
  },
  {
    id: "lg-wing",
    name: "날개 전설 로봇",
    workName: "날개 전설 로봇",
    family: "sky",
    skill: "깃털 칼날",
    color: "#f4f8fb",
    accent: "#1fb5a8",
    mark: "none",
    weapon: { name: "깃털 칼날", kind: "wind", range: 300, cooldownMs: 1000 },
    starter: false,
    legendary: "lg-wing",
    role: "멀리 날기 · 거대 합체의 큰 날개",
    hint: "농장 마을 왼쪽 아래에서 하얀 날개를 찾아봐.",
  },
  {
    id: "lg-deep",
    name: "심해 전설 로봇",
    workName: "심해 전설 로봇",
    family: "fire",
    skill: "거품 어뢰",
    color: "#24407a",
    accent: "#4fd6e0",
    mark: "none",
    weapon: { name: "거품 어뢰", kind: "cannon", range: 320, cooldownMs: 1200 },
    starter: false,
    legendary: "lg-deep",
    role: "물속 힘 · 거대 합체의 다리 지느러미",
    hint: "바다에 없어! 장난감 마을 아래쪽을 위아래로 걸어 다녀.",
  },
  {
    id: "lg-steel",
    name: "강철 전설 로봇",
    workName: "강철 전설 로봇",
    family: "fire",
    skill: "강철 망치",
    color: "#5a6470",
    accent: "#f08a2c",
    mark: "none",
    weapon: { name: "강철 망치", kind: "sword", range: 180, cooldownMs: 1100 },
    starter: false,
    legendary: "lg-steel",
    role: "튼튼함 · 거대 합체의 가슴 갑옷",
    hint: "벚꽃 마을에서 위쪽으로 쭉 올라가 봐. 회색 몸에 주황 무늬야.",
  },
  {
    id: "lg-thunder",
    name: "번개 전설 로봇",
    workName: "번개 전설 로봇",
    family: "police",
    skill: "번개 창",
    color: "#ffd23f",
    accent: "#7a3fc9",
    mark: "bolt",
    weapon: { name: "번개 창", kind: "wind", range: 280, cooldownMs: 900 },
    starter: false,
    legendary: "lg-thunder",
    role: "빠른 공격 · 거대 합체의 번개 대포",
    hint: "부장 마을 오른쪽 위에서 노란 로봇이 네모로 돌고 있어.",
  },
  {
    id: "lg-guardian",
    name: "수호 전설 로봇",
    workName: "수호 전설 로봇",
    family: "sky",
    skill: "빛의 고리",
    color: "#e9b730",
    accent: "#fbf6e6",
    mark: "none",
    weapon: { name: "빛의 고리", kind: "cannon", range: 300, cooldownMs: 1000 },
    starter: false,
    legendary: "lg-guardian",
    role: "지켜 주기 · 거대 합체의 톱니 왕관",
    hint: "호박 마을 아래쪽에서 금빛 로봇을 찾아봐.",
  },
];
/** Every robot the watch knows: the six regular robots, then the six legends. */
export const ALL_ROBOTS: readonly RobotSpecies[] = [...ROBOTS, ...LEGENDS];
export const ROBOT_IDS: readonly string[] = ALL_ROBOTS.map((r) => r.id);
export const robotById = (id: RobotSpeciesId) => ALL_ROBOTS.find((r) => r.id === id)!;
export const isLegendId = (v: unknown): v is LegendId =>
  typeof v === "string" && LEGENDS.some((l) => l.id === v);
export const isRobotId = (v: unknown): v is RobotSpeciesId =>
  typeof v === "string" && ROBOT_IDS.includes(v);

/** Where the villain robot from the made-up rusty gear empire waits (RBQ-09 provisional). */
export const VILLAIN_SPOT = { x: 1350, y: 1450 };
export const VILLAIN_NAME = "녹슨 톱니 로봇";
/** The villain fights back while the summoned robot is this close. */
export const BATTLE_RANGE = 300;
/** The robot workshop turns parts won on missions into upgrades. */
export const WORKSHOP = { x: 850, y: 1500 };
export const WORKSHOP_RANGE = 170;
/** A friend trapped behind burning bushes, north-east of the start. */
export const RESCUE_SPOT = { x: 1700, y: 400 };
export const RESCUE_PATCHES = 3;
/** The thief robot hides in the wide west field and runs around there. */
export const THIEF_HOME = { x: 150, y: 1100 };
export const THIEF_LEASH = 380;
/** Clearly slower than walking (245) so a following robot can catch up. */
export const THIEF_SPEED = 150;
export const THIEF_STAMINA = 3;
export const GRADES = ["일반", "강화", "강철", "황금", "다이아몬드", "궁극"] as const;
/** 7 card uses take a robot to 강화; workshop parts take it on to 강철 (RW-04, RW-20). */
export const MAX_GRADE = 2;
export const UPGRADE_COST = 3;
export const WIN_PARTS = 2;
export const MISSION_PARTS = 2;
export const MAX_FUSION = 3;
export const ROBOT_ENERGY = 5;
export const VILLAIN_HIT_MS = 3000;
export const VILLAIN_RESPAWN_MS = 12000;
/** A summoned robot walks this far behind the player in follow mode. */
export const FOLLOW_GAP = 70;
