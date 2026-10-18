import type { FurnitureId } from "../lib/world-model.ts";
import type { Point } from "./adventure.ts";

export type LifeRegion = "village" | "coast" | "mansion" | "deep-sea";
export const LIFE_MAPS = {
  coast: { width: 3800, height: 1800 },
  mansion: { width: 2200, height: 1500 },
  "deep-sea": { width: 4200, height: 1800 },
} as const;

export const LIFE_SPOTS = {
  villageGate: { x: 5380, y: 990 },
  coastArrival: { x: 460, y: 1000 },
  coastExit: { x: 150, y: 1000 },
  mansionDoor: { x: 1210, y: 1080 },
  mansionInside: { x: 1110, y: 850 },
  mansionExit: { x: 1110, y: 1300 },
  mansionKitchen: { x: 920, y: 560 },
  mansionDining: { x: 1390, y: 970 },
  robot: { x: 1490, y: 1250 },
  foodTruck: { x: 1980, y: 900 },
  foodCustomer: { x: 2310, y: 1100 },
  harbor: { x: 3120, y: 1030 },
  seaStart: { x: 700, y: 970 },
  seaReturn: { x: 240, y: 970 },
} as const;

// Shared by drawing and movement so the visible doors are also walkable.
export const HOME_WALLS = [
  { x: 90, y: 738, width: 460, height: 24 },
  { x: 750, y: 738, width: 260, height: 24 },
  { x: 1210, y: 738, width: 340, height: 24 },
  { x: 1750, y: 738, width: 360, height: 24 },
  ...[1010, 1210].flatMap((x) => [
    { x, y: 100, width: 24, height: 250 },
    { x, y: 550, width: 24, height: 188 },
    { x, y: 762, width: 24, height: 218 },
    { x, y: 1180, width: 24, height: 180 },
  ]),
];
export function homeFurniturePlacements(room: (FurnitureId | null)[], tier: number) {
  const slots = [
    { x: 350, y: tier >= 3 ? 1100 : 550 },
    { x: 760, y: 560 },
    { x: 850, y: 340 },
    { x: 1450, y: 1100 },
    { x: 500, y: 640 },
    { x: 1900, y: 1120 },
  ];
  return room.flatMap((id, i) => (id && slots[i] ? [{ id, ...slots[i]! }] : []));
}
export function canWalkHome(p: Point, houseTier = 4) {
  if (p.x < 140 || p.x > 2060 || p.y < 240 || p.y > 1300) return false;
  if (houseTier < 2 && p.x > 1240 && p.y < 710) return false;
  if (houseTier < 3 && p.x < 980 && p.y > 790) return false;
  return !HOME_WALLS.some(
    (w) =>
      p.x > w.x - 28 && p.x < w.x + w.width + 28 && p.y > w.y - 28 && p.y < w.y + w.height + 28,
  );
}

export const SEA_TREASURES = [
  { id: "pearl-coral", name: "진주 산호 정원", x: 1220, y: 550, reward: 20 },
  { id: "star-fish", name: "불가사리 협곡", x: 2450, y: 1170, reward: 25 },
  { id: "gold-shell", name: "황금 조개 동굴", x: 3590, y: 650, reward: 35 },
] as const;
export type SeaTreasureId = (typeof SEA_TREASURES)[number]["id"];

export const FOOD_MENU = [
  { id: "cutlet", name: "돈까스", emoji: "🍛", size: 1, price: 18 },
  { id: "kimchi", name: "김치", emoji: "🥬", size: 1, price: 12 },
  { id: "pizza", name: "피자", emoji: "🍕", size: 1, price: 25 },
  { id: "cola", name: "콜라", emoji: "🥤", size: 1, price: 8 },
  { id: "giant-pizza", name: "대왕 피자", emoji: "🍕", size: 1.6, price: 55 },
  { id: "gold-pizza", name: "초대형 황금 피자", emoji: "🌟🍕", size: 2.2, price: 150 },
  { id: "dino-burger", name: "공룡 햄버거", emoji: "🍔", size: 1.7, price: 60 },
  { id: "giant-icecream", name: "대왕 아이스크림", emoji: "🍦", size: 1.9, price: 45 },
] as const;
export type FoodId = (typeof FOOD_MENU)[number]["id"];
export function foodById(id: string) {
  return FOOD_MENU.find((food) => food.id === id);
}
export function seaTreasureById(id: string) {
  return SEA_TREASURES.find((site) => site.id === id);
}

export type FoodOrder = {
  id: string;
  foodId: FoodId;
  phase: "offered" | "prepared";
};
export function freshFoodOrderId() {
  try {
    return "food-" + globalThis.crypto.randomUUID();
  } catch {
    return "food-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }
}
export function nextFoodOrder(index: number, id: string): FoodOrder {
  const food = FOOD_MENU[((index % FOOD_MENU.length) + FOOD_MENU.length) % FOOD_MENU.length]!;
  return { id, foodId: food.id, phase: "offered" };
}
export function nearSpot(position: Point, target: Point, radius = 160) {
  return Math.hypot(position.x - target.x, position.y - target.y) <= radius;
}
export function nearbyTreasure(position: Point) {
  return SEA_TREASURES.find((site) => nearSpot(position, site, 170)) ?? null;
}
export function stepLifePlayer(
  region: Exclude<LifeRegion, "village">,
  position: Point,
  direction: Point,
  dt: number,
  houseTier = 4,
): Point {
  const size = LIFE_MAPS[region];
  const length = Math.max(1, Math.hypot(direction.x, direction.y));
  const time = Math.min(0.05, Math.max(0, dt));
  const speed = region === "deep-sea" ? 320 : 245;
  const nextX = position.x + (direction.x * speed * time) / length;
  const nextY = position.y + (direction.y * speed * time) / length;
  if (region === "mansion") {
    const x = canWalkHome({ x: nextX, y: position.y }, houseTier) ? nextX : position.x;
    const y = canWalkHome({ x, y: nextY }, houseTier) ? nextY : position.y;
    return { x, y };
  }
  const maxX = region === "coast" ? 3300 : size.width - 45;
  return {
    x: Math.min(maxX, Math.max(45, nextX)),
    y: Math.min(size.height - 45, Math.max(45, nextY)),
  };
}
export const LIFE_REGION_LABELS: Record<LifeRegion, string> = {
  village: "열 개 마을",
  coast: "대왕집 · 바닷가 · 푸드트럭",
  mansion: "현준이의 우리 집",
  "deep-sea": "잠수함으로 탐험하는 큰 바다",
};
