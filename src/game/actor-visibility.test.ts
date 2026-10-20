import { test } from "node:test";
import assert from "node:assert/strict";
import { ACTORS, actorMayBeNear, patrolPosition } from "./actors.ts";
import { worldDistance, wrapPoint } from "./world-space.ts";
test("actor visibility rejects distant patrols without losing nearby or wrapped neighbours", () => {
  for (const actor of ACTORS)
    for (const seconds of [0, 3, 19, 60, 120])
      for (const radius of [180, 1000]) {
        const position = patrolPosition(actor, seconds);
        for (const dx of [-radius + 1, 0, radius - 1]) {
          const player = wrapPoint({ x: position.x + dx, y: position.y });
          if (worldDistance(position, player) < radius)
            assert.equal(actorMayBeNear(actor, player, radius), true);
        }
      }
  assert.equal(actorMayBeNear(ACTORS[0], { x: 15000, y: 8000 }, 1000), false);
});
test("reusing patrol calculations does not expose mutable cached coordinates", () => {
  const actor = ACTORS.find((a) => a.kind === "friend")!;
  const expected = patrolPosition(actor, 13);
  const changed = patrolPosition(actor, 13);
  changed.x = 99999;
  assert.deepEqual(patrolPosition(actor, 13), expected);
});
