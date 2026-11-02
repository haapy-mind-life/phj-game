import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMY, armyRobot, squadOf } from "./robot-army.ts";
import {
  MIST_TARGETS,
  canCatchMist,
  cureRobot,
  isInfected,
  mistCleared,
  mistTargets,
  startMist,
  stillInfected,
} from "./robot-infection.ts";
import { ANTIDOTE_SWORD, robotById } from "./robot-catalog.ts";
import { emptyRobots, missionReward, resolveStrike } from "./robot-engine.ts";

const near = squadOf(armyRobot("army-008")!).anchor;

test("the mist catches up to 3 regular robots nearby, never a legend, Tira or Emblus", () => {
  const ids = mistTargets(near, 0);
  assert.equal(ids.length, MIST_TARGETS);
  for (const id of ids) assert.ok(canCatchMist(armyRobot(id)!), id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ARMY.filter((r) => !canCatchMist(r)).every((r) => !ids.includes(r.instanceId)));
});

test("with nobody close there is no mist, so nothing can be claimed", () => {
  assert.equal(startMist(1, []), null);
  assert.deepEqual(mistTargets({ x: 9000, y: 500 }, 0), []);
});

test("AC-15 each hit heals one infected robot; all healed clears the mist", () => {
  let m = startMist(1, ["army-001", "army-002"])!;
  assert.equal(isInfected(m, "army-001"), true);
  m = cureRobot(m, "army-001");
  assert.equal(isInfected(m, "army-001"), false);
  assert.deepEqual(stillInfected(m), ["army-002"]);
  assert.equal(mistCleared(m), false);
  m = cureRobot(m, "army-002");
  assert.equal(mistCleared(m), true);
});

test("a healthy robot or a second cure changes nothing", () => {
  const m = cureRobot(startMist(1, ["army-001", "army-002"])!, "army-001");
  assert.equal(cureRobot(m, "army-001"), m);
  assert.equal(cureRobot(m, "army-050"), m);
});

test("AC-16 a miss or a cooldown cures nothing and the next try still works", () => {
  const w = robotById("rb-emblus").weapon;
  assert.equal(w.kind, "antidote");
  assert.equal(resolveStrike(w, { x: 0, y: 0 }, { x: w.range + 1, y: 0 }, 5000, -1e9), "far");
  assert.equal(resolveStrike(w, { x: 0, y: 0 }, { x: 10, y: 0 }, 5000, 4500), "cooldown");
  assert.equal(resolveStrike(w, { x: 0, y: 0 }, { x: 10, y: 0 }, 5000 + w.cooldownMs, 5000), "hit");
  assert.ok(ANTIDOTE_SWORD.range > w.range);
});

test("AC-24 finishing the same cure twice pays once", () => {
  const once = missionReward(emptyRobots(), "cure", 1);
  assert.equal(once.cures, 1);
  assert.equal(once.parts, 2);
  assert.equal(missionReward(once, "cure", 1), once);
});
