import test from "node:test";
import assert from "node:assert/strict";
import { initialEntry, reduceEntry, type EntryEvent, type EntryState } from "./world-entry.ts";

const run = (s: EntryState, ...events: EntryEvent[]) => events.reduce(reduceEntry, s);

test("a fresh run at the root starts on the title", () => {
  assert.equal(initialEntry(false, false).phase, "title");
  assert.equal(initialEntry(false, true).phase, "title");
});

test("coming back after the title (or after starting on another route) skips the title", () => {
  assert.equal(initialEntry(true, true).phase, "world");
  const back = initialEntry(true, false);
  assert.equal(back.phase, "loading");
  // No extra presentation delay when the child is only coming back.
  assert.equal(run(back, { type: "worldReady", attempt: back.attempt }).phase, "world");
});

test("start opens loading once; a second tap does not start another attempt", () => {
  const once = run(initialEntry(false, false), { type: "start" });
  assert.equal(once.phase, "loading");
  assert.deepEqual(run(once, { type: "start" }), once);
});

test("the world opens only after the real load AND the minimum display time", () => {
  const s = run(initialEntry(false, false), { type: "start" });
  const a = s.attempt;
  // The timer alone never counts as success.
  assert.equal(run(s, { type: "minShown", attempt: a }).phase, "loading");
  assert.equal(run(s, { type: "worldReady", attempt: a }).phase, "loading");
  assert.equal(
    run(s, { type: "minShown", attempt: a }, { type: "worldReady", attempt: a }).phase,
    "world",
  );
  assert.equal(
    run(s, { type: "worldReady", attempt: a }, { type: "minShown", attempt: a }).phase,
    "world",
  );
});

test("a failure stops loading, and late results of the failed attempt are ignored", () => {
  const s = run(initialEntry(false, false), { type: "start" });
  const failed = run(s, { type: "failed", attempt: s.attempt });
  assert.equal(failed.phase, "failed");
  assert.deepEqual(run(failed, { type: "worldReady", attempt: s.attempt }), failed);
  assert.deepEqual(run(failed, { type: "minShown", attempt: s.attempt }), failed);
  assert.deepEqual(run(failed, { type: "start" }), failed);
});

test("a failure after the world opened changes nothing", () => {
  const s = run(initialEntry(false, false), { type: "start" });
  const world = run(
    s,
    { type: "worldReady", attempt: s.attempt },
    { type: "minShown", attempt: s.attempt },
  );
  assert.deepEqual(run(world, { type: "failed", attempt: s.attempt }), world);
  assert.deepEqual(run(world, { type: "start" }), world);
});
