import type { Point } from "./adventure.ts";

// Robots from Hyunjun's robot fusion request (docs/robot-fusion/2026-10-31-v1.0) and the
// 2026-11-01 robot watch update (docs/robot-fusion/2026-11-01-watch-integration).
// `workName` keeps the name Hyunjun gave; screens show the descriptive `name` until the
// display names are checked (02_REVIEW_AND_SUPPLEMENT.md R4).
export type RobotFamily = "police" | "fire" | "sky";
export type RobotSpeciesId =
  "rb-police" | "rb-fire" | "rb-sky" | "rb-thunder-police" | "rb-volcano-fire" | "rb-laser-sky";
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
export const ROBOT_IDS: readonly string[] = ROBOTS.map((r) => r.id);
export const robotById = (id: RobotSpeciesId) => ROBOTS.find((r) => r.id === id)!;
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
