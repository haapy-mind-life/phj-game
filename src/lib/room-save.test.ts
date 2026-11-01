import test from "node:test";
import assert from "node:assert/strict";
import { migrateSave, reduceWorld } from "./world-model.ts";
import { ROOM_RUN_REWARD } from "../game/room-escape.ts";
test("room clear uses one settlement, preserves assets and survives reload", () => {
  const before = migrateSave({
    version: 3,
    money: 3000,
    ownedCars: ["car-001", "car-021"],
    houseTier: 3,
    miniBest: { peanuts: 8, fishing: 5 },
    runnerBest: 700,
    robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
  });
  assert.equal(before.roomEscapeBest, 0);
  const after = reduceWorld(before, { type: "settle-rooms", id: "rooms-complete", rooms: 3 });
  assert.deepEqual(after, {
    ...before,
    money: before.money + ROOM_RUN_REWARD,
    roomEscapeBest: 3,
    settledActivities: [...before.settledActivities, "rooms-complete"],
  });
  assert.deepEqual(migrateSave(after), after);
  assert.equal(reduceWorld(after, { type: "settle-rooms", id: "rooms-complete", rooms: 3 }), after);
});
test("partial rooms, invalid identifiers and non-finite room counts cannot pay", () => {
  const before = migrateSave(null);
  for (const rooms of [0, 1, 2, 4, -1, NaN, Infinity])
    assert.equal(reduceWorld(before, { type: "settle-rooms", id: "rooms-partial", rooms }), before);
  for (const id of ["", "unrelated", "rooms-" + "x".repeat(160)])
    assert.equal(reduceWorld(before, { type: "settle-rooms", id, rooms: 3 }), before);
  assert.equal(migrateSave({ roomEscapeBest: Infinity }).roomEscapeBest, 0);
});
