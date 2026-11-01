import test from "node:test";
import assert from "node:assert/strict";
import { resolveTapAction, stageForScore } from "./progression.ts";

test("five runner stages keep the existing 200 point boundaries", () => {
  assert.equal(stageForScore(0).id, 1);
  assert.equal(stageForScore(199).id, 1);
  assert.equal(stageForScore(200).id, 2);
  assert.equal(stageForScore(400).id, 3);
  assert.equal(stageForScore(600).id, 4);
  assert.equal(stageForScore(800).id, 5);
  assert.equal(stageForScore(1000).id, "clear");
});

test("single tap prioritizes crane then ladder then flying then jump", () => {
  assert.equal(
    resolveTapAction({ craneActive: true, ladderTop: true, ladderReady: true, flying: true }),
    "grab",
  );
  assert.equal(
    resolveTapAction({ craneActive: false, ladderTop: false, ladderReady: false, flying: false }),
    "jump",
  );
});
