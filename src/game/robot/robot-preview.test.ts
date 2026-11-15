import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMY } from "./robot-army.ts";
import { ALL_ROBOTS, LEGENDS, ROBOTS, ROBOT_IDS, isRobotId } from "./robot-catalog.ts";
import { normalizeRobots } from "./robot-engine.ts";
import { PREVIEW_ROBOTS, isPreviewRobotId } from "./robot-preview.ts";

test("preview robots are Blue Cabi and Golden Kaldkeite with 2 and 9 forms", () => {
  assert.deepEqual(
    PREVIEW_ROBOTS.map((r) => r.workName),
    ["블루카비", "황금 칼드케이트"],
  );
  assert.equal(new Set(PREVIEW_ROBOTS.map((r) => r.id)).size, PREVIEW_ROBOTS.length);
  assert.equal(PREVIEW_ROBOTS[0]!.forms.length, 2);
  assert.equal(PREVIEW_ROBOTS[1]!.forms.length, 9);
  assert.equal(new Set(PREVIEW_ROBOTS[1]!.forms).size, 9);
  assert.ok(isPreviewRobotId("pv-bluecabi"));
  assert.ok(!isPreviewRobotId("rb-police"));
});

test("preview robots stay out of the roster, legends, army and save (R-02·R-03·R-05)", () => {
  assert.equal(ROBOTS.length, 10);
  assert.equal(LEGENDS.length, 6);
  assert.equal(ALL_ROBOTS.length, 16);
  for (const r of PREVIEW_ROBOTS) {
    assert.ok(!ROBOT_IDS.includes(r.id));
    assert.equal(isRobotId(r.id), false);
    assert.ok(!ARMY.some((a) => (a.species as string) === r.id));
  }
  const saved = normalizeRobots({
    cards: {
      "pv-bluecabi": { uses: 7 },
      "pv-golden-kaldkeite": { uses: 3 },
      "rb-police": { uses: 2 },
    },
  });
  assert.deepEqual(Object.keys(saved.cards), ["rb-police"]);
});
