import { test } from "node:test";
import assert from "node:assert/strict";
import { MAP, stepPlayer } from "./adventure.ts";
import {
  COAST,
  OCEAN,
  HOUSE_TIERS,
  nearWorld,
  stepSubmarine,
  OCEAN_DISCOVERIES,
} from "./unified-world.ts";
test("old village and new coast share same continuous map", () => {
  assert.equal(MAP.width, 20400);
  assert.ok(COAST.truck.x > 5600 && COAST.truck.x < OCEAN.start);
  const next = stepPlayer({ x: 5570, y: 950 }, { x: 1, y: 0 }, 0.05);
  assert.ok(next.x > 5570);
  assert.equal(stepPlayer({ x: 24, y: 950 }, { x: -1, y: 0 }, 0.05).x, 11.75);
});
test("sea is real wide area with submarine constrained to ocean", () => {
  assert.ok(OCEAN.end - OCEAN.start > 2500);
  assert.equal(stepSubmarine({ x: OCEAN.end, y: 100 }, { x: 1, y: 0 }, 1).x, OCEAN.end);
  assert.equal(
    stepSubmarine({ x: OCEAN.start + 50, y: 100 }, { x: -1, y: 0 }, 1).x,
    OCEAN.start + 38,
  );
  for (const d of OCEAN_DISCOVERIES) assert.ok(d.x > OCEAN.start && d.x < OCEAN.end);
});
test("house upgrades have stable monotone progression", () => {
  assert.deepEqual(
    HOUSE_TIERS.map((t) => t.cost),
    [0, 100, 350, 850, 1500],
  );
  assert.ok(nearWorld(COAST.truck, COAST.truck));
});
import { AIRPORT, RUNWAY, canLandPlane, onRunway, stepPlane } from "./unified-world.ts";
test("airplane: runway is on land and plane flies over the whole map", () => {
  assert.ok(onRunway(AIRPORT));
  assert.ok(RUNWAY.x2 < OCEAN.start - 300);
  let p = { x: AIRPORT.x, y: AIRPORT.y };
  for (let i = 0; i < 400; i++) p = stepPlane(p, { x: 1, y: 0 }, 0.05);
  assert.ok(p.x > OCEAN.start + 500 && p.x <= MAP.width - 40);
  for (let i = 0; i < 800; i++) p = stepPlane(p, { x: -1, y: -1 }, 0.05);
  assert.ok(p.x >= 0 && p.x < MAP.width && p.y >= 0 && p.y < MAP.height);
  const crossed = stepPlane({ x: 1, y: 1 }, { x: -1, y: -1 }, 0.05);
  assert.ok(crossed.x > MAP.width - 30 && crossed.y > MAP.height - 30);
});
test("airplane: lands only on land or runway, never on the sea", () => {
  assert.ok(canLandPlane(AIRPORT));
  assert.ok(canLandPlane({ x: 3000, y: 1600 }));
  assert.ok(!canLandPlane({ x: OCEAN.start + 100, y: 900 }));
  assert.ok(!canLandPlane({ x: 9000, y: 900 }));
  assert.ok(!canLandPlane({ x: 2000, y: 800 }));
});
