import type { Point } from "./adventure.ts";
export function canWalkRestaurant(p: Point) {
  return (
    p.x >= 120 &&
    p.x <= 1380 &&
    p.y >= 320 &&
    p.y <= 950 &&
    !(p.x > 160 && p.x < 770 && p.y > 350 && p.y < 460) &&
    !(p.x > 920 && p.x < 1270 && p.y > 610 && p.y < 830)
  );
}
export function stepRestaurant(p: Point, d: Point, dt: number): Point {
  const t = Math.max(0, Math.min(0.05, dt)),
    len = Math.max(1, Math.hypot(d.x, d.y));
  const x = p.x + (d.x * 245 * t) / len,
    y = p.y + (d.y * 245 * t) / len;
  const next = { ...p };
  if (canWalkRestaurant({ x, y: p.y })) next.x = x;
  if (canWalkRestaurant({ x: next.x, y })) next.y = y;
  return next;
}
