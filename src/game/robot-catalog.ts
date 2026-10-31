import type { Point } from "./adventure.ts";
import { isWalkable } from "./adventure.ts";

// Phase-1 robots from Hyunjun's robot fusion request (docs/robot-fusion/2026-10-31-v1.0).
// `workName` keeps the name Hyunjun gave; screens show the descriptive `name` until the
// display names are checked (02_REVIEW_AND_SUPPLEMENT.md R4).
export type RobotFamily = "police" | "fire" | "sky";
export type RobotSpeciesId =
  "rb-police" | "rb-fire" | "rb-sky" | "rb-thunder-police" | "rb-volcano-fire" | "rb-laser-sky";
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
  home: Point;
  /** Starter robots roam from the start; unlocked ones appear once their card is owned. */
  starter: boolean;
  /** Using this robot's card 7 times opens this card (RBQ-06 provisional answer). */
  unlocks?: RobotSpeciesId;
};
export const CARD_USES_TO_UNLOCK = 7;
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
    home: { x: 1250, y: 750 },
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
    home: { x: 1550, y: 750 },
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
    home: { x: 1650, y: 1200 },
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
    home: { x: 1150, y: 1100 },
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
    home: { x: 1650, y: 950 },
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
    home: { x: 1200, y: 1000 },
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
export const BATTLE_RANGE = 230;
/** The robot workshop turns parts won from villains into upgrades. */
export const WORKSHOP = { x: 850, y: 1500 };
export const WORKSHOP_RANGE = 170;
export const GRADES = ["일반", "강화", "강철", "황금", "다이아몬드", "궁극"] as const;
/** Phase 1 only goes from 일반 to 강화; later grades come with the 24 robot designs. */
export const MAX_GRADE = 1;
export const UPGRADE_COST = 3;
export const WIN_PARTS = 2;
export const MAX_FUSION = 3;
export const ROBOT_ENERGY = 5;
export const VILLAIN_HIT_MS = 3000;
export const VILLAIN_RESPAWN_MS = 12000;
export const MEET_RANGE = 130;
export const CARD_COOLDOWN_MS = 1500;
// Same idea as friend patrols in actors.ts: a slow deterministic loop around home.
export function robotPosition(robot: RobotSpecies, seconds: number): Point {
  const index = ROBOTS.indexOf(robot);
  const angle = (seconds * 0.05 + index * 0.21) * Math.PI * 2;
  const p = {
    x: robot.home.x + Math.sin(angle) * 40,
    y: robot.home.y + Math.cos(angle * 0.7) * 25,
  };
  return isWalkable(p) ? p : { ...robot.home };
}
