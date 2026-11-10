import test from "node:test";
import assert from "node:assert/strict";
import { migrateSave, reduceWorld } from "./world-model.ts";
import { ARCADE, arcadeReward } from "../game/play/arcade.ts";

const OLD = {
  version: 3,
  money: 3000,
  ownedCars: ["car-001", "car-021"],
  houseTier: 3,
  miniBest: { treasure: 6, fishing: 5, stars: 18, constellation: 4, peanuts: 8 },
  robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
};

test("an old v3 save loads with every arcade best at 0 and keeps everything else", () => {
  const s = migrateSave(OLD);
  assert.equal(s.version, 3);
  for (const g of ARCADE) assert.equal(s.arcadeBest[g.key], 0, g.key);
  assert.deepEqual(s.miniBest, OLD.miniBest);
  assert.equal(s.money, 3000);
  assert.deepEqual(s.ownedCars, OLD.ownedCars);
  assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))), s, "round trip");
});

test("a finished run pays once per session id and keeps the best score", () => {
  const s = migrateSave(OLD);
  const first = reduceWorld(s, { type: "settle-arcade", game: "balloons", id: "b-1", score: 10 });
  assert.equal(first.money, 3000 + arcadeReward("balloons", 10));
  assert.equal(first.arcadeBest.balloons, 10);
  const again = reduceWorld(first, {
    type: "settle-arcade",
    game: "balloons",
    id: "b-1",
    score: 10,
  });
  assert.equal(again, first, "same session pays nothing twice");
  const lower = reduceWorld(first, {
    type: "settle-arcade",
    game: "balloons",
    id: "b-2",
    score: 3,
  });
  assert.equal(lower.arcadeBest.balloons, 10, "best stays");
  assert.equal(lower.money, first.money + arcadeReward("balloons", 3));
});

test("unknown games, empty or huge ids and broken scores are refused", () => {
  const s = migrateSave(OLD);
  const bad = [
    { game: "peanuts", id: "x", score: 3 },
    { game: "nope", id: "x", score: 3 },
    { game: "coins", id: "", score: 3 },
    { game: "coins", id: "x".repeat(200), score: 3 },
    { game: "coins", id: "x", score: Number.NaN },
    { game: "coins", id: "x", score: -1 },
  ];
  for (const b of bad)
    assert.equal(reduceWorld(s, { type: "settle-arcade", ...b } as never), s, JSON.stringify(b));
});

test("a score above the goal is paid and recorded as the goal", () => {
  const s = migrateSave(OLD);
  const out = reduceWorld(s, { type: "settle-arcade", game: "dodge", id: "d", score: 999 });
  assert.equal(out.arcadeBest.dodge, 20);
  assert.equal(out.money, 3000 + arcadeReward("dodge", 20));
});
