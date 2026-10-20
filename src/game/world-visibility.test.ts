import { test } from "node:test";
import assert from "node:assert/strict";
import { worldRectVisible } from "./world-space.ts";
const coast = { x: 5500, y: -250, width: 5000, height: 2300 };
test("offscreen coast animation is skipped while its approach and harbour stay visible", () => {
  assert.equal(worldRectVisible({ x: 1350, y: 920 }, 390, 640, coast), false);
  assert.equal(worldRectVisible({ x: 5400, y: 920 }, 390, 640, coast), true);
  assert.equal(worldRectVisible({ x: 7140, y: 1010 }, 390, 640, coast), true);
  assert.equal(worldRectVisible({ x: 6500, y: 4000 }, 390, 640, coast), false);
});
test("visibility includes wrapped edges and rectangular corners", () => {
  const box = { x: 0, y: 0, width: 200, height: 200 };
  assert.equal(worldRectVisible({ x: 20390, y: 10790 }, 390, 640, box), true);
  assert.equal(worldRectVisible({ x: 400, y: 400 }, 400, 400, box), true);
  assert.equal(worldRectVisible({ x: 401, y: 401 }, 400, 400, box), false);
});
