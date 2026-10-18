import { test } from "node:test";
import assert from "node:assert/strict";
import { MAP, stepPlayer, isWalkable } from "./adventure.ts";
import { migrateSave, reduceWorld } from "../lib/world-model.ts";

test("original villages and new coast form an extended wrapping world", () => {
  assert.equal(MAP.width, 20400);
  const oldEdge = stepPlayer({ x: 5595, y: 850 }, { x: 1, y: 0 }, 0.05);
  assert.ok(oldEdge.x > 5600);
  const west = stepPlayer({ x: 24, y: 850 }, { x: -1, y: 0 }, 0.05);
  assert.equal(west.x, 11.75);
  assert.ok(isWalkable(oldEdge) && isWalkable(west));
});
test("new constellation records migrate and pay only once", () => {
  const old = migrateSave({ money: 123, miniBest: { treasure: 4 } });
  assert.equal(old.miniBest.constellation, 0);
  const action = {
    type: "settle-mini" as const,
    id: "draw-1",
    game: "constellation" as const,
    score: 6,
  };
  const next = reduceWorld(old, action);
  assert.equal(next.money, 157);
  assert.equal(next.miniBest.treasure, 4);
  assert.equal(next.miniBest.constellation, 6);
  assert.deepEqual(reduceWorld(next, action), next);
});
