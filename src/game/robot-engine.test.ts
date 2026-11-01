import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CARD_USES_TO_UNLOCK,
  MEET_RANGE,
  PRACTICE_RANGE,
  PRACTICE_TARGET,
  ROBOTS,
  robotPosition,
} from "./robot-catalog.ts";
import { applyCardUse, applyRobotFusion, awardRobotMission, emptyRobots, isWatchCardAvailable, meetRobot, normalizeRobots, upgradeRobotGrade } from "./robot-engine.ts";
import { isWalkable, PORTALS, SPAWN } from "./adventure.ts";
import { migrateSave, reduceWorld } from "../lib/world-model.ts";
import { PREMIUM_CARS } from "./world-content.ts";

test("meeting a robot hands over its card once", () => {
  const met = meetRobot(emptyRobots(), "rb-police");
  assert.deepEqual(met.cards, { "rb-police": { uses: 0 } });
  assert.equal(meetRobot(met, "rb-police"), met);
});

test("the 7th card use opens the next robot card exactly once", () => {
  let p = meetRobot(emptyRobots(), "rb-police");
  for (let i = 1; i < CARD_USES_TO_UNLOCK; i++) {
    const r = applyCardUse(p, "rb-police");
    assert.equal(r.unlocked, null);
    p = r.progress;
  }
  assert.equal(p.cards["rb-police"]?.uses, 6);
  const seventh = applyCardUse(p, "rb-police");
  assert.equal(seventh.unlocked, "rb-thunder-police");
  assert.deepEqual(seventh.progress.cards["rb-thunder-police"], { uses: 0 });
  // A full card stays full and never pays the unlock again.
  const again = applyCardUse(seventh.progress, "rb-police");
  assert.equal(again.progress, seventh.progress);
  assert.equal(again.unlocked, null);
});

test("cards cannot be used before meeting the robot", () => {
  const p = emptyRobots();
  assert.equal(applyCardUse(p, "rb-fire").progress, p);
});

test("saved robot progress is cleaned up on load", () => {
  const p = normalizeRobots({
    cards: { "rb-fire": { uses: 99 }, "rb-sky": { uses: -3 }, robot: { uses: 2 }, x: 1 },
  });
  assert.deepEqual(p.cards, {
    "rb-fire": { uses: 7 },
    "rb-sky": { uses: 0 },
    "rb-volcano-fire": { uses: 0 },
  });
  assert.deepEqual(normalizeRobots("bad").cards, {});
});

test("robot actions go through the world reducer and survive a save round trip", () => {
  const premium = PREMIUM_CARS[0].id;
  const v3 = {
    version: 3,
    money: 777,
    ownedCars: ["car-001", "car-021", premium],
    carUpgrades: { "car-021": { engine: true, special: false } },
  };
  let state = migrateSave(v3);
  assert.deepEqual(state.robots.cards, {});
  state = reduceWorld(state, { type: "robot-meet", id: "rb-police" });
  for (let i = 0; i < 9; i++) state = reduceWorld(state, { type: "robot-card", id: "rb-police" });
  assert.equal(reduceWorld(state, { type: "robot-card", id: "rb-police" }), state);
  const reloaded = migrateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(reloaded.robots, state.robots);
  assert.equal(reloaded.robots.cards["rb-police"]?.uses, 7);
  assert.ok(reloaded.robots.cards["rb-thunder-police"]);
  // Existing progress is untouched: same cars, upgrades and money as before robots.
  assert.equal(reloaded.version, 3);
  assert.equal(reloaded.money, 777);
  const before = migrateSave(v3);
  assert.deepEqual(reloaded.ownedCars, before.ownedCars);
  assert.ok(reloaded.ownedCars.includes("car-021"));
  assert.deepEqual(reloaded.carUpgrades, before.carUpgrades);
  assert.equal(reloaded.carUpgrades["car-021"]?.engine, true);
});

test("robots and the practice robot stand on open ground near the start", () => {
  for (const robot of ROBOTS) {
    assert.ok(isWalkable(robot.home), robot.id);
    for (let s = 0; s < 60; s += 3) assert.ok(isWalkable(robotPosition(robot, s)), robot.id);
    assert.ok(Math.hypot(robot.home.x - SPAWN.x, robot.home.y - SPAWN.y) < 600, robot.id);
    for (const gate of PORTALS)
      assert.ok(Math.hypot(gate.x - robot.home.x, gate.y - robot.home.y) > MEET_RANGE + 120);
  }
  assert.ok(isWalkable(PRACTICE_TARGET));
  for (const gate of PORTALS)
    assert.ok(
      Math.hypot(gate.x - PRACTICE_TARGET.x, gate.y - PRACTICE_TARGET.y) > PRACTICE_RANGE,
      gate.id,
    );
});

test("summon watch shows three starter cards without inserting them", () => {
  const p = emptyRobots();
  assert.equal(isWatchCardAvailable(p, "rb-police"), true);
  assert.equal(isWatchCardAvailable(p, "rb-fire"), true);
  assert.equal(isWatchCardAvailable(p, "rb-sky"), true);
  assert.equal(isWatchCardAvailable(p, "rb-thunder-police"), false);
});

test("watch fusion requires two unique unlocked robots and preserves cards", () => {
  const p = meetRobot(emptyRobots(), "rb-police");
  assert.equal(applyRobotFusion(p, ["rb-police"]), p);
  assert.equal(applyRobotFusion(p, ["rb-police", "rb-police"]), p);
  assert.equal(applyRobotFusion(p, ["rb-police", "rb-thunder-police"]), p);
  const two = applyRobotFusion(p, ["rb-police", "rb-fire"]);
  assert.equal(two.fusionBest, 2);
  assert.equal(two.fusionCount, 1);
  assert.ok(two.cards["rb-fire"]);
  const three = applyRobotFusion(two, ["rb-police", "rb-fire", "rb-sky"]);
  assert.equal(three.fusionBest, 3);
  assert.equal(three.fusionCount, 2);
  assert.ok(three.cards["rb-police"]);
});

test("rescue mission rewards once and upgrades without losing saved cards", () => {
  const p = meetRobot(emptyRobots(), "rb-police");
  const once = awardRobotMission(p, "mission-1", "villain");
  assert.equal(once.materials, 3);
  assert.equal(once.wins, 1);
  assert.equal(awardRobotMission(once, "mission-1", "villain"), once);
  const upgraded = upgradeRobotGrade(once);
  assert.equal(upgraded.grade, 1);
  assert.equal(upgraded.materials, 0);
  assert.deepEqual(upgraded.cards, p.cards);
  assert.equal(upgradeRobotGrade(upgraded), upgraded);
  assert.deepEqual(normalizeRobots(upgraded), upgraded);
});

test("new robot watch reducer actions persist through legacy save without affecting cars", () => {
  const original = migrateSave({ version: 3, money: 234, ownedCars: ["car-001", "car-021"] });
  let state = reduceWorld(original, { type: "robot-fuse", ids: ["rb-police"] });
  assert.equal(state, original);
  state = reduceWorld(state, { type: "robot-meet", id: "rb-police" });
  state = reduceWorld(state, { type: "robot-meet", id: "rb-fire" });
  state = reduceWorld(state, { type: "robot-fuse", ids: ["rb-police", "rb-fire"] });
  state = reduceWorld(state, { type: "robot-mission", id: "rescue-42", mode: "rescue" });
  state = reduceWorld(state, { type: "robot-mission", id: "rescue-42", mode: "rescue" });
  assert.equal(state.robots.wins, 1);
  const loaded = migrateSave(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(loaded.robots, state.robots);
  assert.equal(loaded.robots.fusionBest, 2);
  assert.deepEqual(loaded.ownedCars, original.ownedCars);
  assert.equal(loaded.money, original.money);
});
