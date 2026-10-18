import test from "node:test";
import assert from "node:assert/strict";
import { CROPS, migrateSave, reduceWorld } from "./world-model.ts";

test("v1 save migrates into six safe v2 plots", () => {
  const state = migrateSave({
    money: 321,
    bestRun: 44,
    plots: [{ crop: "carrot", water: 2, gold: true }],
  });
  assert.equal(state.version, 3);
  assert.equal(state.money, 321);
  assert.equal(state.bestRun, 44);
  assert.equal(state.plots.length, 6);
  assert.equal(state.plots[0]?.crop, "carrot");
});

test("invalid numeric save values cannot create negative or infinite money", () => {
  assert.equal(migrateSave({ money: -99 }).money, 0);
  assert.equal(migrateSave({ money: Number.POSITIVE_INFINITY }).money, 50);
});

test("starter radish is free and can always start an empty farm", () => {
  const state = migrateSave({ money: 0 });
  const radish = CROPS.find((c) => c.id === "radish")!;
  assert.equal(radish.seedCost, 0);
  const planted = reduceWorld(state, { type: "plant", index: 0, crop: "radish" });
  assert.equal(planted.money, 0);
  assert.equal(planted.plots[0]?.crop, "radish");
});

test("run settlement is idempotent and clear bonus is paid once", () => {
  const start = migrateSave({ money: 0 });
  const once = reduceWorld(start, {
    type: "settle-run",
    id: "run-1",
    score: 1000,
    coins: 10,
    clear: true,
  });
  const twice = reduceWorld(once, {
    type: "settle-run",
    id: "run-1",
    score: 1000,
    coins: 10,
    clear: true,
  });
  assert.equal(once.money, 55);
  assert.equal(once.runs, 1);
  assert.deepEqual(twice, once);
});

test("food truck sales are idempotent and persist without harming old v2 saves", () => {
  const initial = migrateSave({ money: 70, runnerBest: 320, ownedFurniture: ["bed"] });
  assert.deepEqual(initial.settledFoodSales, []);
  const first = reduceWorld(initial, { type: "sell-food", id: "order-1", foodId: "pizza" });
  assert.equal(first.money, 95);
  assert.deepEqual(
    reduceWorld(first, { type: "sell-food", id: "order-1", foodId: "pizza" }),
    first,
  );
  assert.deepEqual(
    reduceWorld(first, { type: "sell-food", id: "order-2", foodId: "invalid" }),
    first,
  );
  const resumed = migrateSave(first);
  assert.equal(resumed.money, 95);
  assert.equal(resumed.runnerBest, 320);
  assert.deepEqual(resumed.settledFoodSales, ["order-1"]);
});
test("undersea rewards are earned once per treasure and survive save migration", () => {
  const initial = migrateSave({ money: 0 });
  const first = reduceWorld(initial, { type: "explore-sea", id: "gold-shell" });
  assert.equal(first.money, 35);
  assert.deepEqual(reduceWorld(first, { type: "explore-sea", id: "gold-shell" }), first);
  assert.deepEqual(reduceWorld(first, { type: "explore-sea", id: "invalid" }), first);
  assert.deepEqual(migrateSave(first).visitedSeaTreasures, ["gold-shell"]);
});

test("house grows from original home using earned coins, never below zero, keeps old records", () => {
  const start = migrateSave({ money: 1000, runnerBest: 120, houseTier: 1 });
  let s = reduceWorld(start, { type: "upgrade-house" });
  assert.equal(s.houseTier, 2);
  assert.equal(s.money, 900);
  s = reduceWorld(s, { type: "upgrade-house" });
  assert.equal(s.houseTier, 3);
  assert.equal(s.money, 550);
  s = reduceWorld(s, { type: "upgrade-house" });
  assert.equal(s.houseTier, 3);
  assert.equal(migrateSave(s).runnerBest, 120);
  assert.equal(migrateSave(s).houseTier, 3);
  const old = migrateSave({ money: 50 });
  assert.equal(old.houseTier, 1);
  assert.equal(reduceWorld(old, { type: "upgrade-house" }).houseTier, 1);
});

test("interior decor costs coins, is capped, clamped, refundable, and survives migration", () => {
  let s = migrateSave({ money: 100 });
  s = reduceWorld(s, { type: "place-decor", id: "pumpkin", x: 99999, y: -5 });
  assert.equal(s.money, 90);
  assert.deepEqual(s.decor[0], { id: "pumpkin", x: 2060, y: 220 });
  assert.equal(
    reduceWorld(migrateSave({ money: 3 }), { type: "place-decor", id: "ghost", x: 500, y: 500 })
      .decor.length,
    0,
  );
  assert.deepEqual(migrateSave(s).decor, s.decor);
  assert.deepEqual(migrateSave({ decor: [{ id: "nope", x: 1, y: 1 }, "x"] }).decor, []);
  s = reduceWorld(s, { type: "remove-decor", index: 0 });
  assert.equal(s.money, 95);
  assert.equal(reduceWorld(s, { type: "remove-decor", index: 4 }), s);
  let full = migrateSave({ money: 9999 });
  for (let i = 0; i < 30; i++)
    full = reduceWorld(full, { type: "place-decor", id: "balloon", x: 300, y: 300 });
  assert.equal(full.decor.length, 24);
});

test("yard decor toggles and halloween party needs decorations, pays candy once and bonus once", () => {
  let s = migrateSave({ money: 200 });
  s = reduceWorld(s, { type: "toggle-yard", id: "lights" });
  assert.deepEqual([s.yard, s.money], [["lights"], 188]);
  s = reduceWorld(s, { type: "toggle-yard", id: "lights" });
  assert.deepEqual([s.yard, s.money], [[], 188]);
  assert.equal(reduceWorld(s, { type: "start-party", now: "2026-10-18T00:00:00Z" }), s);
  for (const id of ["pumpkin", "ghost", "bat"] as const)
    s = reduceWorld(s, { type: "place-decor", id, x: 400, y: 400 });
  s = reduceWorld(s, { type: "start-party", now: "2026-10-18T00:00:00Z" });
  assert.equal(s.halloween.active, true);
  const before = s.money;
  s = reduceWorld(s, { type: "collect-candy", now: "2026-10-18T00:00:00Z", id: "candy-hall" });
  assert.equal(
    reduceWorld(s, { type: "collect-candy", now: "2026-10-18T00:00:00Z", id: "candy-hall" }),
    s,
  );
  assert.equal(
    reduceWorld(s, { type: "collect-candy", now: "2026-10-18T00:00:00Z", id: "bogus" }),
    s,
  );
  for (const id of ["candy-kitchen", "candy-play", "candy-dining", "candy-bed"])
    s = reduceWorld(s, { type: "collect-candy", now: "2026-10-18T00:00:00Z", id });
  assert.equal(s.money, before + 25 + 50);
  assert.deepEqual(s.halloween, { active: false, candy: [], completed: true });
  s = reduceWorld(s, { type: "start-party", now: "2026-10-18T00:00:00Z" });
  const again = s.money;
  for (const c of ["candy-hall", "candy-kitchen", "candy-play", "candy-dining", "candy-bed"])
    s = reduceWorld(s, { type: "collect-candy", now: "2026-10-18T00:00:00Z", id: c });
  assert.equal(s.money, again + 25);
  assert.equal(
    reduceWorld(migrateSave({ money: 5 }), {
      type: "collect-candy",
      now: "2026-10-18T00:00:00Z",
      id: "candy-hall",
    }).money,
    5,
  );
});
