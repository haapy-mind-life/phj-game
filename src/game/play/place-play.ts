import type { Point } from "../world/adventure.ts";
import { worldDistance } from "../world/world-space.ts";
import { STATIONS } from "../world/world-events.ts";
export type MissionKind = "delivery" | "police" | "fire" | "ambulance";
export const DELIVERY_GARAGE = { x: 850, y: 850, label: "꾸러미 배달 차고", badge: "📦" };
export const MISSION_LABELS = {
  delivery: "꾸러미 배달",
  police: "잃어버린 가방 찾기",
  fire: "불꽃에 물 뿌리기",
  ambulance: "친구를 안전하게 데려다주기",
};
export type PlaceMission = {
  id: string;
  kind: MissionKind;
  step: number;
  special: boolean;
  done: boolean;
  seconds: number;
};
export function createMission(kind: MissionKind, id: string, special: boolean): PlaceMission {
  return { id, kind, step: 0, special, done: false, seconds: 0 };
}
export function missionTarget(m: PlaceMission, seconds: number): Point {
  if (m.kind === "delivery")
    return [
      { x: 1350, y: 1100 },
      { x: 2100, y: 1100 },
      { x: 2680, y: 1100 },
    ][Math.min(2, m.step)]!;
  if (m.kind === "fire")
    return [
      { x: 3200, y: 850 },
      { x: 3600, y: 850 },
      { x: 4000, y: 850 },
    ][Math.min(2, m.step)]!;
  if (m.kind === "police")
    return [
      { x: 4000, y: 850 },
      { x: 4600, y: 850 },
      { x: 5200 + Math.sin(seconds) * 60, y: 850 },
    ][Math.min(2, m.step)]!;
  const a = { x: 4260, y: 850 },
    b = { x: 5000, y: 850 },
    home = STATIONS.ambulance;
  return (m.special ? [a, b, home] : [a, home, b, home])[m.step] ?? home;
}
export function actMission(m: PlaceMission, p: Point, seconds: number): PlaceMission {
  if (
    m.done ||
    worldDistance(p, missionTarget(m, seconds)) > (m.kind === "fire" && m.special ? 165 : 110)
  )
    return m;
  const step = m.step + 1;
  return { ...m, step, seconds, done: step >= (m.kind === "ambulance" && !m.special ? 4 : 3) };
}
export const DIVE_SIZE = { width: 700, height: 3300 };
export const DIVE_TREASURES = [
  { id: "coral", name: "산호 진주", x: 200, y: 730 },
  { id: "shell", name: "반짝 조개", x: 490, y: 1690 },
  { id: "cave", name: "동굴 보물", x: 240, y: 2860 },
];
export function stepDive(p: Point, d: Point, dt: number): Point {
  const t = Math.min(0.05, Math.max(0, dt)),
    len = Math.max(1, Math.hypot(d.x, d.y));
  return {
    x: Math.max(40, Math.min(660, p.x + (d.x * 330 * t) / len)),
    y: Math.max(90, Math.min(3180, p.y + (d.y * 330 * t) / len)),
  };
}
