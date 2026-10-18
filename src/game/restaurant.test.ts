import { test } from "node:test";
import assert from "node:assert/strict";
import { stepRestaurant, canWalkRestaurant } from "./restaurant.ts";
import { RESTAURANT_ROOM as ROOM } from "./world-content.ts";
test("restaurant furniture blocks movement while order, customer, table and exit remain accessible", () => {
  assert.equal(canWalkRestaurant({ x: 430, y: 400 }), false);
  assert.equal(canWalkRestaurant({ x: 1070, y: 700 }), false);
  assert.deepEqual(stepRestaurant({ x: 430, y: 470 }, { x: 0, y: -1 }, 0.05), { x: 430, y: 470 });
  const seen = new Set<string>(),
    q = [ROOM.entry];
  for (let i = 0; i < q.length; i++)
    for (const d of [
      { x: 20, y: 0 },
      { x: -20, y: 0 },
      { x: 0, y: 20 },
      { x: 0, y: -20 },
    ]) {
      const p = { x: q[i]!.x + d.x, y: q[i]!.y + d.y },
        key = `${p.x},${p.y}`;
      if (!seen.has(key) && canWalkRestaurant(p)) {
        seen.add(key);
        q.push(p);
      }
    }
  for (const [point, range] of [
    [ROOM.counter, 260],
    [ROOM.customer, 230],
    [ROOM.table, 300],
    [ROOM.exit, 110],
  ] as const)
    assert.ok(q.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < range));
});
