import test from "node:test";
import assert from "node:assert/strict";
import { advanceRun, createRun, hitRun, tapRun } from "./runner-engine.ts";
test("walk mode is slower and more forgiving than challenge mode", () => {
  const easy = createRun("easy"),
    challenge = createRun("challenge");
  assert.ok(easy.speed < challenge.speed);
  assert.ok(easy.combat.armor > challenge.combat.armor);
});
test("two taps allow a child-friendly double jump", () => {
  const run = createRun("easy");
  tapRun(run);
  tapRun(run);
  assert.equal(run.jumps, 2);
  assert.ok(run.vy < 0);
});
test("walk mode collision keeps the run alive", () => {
  const run = createRun("easy");
  run.combat.armor = 0;
  hitRun(run);
  assert.equal(run.phase, "running");
  assert.ok(run.combat.armor >= 1);
});
test("runner can reach the 1000 point clear", () => {
  const run = createRun("challenge");
  run.score = 999.8;
  advanceRun(run, 0.1);
  assert.equal(run.phase, "clear");
  assert.equal(run.score, 1000);
});
test("walk mode auto-jumps a nearby soft obstacle", () => {
  const run = createRun("easy");
  run.hazards = [{ id: 1, x: 205, y: 318, w: 42, h: 32, kind: "bush" }];
  run.hazardClock = 99;
  advanceRun(run, 0.02);
  assert.ok(run.jumps >= 1);
  assert.ok(run.vy < 0);
});
test("runner spawns collectible star coins", () => {
  const run = createRun("easy");
  run.coinClock = 0;
  advanceRun(run, 0.02);
  assert.ok(run.pickups.some((item) => item.kind === "coin"));
});
test("third stage opens the secret ladder activity", () => {
  const run = createRun("easy");
  run.score = 399.8;
  advanceRun(run, 0.02);
  assert.equal(run.stage, 3);
  assert.equal(run.activity, "ladder-ready");
});
test("fifth stage opens the friendly crane activity", () => {
  const run = createRun("easy");
  run.score = 799.8;
  advanceRun(run, 0.02);
  assert.equal(run.stage, 5);
  assert.equal(run.activity, "crane");
});
