import { test } from "node:test";
import assert from "node:assert/strict";
import { isWalkable, BLOCKS, PORTALS } from "./adventure.ts";
import { NEW_VILLAGES, RESTAURANTS } from "./world-content.ts";

// Original world rules: performance changes must preserve every boundary and doorway.
function original(p: { x: number; y: number }) {
  if (p.x > 7328 && p.x < 10238) return false;
  if (
    NEW_VILLAGES.some((v) =>
      [-330, 330].some((dx) => {
        const x = v.x + dx,
          y = v.y - 260;
        if (RESTAURANTS.some((r) => Math.hypot(r.x - x, r.y - y) < 250)) return false;
        return Math.abs(p.x - x) < 108 && p.y > y - 98 && p.y < y + 78;
      }),
    )
  )
    return false;
  if (
    RESTAURANTS.some(
      (r) => r.id !== "korean" && Math.abs(p.x - r.x) < 150 && p.y > r.y - 200 && p.y < r.y - 25,
    )
  )
    return false;
  return !BLOCKS.some(
    (b) => p.x > b.x - 18 && p.x < b.x + b.w + 18 && p.y > b.y - 18 && p.y < b.y + b.h + 18,
  );
}
test("cached collision geometry preserves world, building edges and entrances", () => {
  const points: { x: number; y: number }[] = [...PORTALS];
  for (let i = 0; i < 4000; i++) points.push({ x: (i * 4793) % 20400, y: (i * 3571) % 10800 });
  for (const v of NEW_VILLAGES)
    for (const dx of [-330, 330])
      for (const offset of [-108.01, -108, -107.99, 0, 107.99, 108, 108.01])
        for (const dy of [-98.01, -98, -97.99, 0, 77.99, 78, 78.01])
          points.push({ x: v.x + dx + offset, y: v.y - 260 + dy });
  for (const p of points) assert.equal(isWalkable(p), original(p), JSON.stringify(p));
});
