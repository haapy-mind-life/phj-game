import test from "node:test";
import assert from "node:assert/strict";
import {
  createPeanuts,
  peanutOrder,
  tapPeanut,
  tickPeanuts,
  type PeanutGame,
} from "./peanut-engine.ts";
const playing = (): PeanutGame => ({ ...createPeanuts(), phase: "playing" });
test("peanuts require their complete changing order, not a tap counter", () => {
  let g = playing();
  g = tapPeanut(g, 0);
  assert.equal(g.score, 0);
  assert.equal(g.step, 1);
  g = tapPeanut(g, 0);
  assert.equal(g.mistakes, 1);
  assert.equal(g.step, 0);
  assert.equal(g.score, 0);
  const patterns = new Set<string>();
  while (g.phase === "playing") {
    const order = peanutOrder(g);
    patterns.add(order.join(","));
    for (const spot of order) g = tapPeanut(g, spot);
  }
  assert.equal(g.phase, "won");
  assert.equal(g.score, 8);
  assert.equal(patterns.size, 8);
  assert.equal(tapPeanut(g, 0), g);
});
test("three mistakes or an expired clock end the game without losing cracked peanuts", () => {
  let g = tapPeanut(tapPeanut(playing(), 0), 2);
  assert.equal(g.score, 1);
  for (let i = 0; i < 3; i++) g = tapPeanut(g, 1);
  assert.equal(g.phase, "lost");
  assert.equal(g.score, 1);
  const expired = tickPeanuts(playing(), 61);
  assert.equal(expired.remaining, 0);
  assert.equal(expired.phase, "lost");
  assert.equal(tapPeanut(expired, 0), expired);
});
test("ready, pause and terminal states freeze inputs and time; bad time deltas are ignored", () => {
  for (const phase of ["ready", "paused", "won", "lost"] as const) {
    const g = { ...createPeanuts(), phase };
    assert.equal(tapPeanut(g, 0), g);
    assert.equal(tickPeanuts(g, 30), g);
  }
  const g = playing();
  for (const delta of [NaN, Infinity, -1, 0]) assert.equal(tickPeanuts(g, delta), g);
  assert.equal(tickPeanuts(g, 2).remaining, 58);
  assert.deepEqual(createPeanuts(), {
    phase: "ready",
    score: 0,
    step: 0,
    mistakes: 0,
    remaining: 60,
  });
});
