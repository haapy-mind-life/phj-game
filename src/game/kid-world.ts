import type { Point } from "./adventure.ts";
import { wrap, WORLD_SIZE, SEA_LEFT, SEA_RIGHT } from "./world-space.ts";

// 2026-10-25 child requests: islands and countries in the big sea, more town buildings,
// dad's company, a construction site, and house lots the family can move between.

/** Walkable islands inside the ocean band (x 7380..10200). Ellipses: rx/ry are the land radius. */
export const ISLANDS = [
  {
    id: "dokdo",
    name: "독도",
    x: 8350,
    y: 2500,
    rx: 230,
    ry: 150,
    emoji: "🇰🇷 🪨",
    color: "#c9b48c",
  },
  {
    id: "ulleung",
    name: "울릉도",
    x: 7950,
    y: 3500,
    rx: 300,
    ry: 230,
    emoji: "🦑 ⛰️",
    color: "#a8c98d",
  },
  {
    id: "jeju",
    name: "제주도",
    x: 8700,
    y: 5000,
    rx: 760,
    ry: 380,
    emoji: "🍊 🌋",
    color: "#b5d39a",
  },
  {
    id: "japan",
    name: "일본",
    x: 9450,
    y: 7300,
    rx: 520,
    ry: 1050,
    emoji: "🗻 🍣",
    color: "#c2d8a6",
  },
  {
    id: "hawaii",
    name: "하와이 섬",
    x: 8100,
    y: 8900,
    rx: 420,
    ry: 260,
    emoji: "🌺 🏄",
    color: "#bfe0a0",
  },
  {
    id: "treasure",
    name: "보물섬",
    x: 8900,
    y: 10050,
    rx: 330,
    ry: 220,
    emoji: "🏴‍☠️ 💰",
    color: "#d8c690",
  },
] as const;
export type IslandId = (typeof ISLANDS)[number]["id"];
export function islandAt(p: Point) {
  const x = wrap(p.x, WORLD_SIZE.width),
    y = wrap(p.y, WORLD_SIZE.height);
  return ISLANDS.find((i) => ((x - i.x) / i.rx) ** 2 + ((y - i.y) / i.ry) ** 2 <= 1) ?? null;
}
/** Open sea water: inside the ocean band and not on an island. */
export function isSeaWater(p: Point) {
  const x = wrap(p.x, WORLD_SIZE.width);
  return x >= SEA_LEFT && x < SEA_RIGHT && !islandAt(p);
}

/** Town buildings in the free strip south of the original villages; x,y is the front door. */
export const LANDMARKS = [
  {
    id: "mart",
    name: "별빛 마트",
    x: 600,
    y: 2250,
    color: "#8cc7a8",
    emoji: "🛒",
    words: "장보기 끝! 과일이랑 우유를 샀어.",
  },
  {
    id: "dad-office",
    name: "아빠 회사",
    x: 2400,
    y: 2250,
    color: "#8fa9d6",
    emoji: "💼",
    words: "아빠 회사에 왔어! 아빠가 열심히 일하고 있어. 아빠 힘내요!",
    tall: true,
  },
  {
    id: "school",
    name: "햇살 학교",
    x: 3200,
    y: 2250,
    color: "#f0c078",
    emoji: "🏫",
    words: "학교 종이 땡땡땡! 친구들이랑 공부하고 놀자.",
  },
  {
    id: "toy",
    name: "장난감 가게",
    x: 6900,
    y: 2250,
    color: "#e9a0c0",
    emoji: "🧸",
    words: "로봇이랑 자동차 장난감이 엄청 많아!",
  },
  {
    id: "hospital",
    name: "튼튼 병원",
    x: 12200,
    y: 1650,
    color: "#f2b5b5",
    emoji: "🏥",
    words: "의사 선생님이 반갑게 인사해 줬어.",
  },
  {
    id: "library",
    name: "꿈 도서관",
    x: 14200,
    y: 1650,
    color: "#b7a6db",
    emoji: "📚",
    words: "공룡 책이랑 바다 책을 읽었어!",
  },
] as const;
export type LandmarkId = (typeof LANDMARKS)[number]["id"];
export const CONSTRUCTION = { x: 5600, y: 2250, floors: 5 } as const;

/** Where the family home can stand. "original" keeps the legacy house at x≈480. */
export const HOME_LOTS = [
  { id: "original", name: "원래 우리 동네", x: 480, y: 565 },
  { id: "newtown", name: "새 동네", x: 1800, y: 2330 },
  { id: "jeju", name: "제주도", x: 8300, y: 5150 },
  { id: "east", name: "동쪽 바닷가", x: 11300, y: 1650 },
] as const;
export type HomeLotId = (typeof HOME_LOTS)[number]["id"];
export const homeLot = (id: string | undefined) =>
  HOME_LOTS.find((l) => l.id === id) ?? HOME_LOTS[0];

/** Burger restaurants are drawn (and blocked) larger than the others. */
export const BIG_RESTAURANT_SCALE = 1.6;

type Rect = { left: number; right: number; top: number; bottom: number };
/** Fixed building footprints, resolved once and used by world collision. */
export const KID_WORLD_BLOCKS: Rect[] = [
  ...LANDMARKS.map((l) => ({
    left: l.x - 160,
    right: l.x + 160,
    top: l.y - ("tall" in l ? 380 : 240),
    bottom: l.y - 30,
  })),
  {
    left: CONSTRUCTION.x - 230,
    right: CONSTRUCTION.x + 230,
    top: CONSTRUCTION.y - 330,
    bottom: CONSTRUCTION.y - 40,
  },
  // Every non-original lot is fenced whether or not the house currently stands there.
  ...HOME_LOTS.filter((l) => l.id !== "original").map((l) => ({
    left: l.x - 140,
    right: l.x + 140,
    top: l.y - 250,
    bottom: l.y - 50,
  })),
];

export type KidSpot =
  | { kind: "landmark"; landmark: (typeof LANDMARKS)[number] }
  | { kind: "construction" }
  | { kind: "lot"; lot: (typeof HOME_LOTS)[number] };
const near = (a: Point, b: Point, r: number) => {
  const dx = Math.abs(
      wrap(a.x - b.x + WORLD_SIZE.width / 2, WORLD_SIZE.width) - WORLD_SIZE.width / 2,
    ),
    dy = Math.abs(
      wrap(a.y - b.y + WORLD_SIZE.height / 2, WORLD_SIZE.height) - WORLD_SIZE.height / 2,
    );
  return Math.hypot(dx, dy) <= r;
};
/** The town spot in front of the player, if any. The current home lot is not a move target. */
export function nearKidSpot(p: Point, currentLot: string): KidSpot | null {
  const landmark = LANDMARKS.find((l) => near(p, { x: l.x, y: l.y + 30 }, 170));
  if (landmark) return { kind: "landmark", landmark };
  if (near(p, { x: CONSTRUCTION.x, y: CONSTRUCTION.y }, 220)) return { kind: "construction" };
  const lot = HOME_LOTS.find((l) => l.id !== currentLot && near(p, l, 185));
  return lot ? { kind: "lot", lot } : null;
}
