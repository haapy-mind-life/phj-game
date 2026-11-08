import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DUAL_FUSION_MS,
  advanceRocketFusion,
  beginRocketFusion,
  cancelRocketFusion,
  idleDual,
  isDualFusing,
  phaseAt,
  secondsLeft,
  setDualMode,
  splitRocketFusion,
} from "./rocket-dual.ts";

// docs/robot-fusion/2026-11-08-rocket-dual-v1/02 — S04: the pure rules, no timers or DOM.
const PAIR = ["rb-rocket", "rb-rocket-x"] as const;

test("RD-AT-07 the four steps change exactly on the 2·4·7·10 s marks (P-02, provisional)", () => {
  assert.equal(DUAL_FUSION_MS, 10_000);
  const at: [number, string][] = [
    [0, "gather"],
    [1999, "gather"],
    [2000, "link"],
    [3999, "link"],
    [4000, "assemble"],
    [6999, "assemble"],
    [7000, "reveal"],
    [9999, "reveal"],
    [10000, "active"],
    [10001, "active"],
  ];
  for (const [ms, phase] of at) assert.equal(phaseAt(ms), phase, `${ms}ms`);
});

test("broken clock values never skip ahead", () => {
  assert.equal(phaseAt(-50), "gather");
  assert.equal(phaseAt(Number.NaN), "gather");
  assert.equal(phaseAt(Number.POSITIVE_INFINITY), "gather");
});

test("RD-AT-06 only Rocket + Rocket X can start, from rest, in either order", () => {
  assert.ok(beginRocketFusion(idleDual(), PAIR, 100, 1));
  assert.ok(beginRocketFusion(idleDual(), ["rb-rocket-x", "rb-rocket"], 100, 1));
  assert.equal(beginRocketFusion(idleDual(), ["rb-rocket", "rb-rocket"], 100, 1), null);
  assert.equal(beginRocketFusion(idleDual(), ["rb-rocket", "rb-tira"], 100, 1), null);
  assert.equal(beginRocketFusion(idleDual(), ["rb-rocket"], 100, 1), null);
  assert.equal(beginRocketFusion(idleDual(), [...PAIR, "rb-police"], 100, 1), null);
  assert.equal(beginRocketFusion(idleDual(), PAIR, Number.NaN, 1), null);
});

test("RD-AT-12 a second start while fusing or fused is refused; one fusion at a time", () => {
  const s = beginRocketFusion(idleDual(), PAIR, 0, 1)!;
  assert.ok(isDualFusing(s));
  assert.equal(beginRocketFusion(s, PAIR, 500, 2), null);
  const done = advanceRocketFusion(s, 10_000).state;
  assert.equal(beginRocketFusion(done, PAIR, 11_000, 3), null);
});

test("RD-AT-07/12 the fusion completes exactly once, however often it is advanced", () => {
  let s = beginRocketFusion(idleDual(), PAIR, 1000, 7)!;
  const completions: number[] = [];
  for (const now of [1000, 2999, 3000, 7999, 10999, 11000, 11000, 11001, 15000, 9000]) {
    const r = advanceRocketFusion(s, now);
    s = r.state;
    if (r.completed) completions.push(now);
  }
  assert.deepEqual(completions, [11000]);
  assert.equal(s.phase, "active");
  assert.equal(s.fusionId, 7, "the finished fusion is the one that started");
});

test("advancing before the start time (clock went back) stays in the first step", () => {
  const s = beginRocketFusion(idleDual(), PAIR, 5000, 1)!;
  const r = advanceRocketFusion(s, 4000);
  assert.equal(r.state.phase, "gather");
  assert.equal(r.completed, false);
});

test("advancing at rest does nothing", () => {
  const r = advanceRocketFusion(idleDual(), 99_999);
  assert.deepEqual(r.state, idleDual());
  assert.equal(r.completed, false);
});

test("RD-AT-13 cancelling during any step goes back to rest and never completes later", () => {
  for (const cut of [0, 2500, 5000, 9999]) {
    const s = advanceRocketFusion(beginRocketFusion(idleDual(), PAIR, 0, 1)!, cut).state;
    const back = cancelRocketFusion(s);
    assert.deepEqual(back, idleDual(), `${cut}ms`);
    const later = advanceRocketFusion(back, 20_000);
    assert.equal(later.completed, false);
  }
});

test("a finished Dual Rocket is not undone by cancel; it is split instead", () => {
  const done = advanceRocketFusion(beginRocketFusion(idleDual(), PAIR, 0, 1)!, 10_000).state;
  assert.equal(cancelRocketFusion(done), done);
  assert.deepEqual(splitRocketFusion(done), idleDual());
});

test("RD-AT-10 only a finished Dual Rocket turns into the dual car and back", () => {
  const fusing = beginRocketFusion(idleDual(), PAIR, 0, 1)!;
  assert.equal(setDualMode(fusing, "car"), null);
  assert.equal(setDualMode(idleDual(), "car"), null);
  const done = advanceRocketFusion(fusing, 10_000).state;
  const car = setDualMode(done, "car")!;
  assert.equal(car.mode, "car");
  assert.equal(setDualMode(car, "car"), null, "already a car");
  assert.equal(setDualMode(car, "robot")!.mode, "robot");
});

test("RD-AT-11 splitting the dual car also goes back to two robots at rest", () => {
  const done = advanceRocketFusion(beginRocketFusion(idleDual(), PAIR, 0, 1)!, 10_000).state;
  assert.deepEqual(splitRocketFusion(setDualMode(done, "car")!), idleDual());
  assert.deepEqual(splitRocketFusion(idleDual()), idleDual());
});

test("the countdown shows whole seconds left: 10 at the start, 1 in the last second, 0 when done", () => {
  const s = beginRocketFusion(idleDual(), PAIR, 0, 1)!;
  assert.equal(secondsLeft(s, 0), 10);
  assert.equal(secondsLeft(s, 1), 10);
  assert.equal(secondsLeft(s, 1000), 9);
  assert.equal(secondsLeft(s, 9001), 1);
  assert.equal(secondsLeft(s, 10_000), 0);
  assert.equal(secondsLeft(idleDual(), 0), 0);
});

test("a clock that jumps back never moves the fusion back a step or adds time", () => {
  let s = beginRocketFusion(idleDual(), PAIR, 0, 1)!;
  s = advanceRocketFusion(s, 8000).state;
  assert.equal(s.phase, "reveal");
  const back = advanceRocketFusion(s, 3000);
  assert.equal(back.state.phase, "reveal");
  assert.equal(back.completed, false);
  assert.equal(secondsLeft(back.state, 3000), 2);
  assert.equal(advanceRocketFusion(back.state, 10_000).completed, true);
});
