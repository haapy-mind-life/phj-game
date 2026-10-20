import type { Point } from "./adventure.ts";
export const WORLD_SIZE = { width: 20400, height: 10800 };
export const SEA_LEFT = 7380,
  SEA_RIGHT = 10200;
export const wrap = (n: number, size: number) => ((n % size) + size) % size;
export const wrapPoint = (p: Point): Point => ({
  x: wrap(p.x, WORLD_SIZE.width),
  y: wrap(p.y, WORLD_SIZE.height),
});
export const shortest = (delta: number, size: number) => wrap(delta + size / 2, size) - size / 2;
export function worldDelta(from: Point, to: Point): Point {
  return {
    x: shortest(to.x - from.x, WORLD_SIZE.width),
    y: shortest(to.y - from.y, WORLD_SIZE.height),
  };
}
export function worldDistance(a: Point, b: Point) {
  const d = worldDelta(a, b);
  return Math.hypot(d.x, d.y);
}
export function isOcean(p: Point) {
  const x = wrap(p.x, WORLD_SIZE.width);
  return x >= SEA_LEFT && x < SEA_RIGHT;
}
export function screenPoint(p: Point, center: Point) {
  const d = worldDelta(center, p);
  return { x: center.x + d.x, y: center.y + d.y };
}
export function visibleOffsets(center: Point, w: number, h: number) {
  const xs = [0],
    ys = [0];
  if (center.x - w / 2 < 0) xs.push(-WORLD_SIZE.width);
  if (center.x + w / 2 > WORLD_SIZE.width) xs.push(WORLD_SIZE.width);
  if (center.y - h / 2 < 0) ys.push(-WORLD_SIZE.height);
  if (center.y + h / 2 > WORLD_SIZE.height) ys.push(WORLD_SIZE.height);
  return xs.flatMap((x) => ys.map((y) => ({ x, y })));
}
/** Conservative viewport culling, including the world's wrapped edges. */
export function worldRectVisible(
  center: Point,
  w: number,
  h: number,
  rect: { x: number; y: number; width: number; height: number },
) {
  const delta = worldDelta(center, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
  return Math.abs(delta.x) <= (w + rect.width) / 2 && Math.abs(delta.y) <= (h + rect.height) / 2;
}
