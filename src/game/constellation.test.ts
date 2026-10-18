import { test } from "node:test";
import assert from "node:assert/strict";
import { DOTS, traceNext } from "./constellation.ts";
import { VILLAGES } from "./villages.ts";
import { isWalkable, MAP } from "./adventure.ts";
test("constellation requires stars in order and stops at six", () => {
  assert.equal(traceNext(0, DOTS[1]!), 0);
  let n = 0;
  for (const dot of DOTS) n = traceNext(n, dot);
  assert.equal(n, 6);
  assert.equal(traceNext(n, DOTS[0]!), 6);
});
test("thirty distinct villages and friends stand on reachable ground", () => {
  assert.equal(VILLAGES.length, 30);
  assert.equal(new Set(VILLAGES.map((v) => v.name)).size, 30);
  for (const v of VILLAGES) {
    assert.ok(isWalkable(v), v.name);
    assert.ok(v.x > 0 && v.x < MAP.width && v.y > 0 && v.y < MAP.height);
  }
});
