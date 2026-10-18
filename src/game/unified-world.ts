import { worldDistance, wrapPoint, isOcean } from "./world-space.ts";
import { isWalkable, MAP, type Point } from "./adventure.ts";
export const COAST = {
  truck: { x: 6310, y: 920 },
  customer: { x: 6640, y: 1120 },
  harbor: { x: 7330, y: 1010 },
  robot: { x: 5950, y: 1230 },
  house: { x: 480, y: 565 },
  kitchen: { x: 920, y: 560 },
  dining: { x: 1390, y: 970 },
};
export const OCEAN = { start: 7380, end: 10150, top: 60, bottom: MAP.height - 20 };
export const HOUSE_TIERS = [
  { tier: 1, name: "아담한 집", cost: 0 },
  { tier: 2, name: "넓은 2층 집", cost: 100 },
  { tier: 3, name: "멋진 대저택", cost: 350 },
  { tier: 4, name: "현준이 성", cost: 850 },
] as const;
export function nearWorld(a: Point, b: Point, range = 180) {
  return worldDistance(a, b) <= range;
}
export function stepSubmarine(p: Point, d: Point, dt: number): Point {
  const t = Math.min(0.05, Math.max(0, dt)),
    len = Math.max(1, Math.hypot(d.x, d.y));
  return {
    x: Math.max(OCEAN.start + 38, Math.min(OCEAN.end, p.x + (d.x * 340 * t) / len)),
    y: wrapPoint({ x: p.x, y: p.y + (d.y * 340 * t) / len }).y,
  };
}
export const OCEAN_DISCOVERIES = [
  { id: "pearl-coral", name: "진주 산호", x: 7950, y: 560 },
  { id: "star-fish", name: "불가사리", x: 8760, y: 1220 },
  { id: "gold-shell", name: "황금 조개", x: 9600, y: 660 },
] as const;

// Airplane: a runway on the coast. Takes off from the runway, flies across the whole 10200px map,
// and may only land on land or the runway, never on open water.
export const SHORE_X = OCEAN.start - 40;
export const RUNWAY = { x1: 5780, x2: 6980, y: 1500, half: 60 };
export const AIRPORT = { x: 6380, y: RUNWAY.y };
export const PLANE_SPEED = 520;
export function onRunway(p: Point) {
  return p.x >= RUNWAY.x1 && p.x <= RUNWAY.x2 && Math.abs(p.y - RUNWAY.y) <= RUNWAY.half;
}
export function canLandPlane(p: Point) {
  return onRunway(p) || (!isOcean(p) && isWalkable(p));
}
export function stepPlane(p: Point, d: Point, dt: number): Point {
  const t = Math.min(0.05, Math.max(0, dt)),
    len = Math.max(1, Math.hypot(d.x, d.y));
  return wrapPoint({
    x: p.x + (d.x * PLANE_SPEED * t) / len,
    y: p.y + (d.y * PLANE_SPEED * t) / len,
  });
}
