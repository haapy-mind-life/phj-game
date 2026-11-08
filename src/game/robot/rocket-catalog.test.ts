import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_ROBOTS,
  DUO_IDS,
  FEATURED_MAIN,
  LEGENDS,
  ROBOTS,
  isDuoId,
  isRobotId,
  isRocketPair,
  isRosterId,
  robotById,
} from "./robot-catalog.ts";
import {
  emptyRobots,
  isWatchCardAvailable,
  meetRobot,
  normalizeRobots,
  recordFusion,
  validFusion,
} from "./robot-engine.ts";
import { ARMY } from "./robot-army.ts";

// docs/robot-fusion/2026-11-08-rocket-dual-v1 — S01: two new robots, nothing else moves.

test("RD-AT-01 Rocket and Rocket X are two different robots with their own looks", () => {
  assert.deepEqual([...DUO_IDS], ["rb-rocket", "rb-rocket-x"]);
  const rocket = robotById("rb-rocket");
  const x = robotById("rb-rocket-x");
  assert.equal(rocket.name, "로켓");
  assert.equal(x.name, "로켓 X");
  assert.notEqual(rocket.color, x.color);
  assert.notEqual(rocket.accent, x.accent);
  for (const r of [rocket, x]) {
    assert.ok(isRobotId(r.id) && isDuoId(r.id), r.id);
    assert.equal(isRosterId(r.id), false, "the rockets are not Tira or Emblus");
    assert.equal(r.legendary, undefined);
    assert.equal(r.starter, true, "Q-03: in the watch from the start");
  }
});

test("the catalog grows by exactly the two rockets: 8+2 regular, 6 legends, 16 in all", () => {
  assert.equal(ROBOTS.length, 10);
  assert.equal(LEGENDS.length, 6);
  assert.equal(ALL_ROBOTS.length, 16);
  assert.equal(new Set(ALL_ROBOTS.map((r) => r.id)).size, 16);
});

test("RD-AT-17 the featured six and legends stay as they were", () => {
  assert.deepEqual(
    [...FEATURED_MAIN],
    ["rb-tira", "rb-emblus", "rb-police", "rb-fire", "rb-sky", "rb-thunder-police"],
  );
  for (const id of DUO_IDS) assert.equal(FEATURED_MAIN.includes(id), false, id);
});

test("RD-AT-16 the hundred-robot army does not take in the rockets (Q-07)", () => {
  assert.equal(ARMY.length, 100);
  assert.equal(
    ARMY.some((r) => isDuoId(r.species)),
    false,
  );
});

test("isRocketPair is exactly Rocket + Rocket X, in either order", () => {
  assert.ok(isRocketPair(["rb-rocket", "rb-rocket-x"]));
  assert.ok(isRocketPair(["rb-rocket-x", "rb-rocket"]));
  assert.equal(isRocketPair(["rb-rocket", "rb-rocket"]), false);
  assert.equal(isRocketPair(["rb-rocket"]), false);
  assert.equal(isRocketPair(["rb-rocket", "rb-tira"]), false);
  assert.equal(isRocketPair(["rb-rocket", "rb-rocket-x", "rb-police"]), false);
});

test("RD-AT-15 an old v3 save keeps its cards, and the rockets are free to use without a card", () => {
  const old = normalizeRobots({
    cards: { "rb-police": { uses: 3, grade: 1 }, "rb-tira": { uses: 2, grade: 0 } },
    parts: 4,
    fusionCount: 2,
  });
  assert.deepEqual(old.cards["rb-police"], { uses: 3, grade: 1 });
  assert.deepEqual(old.cards["rb-tira"], { uses: 2, grade: 0 });
  assert.equal(old.cards["rb-rocket"], undefined);
  assert.equal(old.cards["rb-rocket-x"], undefined);
  assert.ok(isWatchCardAvailable(old, "rb-rocket") && isWatchCardAvailable(old, "rb-rocket-x"));
  assert.deepEqual(meetRobot(old, "rb-rocket").cards["rb-rocket"], { uses: 0, grade: 0 });
});

test("the old draft watch's shared grade is not handed to the rockets", () => {
  const out = normalizeRobots({ grade: 2, cards: {} });
  assert.equal(out.cards["rb-police"]?.grade, 2, "existing starters keep the old behaviour");
  assert.equal(out.cards["rb-rocket"], undefined);
  assert.equal(out.cards["rb-rocket-x"], undefined);
});

test("a saved rocket card survives a save round trip; broken values are cleaned", () => {
  const out = normalizeRobots({
    cards: { "rb-rocket": { uses: 5, grade: 1 }, "rb-rocket-x": { uses: "x", grade: -3 } },
  });
  assert.deepEqual(normalizeRobots(JSON.parse(JSON.stringify(out))), out);
  assert.deepEqual(out.cards["rb-rocket"], { uses: 5, grade: 1 });
  assert.deepEqual(out.cards["rb-rocket-x"], { uses: 0, grade: 0 });
});

test("until the dual fusion lands (S05), the regular fusion refuses every rocket", () => {
  const p = emptyRobots();
  assert.equal(validFusion(p, ["rb-rocket", "rb-rocket-x"]), false);
  assert.equal(validFusion(p, ["rb-rocket", "rb-police"]), false);
  assert.equal(validFusion(p, ["rb-police", "rb-fire", "rb-rocket-x"]), false);
  assert.equal(recordFusion(p, ["rb-rocket", "rb-rocket-x"]), p);
  assert.ok(validFusion(p, ["rb-police", "rb-fire"]), "regular fusions still work");
  assert.ok(validFusion(p, ["rb-tira", "rb-emblus"]), "Tira + Emblus still works");
});
