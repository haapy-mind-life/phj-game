import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CARD_USES_TO_UNLOCK,
  BATTLE_RANGE,
  MEET_RANGE,
  ROBOTS,
  UPGRADE_COST,
  VILLAIN_RESPAWN_MS,
  VILLAIN_SPOT,
  WIN_PARTS,
  WORKSHOP,
  WORKSHOP_RANGE,
  robotPosition,
} from "./robot-catalog.ts";
import {
  applyCardUse,
  emptyRobots,
  freshVillain,
  fusionTeam,
  hitVillain,
  maxFusion,
  meetRobot,
  normalizeRobots,
  teamPower,
  upgradeRobot,
  villainMaxHp,
  winBattle,
} from "./robot-engine.ts";
import { isWalkable, PORTALS, SPAWN } from "./adventure.ts";
import { migrateSave, reduceWorld } from "../lib/world-model.ts";
import { PREMIUM_CARS } from "./world-content.ts";
import { DELIVERY_GARAGE } from "./place-play.ts";
import { STATIONS } from "./world-events.ts";

test("meeting a robot hands over its card once", () => {
  const met = meetRobot(emptyRobots(), "rb-police");
  assert.deepEqual(met.cards, { "rb-police": { uses: 0, grade: 0 } });
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
  assert.deepEqual(seventh.progress.cards["rb-thunder-police"], { uses: 0, grade: 0 });
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
    cards: {
      "rb-fire": { uses: 99, grade: 9 },
      "rb-sky": { uses: -3 },
      robot: { uses: 2 },
      x: 1,
    },
    parts: -4,
    wins: 2.7,
  });
  assert.deepEqual(p.cards, {
    "rb-fire": { uses: 7, grade: 1 },
    "rb-sky": { uses: 0, grade: 0 },
    "rb-volcano-fire": { uses: 0, grade: 0 },
  });
  assert.equal(p.parts, 0);
  assert.equal(p.wins, 2);
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
  state = reduceWorld(state, { type: "robot-win", win: 1 });
  state = reduceWorld(state, { type: "robot-win", win: 2 });
  state = reduceWorld(state, { type: "robot-upgrade", id: "rb-police" });
  assert.equal(state.robots.cards["rb-police"]?.grade, 1);
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

test("a villain win pays parts once, and upgrades never cost a robot", () => {
  let p = meetRobot(emptyRobots(), "rb-fire");
  p = winBattle(p, 1);
  assert.equal(p.parts, WIN_PARTS);
  assert.equal(winBattle(p, 1), p);
  assert.equal(winBattle(p, 3), p);
  // Not enough parts: nothing changes and nothing is lost.
  assert.equal(upgradeRobot(p, "rb-fire"), p);
  p = winBattle(p, 2);
  const up = upgradeRobot(p, "rb-fire");
  assert.equal(up.cards["rb-fire"]?.grade, 1);
  assert.equal(up.parts, 2 * WIN_PARTS - UPGRADE_COST);
  // Phase 1 stops at 강화, and robots you don't own can't be upgraded.
  assert.equal(upgradeRobot(winBattle(winBattle(up, 3), 4), "rb-fire").cards["rb-fire"]?.grade, 1);
  assert.equal(upgradeRobot(up, "rb-sky"), up);
});

test("fusion joins owned robots behind the ridden one and adds their power", () => {
  let p = meetRobot(emptyRobots(), "rb-sky");
  assert.equal(maxFusion(p), 1);
  assert.deepEqual(fusionTeam(p, "rb-sky", 3), ["rb-sky"]);
  p = meetRobot(meetRobot(meetRobot(p, "rb-police"), "rb-fire"), "rb-thunder-police");
  assert.equal(maxFusion(p), 3);
  assert.deepEqual(fusionTeam(p, "rb-sky", 2), ["rb-sky", "rb-police"]);
  assert.deepEqual(fusionTeam(p, "rb-sky", 3), ["rb-sky", "rb-police", "rb-fire"]);
  assert.equal(fusionTeam(p, "rb-sky", 9).length, 3);
  assert.equal(teamPower(p, ["rb-sky"]), 1);
  assert.equal(teamPower(p, fusionTeam(p, "rb-sky", 3)), 3);
});

test("villains get tougher, retreat when switched off, and come back", () => {
  assert.ok(villainMaxHp(5) > villainMaxHp(0));
  assert.equal(villainMaxHp(1000), 30);
  let v = freshVillain(0);
  let r = hitVillain(v, 1, 0);
  assert.equal(r.villain.hp, v.max - 1);
  assert.equal(r.defeated, false);
  r = hitVillain(r.villain, 99, 5000);
  assert.equal(r.defeated, true);
  assert.equal(r.villain.retreating, true);
  assert.equal(r.villain.back, 5000 + VILLAIN_RESPAWN_MS);
  // A retreating villain can't be beaten twice.
  v = r.villain;
  assert.deepEqual(hitVillain(v, 5, 6000), { villain: v, defeated: false });
});

test("robots, the villain and the workshop stand on open ground near the start", () => {
  for (const robot of ROBOTS) {
    assert.ok(isWalkable(robot.home), robot.id);
    for (let s = 0; s < 60; s += 3) assert.ok(isWalkable(robotPosition(robot, s)), robot.id);
    assert.ok(Math.hypot(robot.home.x - SPAWN.x, robot.home.y - SPAWN.y) < 600, robot.id);
    for (const gate of PORTALS)
      assert.ok(Math.hypot(gate.x - robot.home.x, gate.y - robot.home.y) > MEET_RANGE + 120);
  }
  for (const [spot, range] of [
    [VILLAIN_SPOT, BATTLE_RANGE],
    [WORKSHOP, WORKSHOP_RANGE],
  ] as const) {
    assert.ok(isWalkable(spot));
    for (const gate of PORTALS)
      assert.ok(Math.hypot(gate.x - spot.x, gate.y - spot.y) > range + 80, gate.id);
    for (const robot of ROBOTS)
      assert.ok(Math.hypot(robot.home.x - spot.x, robot.home.y - spot.y) > range, robot.id);
  }
  assert.ok(Math.hypot(VILLAIN_SPOT.x - WORKSHOP.x, VILLAIN_SPOT.y - WORKSHOP.y) > 500);
  // Play stations win the action button, so robot spots must stay clear of them.
  const spots = [
    [VILLAIN_SPOT, BATTLE_RANGE],
    [WORKSHOP, WORKSHOP_RANGE],
    // Patrols wander up to ~45 from home.
    ...ROBOTS.map((r) => [r.home, MEET_RANGE + 45] as const),
  ] as const;
  for (const [place, range] of spots)
    for (const station of [DELIVERY_GARAGE, ...Object.values(STATIONS)])
      assert.ok(Math.hypot(station.x - place.x, station.y - place.y) > 180 + range);
});
