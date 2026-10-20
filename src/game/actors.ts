import { isNearCamp, isNearLake } from "./world-events.ts";
import { VILLAGES } from "./villages.ts";
import { isWalkable, nearestPortal, type Point } from "./adventure.ts";
import { worldDistance, wrapPoint } from "./world-space.ts";
import type { GameState } from "../lib/world-model.ts";
export const ACTORS = [
  { id: "dad", name: "아빠", kind: "dad", index: 0, x: 760, y: 930 },
  { id: "robot", name: "로봇 친구", kind: "robot", index: 0, x: 5950, y: 1230 },
  ...VILLAGES.map((v, i) => ({
    id: `friend-${v.id}`,
    name: v.friend,
    kind: "friend",
    index: i,
    x: v.x,
    y: v.y,
  })),
] as const;
export type Actor = (typeof ACTORS)[number];
export type ActorScene = "world" | "home" | "restaurant";
export function actorScene(
  actor: Actor,
  state: Pick<GameState, "companions" | "guests">,
  current: ActorScene,
): ActorScene {
  if (state.companions.includes(actor.id)) return current;
  if (state.guests.includes(actor.id) || actor.id === "dad") return "home";
  return "world";
}
// Patrols move at most hypot(65,35) < 75 from their fixed origin.
export const actorMayBeNear = (actor: Actor, player: Point, radius: number) =>
  worldDistance(actor, player) <= radius + 75;
const patrolCache = new WeakMap<Actor, { seconds: number; point: Point }>();
export function patrolPosition(actor: Actor, seconds: number): Point {
  const cached = patrolCache.get(actor);
  if (cached?.seconds === seconds) return { ...cached.point };
  const point = calculatePatrol(actor, seconds);
  patrolCache.set(actor, { seconds, point });
  return { ...point };
}
function calculatePatrol(actor: Actor, seconds: number): Point {
  if (actor.kind !== "friend") return { x: actor.x, y: actor.y };
  const phase = (((seconds * 0.045 + actor.index * 0.17) % 1) + 1) % 1;
  const angle = phase * Math.PI * 2;
  const candidate = wrapPoint({
    x: actor.x + Math.sin(angle) * 65,
    y: actor.y + Math.sin(angle * 2) * 35,
  });
  // Tiny steps and the same collision predicate keep NPCs off buildings and water.
  const steps = 12;
  for (let i = 0; i <= steps; i++)
    if (
      !isWalkable({
        x: actor.x + ((candidate.x - actor.x) * i) / steps,
        y: actor.y + ((candidate.y - actor.y) * i) / steps,
      })
    )
      return { x: actor.x, y: actor.y };
  return candidate;
}
export const nearActor = (a: Point, b: Point, scene: ActorScene) =>
  scene === "world" ? worldDistance(a, b) < 180 : Math.hypot(a.x - b.x, a.y - b.y) < 180;

export const portalHasPriority = (p: Point, scene: ActorScene) =>
  scene === "world" && (nearestPortal(p) !== null || isNearCamp(p) || isNearLake(p));

export function homeActorPosition(id: string, guests: string[]): Point {
  const slots = [
    { x: 850, y: 650 },
    { x: 900, y: 450 },
    { x: 720, y: 630 },
    { x: 900, y: 630 },
    { x: 1110, y: 500 },
  ];
  return slots[id === "dad" ? 0 : guests.indexOf(id) + 1] ?? slots[0]!;
}
