import { cropById, type CropId, type Plot, type WorldAction } from "../lib/world-model.ts";
export type GreenhousePoint = { x: number; y: number };
export const GREENHOUSE_SPAWN = { x: 300, y: 440 };
export const GREENHOUSE_DOOR = { x: 300, y: 470 };
export const GREENHOUSE_BEDS = [
  { x: 120, y: 150 },
  { x: 300, y: 150 },
  { x: 480, y: 150 },
  { x: 120, y: 310 },
  { x: 300, y: 310 },
  { x: 480, y: 310 },
] as const;
export function greenhouseWalkable(p: GreenhousePoint): boolean {
  return (
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    p.x >= 24 &&
    p.x <= 576 &&
    p.y >= 40 &&
    p.y <= 476 &&
    !GREENHOUSE_BEDS.some((b) => Math.abs(b.x - p.x) < 72 && Math.abs(b.y - p.y) < 57)
  );
}
export function stepGreenhouse(
  p: GreenhousePoint,
  d: GreenhousePoint,
  seconds: number,
): GreenhousePoint {
  if (!Number.isFinite(seconds) || seconds <= 0 || !Number.isFinite(d.x) || !Number.isFinite(d.y))
    return p;
  const scale = (180 * Math.min(0.05, seconds)) / Math.max(1, Math.hypot(d.x, d.y));
  const h = { x: p.x + d.x * scale, y: p.y };
  const x = greenhouseWalkable(h) ? h.x : p.x;
  const v = { x, y: p.y + d.y * scale };
  const y = greenhouseWalkable(v) ? v.y : p.y;
  return x === p.x && y === p.y ? p : { x, y };
}
export function canCareGreenhouse(p: GreenhousePoint, index: number): boolean {
  const bed = Number.isInteger(index) ? GREENHOUSE_BEDS[index] : undefined;
  return !!bed && greenhouseWalkable(p) && Math.hypot(p.x - bed.x, p.y - bed.y) <= 82;
}
export const nearGreenhouseDoor = (p: GreenhousePoint) =>
  greenhouseWalkable(p) && Math.hypot(p.x - 300, p.y - 470) <= 50;
export function greenhouseAction(
  p: GreenhousePoint,
  index: number,
  plots: readonly Plot[],
  selected: CropId,
  money: number,
): WorldAction | null {
  const plot = plots[index];
  if (!plot || !canCareGreenhouse(p, index)) return null;
  if (!plot.crop)
    return money >= cropById(selected).seedCost ? { type: "plant", index, crop: selected } : null;
  return { type: plot.water < cropById(plot.crop).waterNeeded ? "water" : "harvest", index };
}
