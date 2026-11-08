import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMY, ARMY_SIZE, LEGEND_SQUADS, ROSTER_SLOTS, SQUADS, SQUAD_SIZE } from "./robot-army.ts";
import {
  ALL_ROBOTS,
  FEATURED_MAIN,
  LEGENDS,
  MAX_FUSION,
  ROBOTS,
  ROBOT_IDS,
  isRobotId,
  type RobotSpeciesId,
} from "./robot-catalog.ts";
import {
  emptyRobots,
  fusionOrder,
  isSpecialFusion,
  isWatchCardAvailable,
  meetRobot,
  normalizeRobots,
  recordFusion,
  teamWeapon,
  validFusion,
} from "./robot-engine.ts";
import { armyResult } from "./robot-engine.ts";
import { migrateSave, reduceWorld } from "../../lib/world-model.ts";

const OLD_12 = [
  "rb-police",
  "rb-fire",
  "rb-sky",
  "rb-thunder-police",
  "rb-volcano-fire",
  "rb-laser-sky",
  "lg-shield",
  "lg-wing",
  "lg-deep",
  "lg-steel",
  "lg-thunder",
  "lg-guardian",
];
/** The army exactly as it was before Tira and Emblus (main@37199ae). */
const OLD_REGULAR = OLD_12.slice(0, 6);
const oldSpecies = (s: number, slot: number) => {
  const legend = Object.entries(LEGEND_SQUADS).find(([, at]) => at === s && slot === 0);
  return legend ? legend[0] : OLD_REGULAR[(s * 2 + slot) % OLD_REGULAR.length]!;
};

test("AC-01 the army is exactly 100 robots with 100 different ids", () => {
  assert.equal(ARMY_SIZE, 100);
  assert.equal(ARMY.length, 100);
  assert.equal(new Set(ARMY.map((r) => r.instanceId)).size, 100);
});

test("AC-02 only the two roster slots differ from the old army; no squad leader changed", () => {
  const changed: string[] = [];
  SQUADS.forEach((_, s) => {
    for (let slot = 0; slot < SQUAD_SIZE; slot++) {
      const n = s * SQUAD_SIZE + slot;
      const robot = ARMY[n]!;
      assert.equal(robot.instanceId, `army-${String(n + 1).padStart(3, "0")}`);
      assert.equal(robot.slot, slot);
      if (robot.species === oldSpecies(s, slot)) continue;
      changed.push(robot.instanceId);
      assert.notEqual(slot, 0, "a squad leader changed");
    }
  });
  assert.deepEqual(changed.sort(), ["army-008", "army-010"]);
  assert.equal(ARMY.filter((r) => r.species === "rb-tira").length, 1);
  assert.equal(ARMY.filter((r) => r.species === "rb-emblus").length, 1);
  assert.equal(ROSTER_SLOTS["army-008"], "rb-emblus");
  assert.equal(ROSTER_SLOTS["army-010"], "rb-tira");
});

test("AC-03 the featured list is 6 robots including Tira and Emblus", () => {
  assert.equal(FEATURED_MAIN.length, 6);
  assert.equal(new Set(FEATURED_MAIN).size, 6);
  for (const id of ["rb-tira", "rb-emblus"] as const) assert.ok(FEATURED_MAIN.includes(id));
  for (const id of FEATURED_MAIN) assert.ok(ROBOTS.some((r) => r.id === id));
});

test("AC-04 the six legends are unchanged", () => {
  assert.deepEqual(
    LEGENDS.map((l) => l.id),
    ["lg-shield", "lg-wing", "lg-deep", "lg-steel", "lg-thunder", "lg-guardian"],
  );
});

test("AC-05 the old 12 ids plus Tira, Emblus and the two rockets make 16 different species", () => {
  assert.equal(ALL_ROBOTS.length, 16);
  assert.equal(new Set(ROBOT_IDS).size, 16);
  for (const id of OLD_12) assert.ok(isRobotId(id), id);
  assert.ok(isRobotId("rb-tira") && isRobotId("rb-emblus"));
  assert.ok(isRobotId("rb-rocket") && isRobotId("rb-rocket-x"));
});

test("AC-06 an old save with all 12 cards keeps every use, grade and count", () => {
  const cards = Object.fromEntries(
    OLD_12.map((id, i) => [id, { uses: i % 8, grade: i % 8 === 7 ? 2 : i % 3 }]),
  );
  const save = {
    cards,
    parts: 17,
    wins: 3,
    rescues: 4,
    catches: 5,
    fusionBest: 3,
    fusionCount: 9,
    massFusions: 2,
    bossWins: 1,
    minionWaves: 6,
  };
  const out = normalizeRobots(save);
  for (const id of OLD_12) assert.deepEqual(out.cards[id as RobotSpeciesId], cards[id], id);
  assert.equal(out.cards["rb-tira"], undefined);
  assert.equal(out.cures, 0);
  for (const k of ["parts", "wins", "rescues", "catches", "fusionCount", "massFusions"] as const)
    assert.equal(out[k], save[k], k);
});

test("the old draft watch's shared grade is not handed to Tira and Emblus", () => {
  const out = normalizeRobots({ grade: 2, cards: {} });
  assert.equal(out.cards["rb-police"]?.grade, 2);
  assert.equal(out.cards["rb-tira"], undefined);
  assert.equal(out.cards["rb-emblus"], undefined);
});

test("Tira and Emblus are in the watch from the start, also for old saves", () => {
  const old = normalizeRobots({ cards: { "rb-police": { uses: 3, grade: 1 } } });
  assert.ok(isWatchCardAvailable(old, "rb-tira") && isWatchCardAvailable(old, "rb-emblus"));
  const met = meetRobot(old, "rb-tira");
  assert.deepEqual(met.cards["rb-tira"], { uses: 0, grade: 0 });
  assert.deepEqual(met.cards["rb-police"], { uses: 3, grade: 1 });
});

test("AC-07 an unknown or locked robot is refused and the save stays the same", () => {
  const p = emptyRobots();
  assert.equal(meetRobot(p, "rb-thunder-police"), p);
  assert.equal(meetRobot(p, "lg-wing"), p);
  assert.equal(isRobotId("rb-nobody"), false);
  const unknown = normalizeRobots({ cards: { "rb-nobody": { uses: 2 } } });
  assert.deepEqual(unknown.cards, {});
});

test("AC-17 Tira and Emblus fuse only with each other, in either order", () => {
  const p = emptyRobots();
  assert.ok(validFusion(p, ["rb-tira", "rb-emblus"]));
  assert.ok(validFusion(p, ["rb-emblus", "rb-tira"]));
  assert.deepEqual(fusionOrder(["rb-tira", "rb-emblus"]), ["rb-emblus", "rb-tira"]);
  assert.deepEqual(fusionOrder(["rb-fire", "rb-sky"]), ["rb-fire", "rb-sky"]);
  assert.equal(validFusion(p, ["rb-tira", "rb-police"]), false);
  assert.equal(validFusion(p, ["rb-police", "rb-emblus"]), false);
  assert.equal(validFusion(p, ["rb-tira", "rb-emblus", "rb-fire"]), false);
  assert.ok(validFusion(p, ["rb-police", "rb-fire", "rb-sky"]));
  assert.equal(isSpecialFusion(["rb-tira", "rb-fire"]), false);
  assert.equal(MAX_FUSION, 3);
});

test("the special fusion fights with the antidote sword, whichever order", () => {
  const a = teamWeapon(["rb-emblus", "rb-tira"]);
  assert.equal(a.name, "해독 칼");
  assert.equal(a.kind, "antidote");
  assert.deepEqual(teamWeapon(["rb-tira", "rb-emblus"]), a);
  assert.equal(teamWeapon(["rb-tira"]).kind, "sword");
  assert.equal(teamWeapon(["rb-emblus"]).kind, "antidote");
});

test("AC-18 a special fusion keeps cards and counts it once per fusion", () => {
  const before = normalizeRobots({
    cards: { "rb-tira": { uses: 2, grade: 0 }, "rb-fire": { uses: 7, grade: 1 } },
  });
  const after = recordFusion(before, ["rb-emblus", "rb-tira"]);
  assert.deepEqual(after.cards["rb-tira"], { uses: 2, grade: 0 });
  assert.deepEqual(after.cards["rb-fire"], { uses: 7, grade: 1 });
  assert.equal(after.fusionCount, 1);
  assert.equal(after.fusionBest, 2);
  const mass = armyResult(after, "massFusions", 1);
  assert.equal(mass.massFusions, 1);
  assert.deepEqual(mass.cards, after.cards);
});

test("AC-22 a version 3 save keeps cars, coins and robots; a cure is saved once", () => {
  const save = migrateSave({
    version: 3,
    money: 4321,
    ownedCars: ["car-001", "car-021"],
    robots: { cards: { "rb-police": { uses: 7, grade: 1 } }, parts: 5, massFusions: 2 },
  });
  assert.equal(save.version, 3);
  assert.equal(save.money, 4321);
  assert.ok(save.ownedCars.includes("car-021"));
  assert.deepEqual(save.robots.cards["rb-police"], { uses: 7, grade: 1 });
  assert.equal(save.robots.massFusions, 2);
  assert.equal(save.robots.cures, 0);
  const cured = reduceWorld(save, { type: "robot-mission", mode: "cure", n: 1 });
  assert.equal(cured.robots.cures, 1);
  assert.equal(cured.robots.parts, 7);
  assert.equal(reduceWorld(cured, { type: "robot-mission", mode: "cure", n: 1 }), cured);
  assert.equal(migrateSave(JSON.parse(JSON.stringify(cured))).robots.cures, 1);
});
