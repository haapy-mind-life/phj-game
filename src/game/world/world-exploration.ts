import type { GameState, WorldAction } from "../../lib/world-model.ts";

export type Point = { x: number; y: number };
export type WorldEntityKind = "friend" | "animal" | "gate" | "secret";
export type WorldEntity = {
  id: string;
  name: string;
  emoji: string;
  kind: WorldEntityKind;
  x: number;
  y: number;
  radius: number;
  target?: "/race" | "/greenhouse" | "/house";
};

export type WorldInteraction =
  | { label: string; action: WorldAction }
  | { label: string; navigate: "/race" | "/greenhouse" | "/house" }
  | { label: string; message: string };

export const WORLD_BOUNDS = { minX: 2, maxX: 98, minY: 28, maxY: 88 } as const;

export const WORLD_ENTITIES: WorldEntity[] = [
  {
    id: "house",
    name: "우리 집",
    emoji: "🏠",
    kind: "gate",
    x: 14,
    y: 57,
    radius: 10,
    target: "/house",
  },
  {
    id: "runner",
    name: "박현준 러너",
    emoji: "🏁",
    kind: "gate",
    x: 84,
    y: 51,
    radius: 10,
    target: "/race",
  },
  {
    id: "farm",
    name: "반짝 농장",
    emoji: "🌱",
    kind: "gate",
    x: 82,
    y: 80,
    radius: 10,
    target: "/greenhouse",
  },
  { id: "toto", name: "토토", emoji: "🧒", kind: "friend", x: 42, y: 52, radius: 8 },
  { id: "lulu", name: "루루", emoji: "👧", kind: "friend", x: 58, y: 49, radius: 8 },
  { id: "bori", name: "보리", emoji: "🐶", kind: "animal", x: 52, y: 69, radius: 8 },
  { id: "secret", name: "수상한 문", emoji: "🚪", kind: "secret", x: 31, y: 79, radius: 8 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function movePlayer(position: Point, direction: Point, amount = 4): Point {
  return {
    x: clamp(position.x + direction.x * amount, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
    y: clamp(position.y + direction.y * amount, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY),
  };
}

export function nearbyEntity(
  position: Point,
  entities: WorldEntity[] = WORLD_ENTITIES,
): WorldEntity | null {
  let nearest: { entity: WorldEntity; distance: number } | null = null;
  for (const entity of entities) {
    const distance = Math.hypot(entity.x - position.x, entity.y - position.y);
    if (distance > entity.radius) continue;
    if (!nearest || distance < nearest.distance) nearest = { entity, distance };
  }
  return nearest?.entity ?? null;
}

export function interactionForEntity(entity: WorldEntity, state: GameState): WorldInteraction {
  if (entity.id === "toto") {
    const hearts = state.friendship.toto;
    return {
      label: hearts >= 3 ? "E 토토와 보물찾기" : "E 토토와 놀기",
      action: { type: "friend-play", id: "toto" },
    };
  }
  if (entity.id === "lulu") {
    const hearts = state.friendship.lulu;
    return {
      label: hearts >= 3 ? "E 루루와 강아지 산책" : "E 루루와 놀기",
      action: { type: "friend-play", id: "lulu" },
    };
  }
  if (entity.id === "bori") {
    return {
      label: state.animals.bori.fullness >= 3 ? "E 보리 쓰다듬기" : "E 보리에게 밥 주기",
      action: { type: "feed-animal", id: "bori" },
    };
  }
  if (entity.kind === "gate" && entity.target) {
    return { label: `E ${entity.name} 들어가기`, navigate: entity.target };
  }
  return {
    label: "E 살펴보기",
    message: "문 뒤에서 반짝이는 소리가 들려. 비밀 사다리가 있는 걸까?",
  };
}
