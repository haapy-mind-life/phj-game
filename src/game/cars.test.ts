import { test } from "node:test";
import assert from "node:assert/strict";
import { CAR_COUNT, CAR_KINDS, CARS, carById } from "./cars.ts";
test("five functional vehicles form an affordable progression", () => {
  assert.equal(CAR_COUNT, 5);
  assert.equal(CAR_KINDS.length, 12);
  assert.equal(new Set(CARS.map((c) => c.id)).size, 5);
  assert.deepEqual(
    CARS.map((c) => c.cost),
    [0, 120, 200, 280, 360],
  );
});
test("vehicle lookup is stable and invalid IDs safely fall back to first vehicle", () => {
  for (const car of CARS) assert.equal(carById(car.id), car);
  assert.equal(carById("unknown"), CARS[0]);
});
