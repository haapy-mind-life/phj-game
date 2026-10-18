import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMission,
  actMission,
  missionTarget,
  stepDive,
  DIVE_TREASURES,
} from "./place-play.ts";
test("mission requires movement; fire upgrade expands real action range", () => {
  const job = createMission("fire", "f1", false);
  assert.equal(actMission(job, { x: 0, y: 0 }, 0), job);
  const t = missionTarget(job, 0);
  const edge = { x: t.x, y: t.y + 140 };
  assert.equal(actMission(job, edge, 0), job);
  assert.equal(actMission({ ...job, special: true }, edge, 0).step, 1);
});
test("ambulance upgrade carries both passengers before returning; no action skips pickup", () => {
  let job = createMission("ambulance", "a1", true);
  job = actMission(job, missionTarget(job, 0), 0);
  assert.equal(job.step, 1);
  job = actMission(job, missionTarget(job, 0), 0);
  assert.equal(job.step, 2);
  job = actMission(job, missionTarget(job, 0), 0);
  assert.equal(job.done, true);
  assert.equal(actMission(job, missionTarget(job, 0), 0), job);
});
test("dive stays in vertical water bounds with three distinct depths", () => {
  assert.deepEqual(stepDive({ x: 40, y: 90 }, { x: -1, y: -1 }, 1), { x: 40, y: 90 });
  const p = stepDive({ x: 350, y: 200 }, { x: 0, y: 1 }, 0.05);
  assert.ok(p.y > 200 && p.y <= 220);
  assert.ok(
    DIVE_TREASURES[0]!.y < DIVE_TREASURES[1]!.y && DIVE_TREASURES[1]!.y < DIVE_TREASURES[2]!.y,
  );
});

test("every mission objective is on walkable land", async () => {
  const { isWalkable } = await import("./adventure.ts");
  for (const kind of ["delivery", "police", "fire", "ambulance"] as const) {
    for (let step = 0; step < 3; step++)
      assert.ok(
        isWalkable(missionTarget({ ...createMission(kind, kind, true), step }, 0)),
        kind + " step " + step,
      );
  }
});
