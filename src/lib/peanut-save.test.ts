import test from "node:test";
import assert from "node:assert/strict";
import { migrateSave, reduceWorld } from "./world-model.ts";
test("old version-3 assets and mini records survive with a default peanut record", () => {
  const before = migrateSave({
    version: 3,
    money: 3000,
    ownedCars: ["car-001", "car-021"],
    houseTier: 3,
    runnerBest: 700,
    miniBest: { treasure: 6, fishing: 5, stars: 18, constellation: 4 },
    robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
  });
  assert.equal(before.miniBest.peanuts, 0);
  const after = reduceWorld(before, {
    type: "settle-mini",
    game: "peanuts",
    id: "peanut-complete",
    score: 8,
  });
  assert.ok(after.money > before.money);
  assert.equal(after.version, 3);
  assert.deepEqual(after.ownedCars, before.ownedCars);
  assert.deepEqual(after.robots, before.robots);
  assert.deepEqual(after.plots, before.plots);
  assert.equal(after.houseTier, before.houseTier);
  assert.equal(after.runnerBest, before.runnerBest);
  assert.deepEqual(after.miniBest, { ...before.miniBest, peanuts: 8 });
  assert.deepEqual(migrateSave(after), after);
  assert.equal(
    reduceWorld(after, { type: "settle-mini", game: "peanuts", id: "peanut-complete", score: 8 }),
    after,
  );
});
test("partial results use existing rewards, preserve best, cap scores and reject invalid scores", () => {
  const before = migrateSave(null);
  const partial = reduceWorld(before, { type: "settle-mini", game: "peanuts", id: "p1", score: 2 });
  assert.equal(partial.money - before.money, 8);
  assert.equal(partial.miniBest.peanuts, 2);
  assert.equal(
    reduceWorld(partial, { type: "settle-mini", game: "peanuts", id: "p2", score: 1 }).miniBest
      .peanuts,
    2,
  );
  assert.equal(
    reduceWorld(partial, { type: "settle-mini", game: "peanuts", id: "p3", score: 100 }).miniBest
      .peanuts,
    8,
  );
  for (const score of [NaN, Infinity, -1])
    assert.equal(
      reduceWorld(partial, { type: "settle-mini", game: "peanuts", id: "invalid", score }),
      partial,
    );
});
