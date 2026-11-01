import test from "node:test";
import assert from "node:assert/strict";
import {
  WORLD_ENTITIES,
  movePlayer,
  nearbyEntity,
  interactionForEntity,
} from "../game/world/world-exploration.ts";
import { migrateSave, reduceWorld } from "./world-model.ts";

test("A/D movement changes world position and never leaves the walkable bounds", () => {
  assert.deepEqual(movePlayer({ x: 50, y: 72 }, { x: -1, y: 0 }, 18), { x: 32, y: 72 });
  assert.deepEqual(movePlayer({ x: 5, y: 72 }, { x: -1, y: 0 }, 18), { x: 2, y: 72 });
  assert.deepEqual(movePlayer({ x: 95, y: 72 }, { x: 1, y: 0 }, 18), { x: 98, y: 72 });
});

test("only the nearest in-range world entity becomes interactable", () => {
  const toto = WORLD_ENTITIES.find((entity) => entity.id === "toto")!;
  const found = nearbyEntity({ x: toto.x + 1, y: toto.y }, WORLD_ENTITIES);
  assert.equal(found?.id, "toto");

  const none = nearbyEntity({ x: 50, y: 15 }, WORLD_ENTITIES);
  assert.equal(none, null);
});

test("friend and dog interactions expose one contextual action instead of menu buttons", () => {
  const state = migrateSave(null);
  const toto = WORLD_ENTITIES.find((entity) => entity.id === "toto")!;
  const dog = WORLD_ENTITIES.find((entity) => entity.id === "bori")!;

  assert.deepEqual(interactionForEntity(toto, state), {
    label: "E 토토와 놀기",
    action: { type: "friend-play", id: "toto" },
  });
  assert.deepEqual(interactionForEntity(dog, state), {
    label: "E 보리에게 밥 주기",
    action: { type: "feed-animal", id: "bori" },
  });
});

test("friend play and dog care persist safely in the shared save model", () => {
  const start = migrateSave(null);
  const afterFriend = reduceWorld(start, { type: "friend-play", id: "toto" });
  const afterDog = reduceWorld(afterFriend, { type: "feed-animal", id: "bori" });

  assert.equal(afterDog.friendship.toto, 1);
  assert.equal(afterDog.animals.bori.fullness, 3);
  assert.equal(afterDog.animals.bori.friendship, 1);
});
