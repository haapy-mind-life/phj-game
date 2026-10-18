import { test } from "node:test";
import assert from "node:assert/strict";
import { MAP, stepPlayer, cameraAt } from "./adventure.ts";
import { worldDistance, wrapPoint, isOcean } from "./world-space.ts";
import { VILLAGES } from "./villages.ts";
import { RESTAURANTS, FESTIVALS } from "./world-content.ts";

test("30 villages and six distinct restaurants preserve legacy locations", () => {
  assert.equal(VILLAGES.length, 30);
  assert.equal(RESTAURANTS.length, 6);
  assert.equal(VILLAGES[0]!.x, 480);
  assert.equal(new Set(VILLAGES.map((v) => v.id)).size, 30);
  for (const v of VILLAGES) assert.ok(!isOcean(v));
  assert.ok(RESTAURANTS.some((r) => r.name === "맥도날드"));
  assert.equal(FESTIVALS.length, 3);
});
test("walking and camera cross both seams continuously without entering water", () => {
  assert.deepEqual(MAP, { width: 20400, height: 10800 });
  assert.deepEqual(wrapPoint({ x: -5, y: 10805 }), { x: 20395, y: 5 });
  assert.equal(worldDistance({ x: 2, y: 10 }, { x: 20398, y: 10 }), 4);
  assert.ok(stepPlayer({ x: 2, y: 850 }, { x: -1, y: 0 }, 0.05).x > 20380);
  assert.ok(stepPlayer({ x: 1200, y: 2 }, { x: 0, y: -1 }, 0.05).y > 10780);
  assert.equal(stepPlayer({ x: 7328, y: 5000 }, { x: 1, y: 0 }, 0.05).x, 7328);
  assert.deepEqual(cameraAt({ x: 2, y: 2 }, 800, 500), { x: -398, y: -248 });
});
