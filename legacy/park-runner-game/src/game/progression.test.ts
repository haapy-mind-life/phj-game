import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCraneReward,
  chooseAutoWeapon,
  resolveTapAction,
  stageForScore,
} from "./progression.ts";
import type { PlayerCombatState } from "./types.ts";

const base: PlayerCombatState = {
  armor: 1,
  bullets: 12,
  arrows: 6,
  bananas: 0,
  disguised: false,
  flying: false,
  giantTimer: 0,
};

test("stage boundaries stay fixed through the 1000 point clear", () => {
  assert.equal(stageForScore(-5).id, 1);
  assert.equal(stageForScore(0).id, 1);
  assert.equal(stageForScore(199).id, 1);
  assert.equal(stageForScore(200).id, 2);
  assert.equal(stageForScore(399).id, 2);
  assert.equal(stageForScore(400).id, 3);
  assert.equal(stageForScore(599).id, 3);
  assert.equal(stageForScore(600).id, 4);
  assert.equal(stageForScore(799).id, 4);
  assert.equal(stageForScore(800).id, 5);
  assert.equal(stageForScore(999).id, 5);
  assert.equal(stageForScore(1000).id, "clear");
});

test("tap priority is crane then ladder top then ladder ready then flying then jump", () => {
  assert.equal(resolveTapAction({ craneActive: true, ladderTop: true, ladderReady: true, flying: true }), "grab");
  assert.equal(resolveTapAction({ craneActive: false, ladderTop: true, ladderReady: true, flying: true }), "descend");
  assert.equal(resolveTapAction({ craneActive: false, ladderTop: false, ladderReady: true, flying: true }), "climb");
  assert.equal(resolveTapAction({ craneActive: false, ladderTop: false, ladderReady: false, flying: true }), "fly");
  assert.equal(resolveTapAction({ craneActive: false, ladderTop: false, ladderReady: false, flying: false }), "jump");
});

test("automatic weapon priority is banana then bow then gun", () => {
  assert.equal(chooseAutoWeapon({ ...base, bananas: 2 }), "banana");
  assert.equal(chooseAutoWeapon({ ...base, arrows: 2 }), "bow");
  assert.equal(chooseAutoWeapon({ ...base, arrows: 0, bullets: 2 }), "gun");
  assert.equal(chooseAutoWeapon({ ...base, arrows: 0, bullets: 0 }), null);
});

test("crane rewards mutate only the intended inventory", () => {
  assert.deepEqual(applyCraneReward(base, 3, "banana"), { state: { ...base, bananas: 5 }, money: 3 });
  assert.deepEqual(applyCraneReward(base, 3, "armor"), { state: { ...base, armor: 2 }, money: 3 });
  assert.deepEqual(applyCraneReward(base, 3, "coins"), { state: base, money: 8 });
  assert.deepEqual(applyCraneReward(base, 3, "treasure"), { state: base, money: 13 });
});
