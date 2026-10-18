import { worldDistance, worldDelta } from "./world-space.ts";
import { MAP, clamp, type Point } from "./adventure.ts";

export type ServiceKind = "fire" | "ambulance" | "police";
export type CallId = "apartment-fire" | "restaurant-help" | "market-theft" | "plaza-help";
export type CallStatus = "reported" | "dispatched" | "resolved";
export type WorldCall = {
  id: CallId;
  kind: ServiceKind;
  title: string;
  report: string;
  vehicle: ServiceKind;
  x: number;
  y: number;
  needed: number;
};

export const STATIONS: Record<ServiceKind, Point & { label: string; badge: string }> = {
  fire: { x: 2860, y: 875, label: "119 소방서", badge: "🚒" },
  ambulance: { x: 4660, y: 875, label: "119 응급센터", badge: "🚑" },
  police: { x: 3740, y: 875, label: "112 경찰서", badge: "🚓" },
};
export const CAMP = { x: 3090, y: 1540 };
export const LAKE = { left: 1740, right: 2390, top: 710, bottom: 1020 } as const;

export const WORLD_CALLS: readonly WorldCall[] = [
  {
    id: "apartment-fire",
    kind: "fire",
    title: "아파트에 불이 났어요!",
    report: "119 신고! 무지개 아파트에 불이 났어요. 소방차로 물을 뿌려 주세요!",
    vehicle: "fire",
    x: 3475,
    y: 670,
    needed: 3,
  },
  {
    id: "restaurant-help",
    kind: "ambulance",
    title: "식당에서 도움이 필요해요!",
    report: "119 신고! 식당에서 음식을 먹던 사람이 목에 걸려 도움이 필요해요.",
    vehicle: "ambulance",
    x: 4260,
    y: 735,
    needed: 1,
  },
  {
    id: "market-theft",
    kind: "police",
    title: "시장에 도둑이 나타났어요!",
    report: "112 신고! 시장에서 가방을 들고 달아나는 도둑이 있어요.",
    vehicle: "police",
    x: 5210,
    y: 720,
    needed: 1,
  },
  {
    id: "plaza-help",
    kind: "ambulance",
    title: "광장에 쓰러진 사람이 있어요!",
    report: "119 신고! 광장에서 쓰러진 사람이 있어요. 구급차로 달려가 주세요.",
    vehicle: "ambulance",
    x: 4800,
    y: 1220,
    needed: 1,
  },
] as const;

export const distance = (a: Point, b: Point) => worldDistance(a, b);
export function canHelp(call: WorldCall, pos: Point, kind: string, driving: boolean) {
  return driving && kind === call.vehicle && distance(pos, call) <= 145;
}
export function helpProgress(call: WorldCall, progress: number) {
  return Math.min(call.needed, Math.max(0, progress + 1));
}
export function nextCallIndex(previous: number) {
  return (previous + 1) % WORLD_CALLS.length;
}

export function thiefPosition(step: number): Point {
  const moves = [
    { x: 5210, y: 720 },
    { x: 5280, y: 770 },
    { x: 5350, y: 700 },
    { x: 5270, y: 630 },
  ];
  return moves[((step % moves.length) + moves.length) % moves.length]!;
}

const roads = [3200, 4000, 5000];
function closestRoadX(x: number) {
  if (x < 2660) return 1350;
  return roads.reduce((a, b) => (Math.abs(x - a) <= Math.abs(x - b) ? a : b));
}
/** Navigation follows the town's east-west main street and marked north-south streets. */
export function streetRoute(from: Point, to: Point): Point[] {
  const a = closestRoadX(from.x);
  const b = closestRoadX(to.x);
  const result = [from, { x: a, y: from.y }, { x: a, y: 850 }];
  if (a !== b) result.push({ x: b, y: 850 });
  result.push({ x: b, y: to.y }, to);
  return result.filter((p, i, all) => i === 0 || distance(p, all[i - 1]!) > 0);
}
export function routeDirection(from: Point, to: Point) {
  const { x: dx, y: dy } = worldDelta(from, to);
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "오른쪽 →" : "← 왼쪽";
  return dy > 0 ? "아래쪽 ↓" : "↑ 위쪽";
}
export function isNearCamp(p: Point) {
  return distance(p, CAMP) <= 170;
}
export function isNearLake(p: Point) {
  const x = clamp(p.x, LAKE.left, LAKE.right);
  const y = clamp(p.y, LAKE.top, LAKE.bottom);
  return distance(p, { x, y }) <= 145;
}
export function enterLake(p: Point): Point {
  return {
    x: clamp(p.x, LAKE.left + 34, LAKE.right - 34),
    y: clamp(p.y, LAKE.top + 34, LAKE.bottom - 34),
  };
}
export function diveStep(p: Point, d: Point, dt: number): Point {
  const length = Math.max(1, Math.hypot(d.x, d.y));
  const speed = (180 * clamp(dt, 0, 0.05)) / length;
  return {
    x: clamp(p.x + d.x * speed, LAKE.left + 24, LAKE.right - 24),
    y: clamp(p.y + d.y * speed, LAKE.top + 24, LAKE.bottom - 24),
  };
}
export function leaveLake(p: Point): Point {
  const sides = [
    { gap: p.x - LAKE.left, point: { x: LAKE.left - 48, y: p.y } },
    { gap: LAKE.right - p.x, point: { x: LAKE.right + 48, y: p.y } },
    { gap: p.y - LAKE.top, point: { x: p.x, y: LAKE.top - 48 } },
    { gap: LAKE.bottom - p.y, point: { x: p.x, y: LAKE.bottom + 48 } },
  ];
  const nearest = sides.reduce((best, side) => (side.gap < best.gap ? side : best));
  return {
    x: clamp(nearest.point.x, 24, MAP.width - 24),
    y: clamp(nearest.point.y, 24, MAP.height - 24),
  };
}
