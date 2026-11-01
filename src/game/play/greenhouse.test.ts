import test from "node:test";
import assert from "node:assert/strict";
import {
  GREENHOUSE_BEDS,
  GREENHOUSE_SPAWN,
  greenhouseWalkable,
  stepGreenhouse,
  canCareGreenhouse,
  greenhouseAction,
  nearGreenhouseDoor,
} from "./greenhouse.ts";
import { migrateSave, reduceWorld } from "../../lib/world-model.ts";
test("greenhouse aisles connect the entrance to all six beds, without entering crops", () => {
  const seen = new Set<string>(),
    queue = [GREENHOUSE_SPAWN];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]!;
    if (seen.has(`${p.x},${p.y}`)) continue;
    seen.add(`${p.x},${p.y}`);
    for (const d of [
      { x: 10, y: 0 },
      { x: -10, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: -10 },
    ]) {
      const next = { x: p.x + d.x, y: p.y + d.y };
      if (greenhouseWalkable(next) && !seen.has(`${next.x},${next.y}`)) queue.push(next);
    }
  }
  for (let i = 0; i < 6; i++)
    assert.ok(
      queue.some((p) => canCareGreenhouse(p, i)),
      `bed ${i} unreachable`,
    );
  assert.ok(nearGreenhouseDoor(GREENHOUSE_SPAWN));
  assert.ok(GREENHOUSE_BEDS.every((b) => !greenhouseWalkable(b)));
  let p = { ...GREENHOUSE_SPAWN };
  for (let i = 0; i < 100; i++) p = stepGreenhouse(p, { x: 0, y: -1 }, 0.05);
  assert.ok(p.y >= 367 && p.y < 390);
  assert.ok(canCareGreenhouse(p, 4));
  assert.equal(canCareGreenhouse(GREENHOUSE_SPAWN, 4), false);
  assert.equal(canCareGreenhouse(p, 1.5), false);
});
test("movement caps long frames and ignores invalid deltas without teleporting", () => {
  const p = GREENHOUSE_SPAWN;
  for (const seconds of [0, -1, NaN, Infinity])
    assert.equal(stepGreenhouse(p, { x: 1, y: 0 }, seconds), p);
  assert.equal(stepGreenhouse(p, { x: NaN, y: 0 }, 0.05), p);
  assert.ok(Math.abs(stepGreenhouse(p, { x: 10, y: 0 }, 100).x - p.x) <= 9);
});
test("distance gates every crop action and reuses legacy plots and one harvest reward", () => {
  const before = migrateSave({
    version: 3,
    money: 3000,
    harvests: 4,
    ownedCars: ["car-001", "car-021"],
    houseTier: 3,
    miniBest: { peanuts: 8 },
    plots: [
      { crop: "carrot", water: 3, gold: true },
      { crop: "radish", water: 1, gold: false },
    ],
  });
  assert.equal(greenhouseAction(GREENHOUSE_SPAWN, 0, before.plots, "radish", before.money), null);
  const at0 = { x: 120, y: 220 };
  const harvest = greenhouseAction(at0, 0, before.plots, "radish", before.money)!;
  assert.equal(harvest.type, "harvest");
  const after = reduceWorld(before, harvest);
  assert.ok(after.money > before.money);
  assert.equal(after.harvests, 5);
  assert.deepEqual(after.plots[1], before.plots[1]);
  for (const key of [
    "version",
    "ownedCars",
    "houseTier",
    "miniBest",
    "robots",
    "runnerBest",
  ] as const)
    assert.deepEqual(after[key], before[key]);
  assert.deepEqual(migrateSave(after), after);
  assert.equal(reduceWorld(after, harvest), after);
  assert.equal(greenhouseAction(at0, 0, after.plots, "sunflower", 0), null);
  const plant = greenhouseAction(at0, 0, after.plots, "radish", 0)!;
  const planted = reduceWorld(after, plant);
  assert.deepEqual(planted.plots[0], { crop: "radish", water: 0, gold: false });
  const water = greenhouseAction(at0, 0, planted.plots, "radish", planted.money)!;
  assert.equal(water.type, "water");
  assert.equal(reduceWorld(planted, water).plots[0]!.water, 1);
});
