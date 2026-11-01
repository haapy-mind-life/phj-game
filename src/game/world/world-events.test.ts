import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CAMP,
  LAKE,
  STATIONS,
  WORLD_CALLS,
  canHelp,
  distance,
  diveStep,
  enterLake,
  helpProgress,
  isNearCamp,
  isNearLake,
  leaveLake,
  nextCallIndex,
  routeDirection,
  streetRoute,
  thiefPosition,
} from "./world-events.ts";

test("live-world incidents are placed in the same map and not mini-game instances", () => {
  assert.equal(WORLD_CALLS.length, 4);
  assert.deepEqual(
    new Set(WORLD_CALLS.map((c) => c.kind)),
    new Set(["fire", "ambulance", "police"]),
  );
  assert.equal(new Set(WORLD_CALLS.map((c) => c.id)).size, 4);
  assert.deepEqual(
    WORLD_CALLS.map((c) => c.needed),
    [3, 1, 1, 1],
  );
  for (const call of WORLD_CALLS) {
    assert.ok(call.x > 0 && call.x < 5600 && call.y > 0 && call.y < 1800);
    assert.ok(distance(STATIONS[call.kind], call) > 150);
  }
});
test("rescuing requires correct vehicle, proximity and actual boarding", () => {
  const fire = WORLD_CALLS[0]!;
  assert.ok(canHelp(fire, fire, "fire", true));
  assert.equal(canHelp(fire, fire, "police", true), false);
  assert.equal(canHelp(fire, fire, "fire", false), false);
  assert.equal(canHelp(fire, { x: 1000, y: 800 }, "fire", true), false);
});
test("water spray takes three actions and never overflows", () => {
  const fire = WORLD_CALLS[0]!;
  assert.equal(helpProgress(fire, 0), 1);
  assert.equal(helpProgress(fire, 2), 3);
  assert.equal(helpProgress(fire, 3), 3);
  assert.equal(helpProgress(WORLD_CALLS[1]!, 0), 1);
});
test("reported emergencies repeat in a deterministic cycle", () => {
  assert.deepEqual(
    [nextCallIndex(-1), nextCallIndex(0), nextCallIndex(1), nextCallIndex(2), nextCallIndex(3)],
    [0, 1, 2, 3, 0],
  );
});
test("police chase target walks through known market coordinates", () => {
  assert.notDeepEqual(thiefPosition(0), thiefPosition(1));
  assert.deepEqual(thiefPosition(0), thiefPosition(4));
});
test("navigation has valid waypoints from station to every incident", () => {
  for (const call of WORLD_CALLS) {
    const origin = STATIONS[call.kind];
    const route = streetRoute(origin, call);
    assert.deepEqual(route[0], origin);
    assert.equal(distance(route.at(-1)!, call), 0);
    assert.ok(route.length >= 3);
    assert.ok(route.some((p) => p.y === 850));
  }
  assert.equal(routeDirection({ x: 0, y: 0 }, { x: 100, y: 0 }), "오른쪽 →");
  assert.equal(routeDirection({ x: 0, y: 0 }, { x: -100, y: 0 }), "← 왼쪽");
});
test("diving starts near lake only and exits onto walkable dry ground", () => {
  assert.ok(isNearLake({ x: LAKE.left - 40, y: 850 }));
  assert.equal(isNearLake({ x: 1300, y: 900 }), false);
  const inside = enterLake({ x: LAKE.left - 40, y: 850 });
  assert.ok(inside.x > LAKE.left && inside.x < LAKE.right);
  const swim = diveStep(inside, { x: 1, y: 0 }, 2);
  assert.ok(swim.x <= LAKE.right - 24);
  const out = leaveLake(inside);
  assert.ok(out.x < LAKE.left || out.x > LAKE.right || out.y < LAKE.top || out.y > LAKE.bottom);
});
test("camping is available at the real camp site, not anywhere", () => {
  assert.ok(isNearCamp(CAMP));
  assert.equal(isNearCamp({ x: 20, y: 20 }), false);
});
