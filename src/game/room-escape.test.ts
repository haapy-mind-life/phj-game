import test from "node:test";
import assert from "node:assert/strict";
import {
  newRoomRun,
  moveRoom,
  tickRoom,
  nextRoom,
  retryRoom,
  roomDoorOpen,
  type RoomRun,
  type RoomDirection,
} from "./room-escape.ts";
const walk = (g: RoomRun, path: RoomDirection[]) => path.reduce(moveRoom, g);
const playing = (): RoomRun => ({ ...newRoomRun(), phase: "playing" });
test("key room requires walking to the key before its door opens", () => {
  const start = playing();
  assert.equal(nextRoom(start), start);
  assert.equal(moveRoom(start, "down"), start);
  const atDoor = walk(start, ["up", "right", "right", "right", "right", "down"]);
  assert.equal(atDoor.phase, "playing");
  assert.equal(atDoor.player.y, 2);
  assert.equal(atDoor.key, false);
  const clear = walk(atDoor, ["up", "down", "down"]);
  assert.equal(clear.phase, "room-clear");
  assert.equal(clear.key, true);
  assert.equal(moveRoom(clear, "left"), clear);
  assert.equal(nextRoom(clear).room, 1);
});
test("crate room needs real pushing onto the plate; reset recovers a stuck crate", () => {
  const start = retryRoom({ ...playing(), room: 1 });
  assert.equal(roomDoorOpen(start), false);
  const blocked = walk(start, ["up", "up", "right", "right", "right", "right"]);
  assert.equal(blocked.phase, "playing");
  const solved = walk(start, ["up", "right", "right", "right", "up", "right"]);
  assert.equal(solved.phase, "room-clear");
  assert.deepEqual(solved.crate, { x: 5, y: 2 });
  const stuck = { ...start, crate: { x: 1, y: 2 }, player: { x: 2, y: 2 } };
  assert.equal(moveRoom(stuck, "left"), stuck);
  assert.deepEqual(retryRoom(stuck).crate, { x: 3, y: 2 });
  assert.equal(retryRoom(stuck).room, 1);
});
test("bridge uses real time, red entry fails, green crossing wins", () => {
  const start = retryRoom({ ...playing(), room: 2 });
  const edge = walk(start, ["up", "right"]);
  assert.equal(moveRoom(edge, "right").phase, "lost");
  const green = tickRoom(edge, 3);
  const bridge = moveRoom(green, "right");
  assert.equal(bridge.phase, "playing");
  assert.equal(tickRoom(bridge, 4).phase, "lost");
  assert.equal(tickRoom(bridge, 11).phase, "lost");
  const won = walk(bridge, ["right", "right", "up"]);
  assert.equal(won.phase, "won");
  assert.equal(nextRoom(won), won);
});
test("pause and terminal states freeze movement and the bridge clock", () => {
  for (const phase of ["ready", "paused", "room-clear", "won", "lost"] as const) {
    const g = { ...newRoomRun(), room: 2 as const, phase };
    assert.equal(moveRoom(g, "up"), g);
    assert.equal(tickRoom(g, 10), g);
  }
  const g = retryRoom({ ...playing(), room: 2 });
  for (const delta of [NaN, Infinity, -1, 0]) assert.equal(tickRoom(g, delta), g);
});
