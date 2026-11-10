import { test } from "node:test";
import assert from "node:assert/strict";
import { CLOUD_FALLS, CLOUD_GOAL, createCloud, jumpCloud, tickCloud, underMark } from "./cloud.ts";
import { LEAN, SURF_FALLS, SURF_GOAL, ZONE, createSurf, setLean, tickSurf, wave } from "./surf.ts";
import { PLOTS, WATER_GOAL, WATER_TANK, createWater, pour, tickWater, turnCan } from "./water.ts";
import { RANGE_GOAL, RANGE_MISSES, createRange, shoot, tickRange } from "./range.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.05) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

test("cloud: jumping while the cloud is under the mark lands; ten landings win", () => {
  let g = createCloud(3);
  for (let i = 0; i < 20000 && g.outcome === "playing"; i++) {
    g = tickCloud(g, 0.02);
    if (underMark(g.cloud) && Math.abs(g.cloud.x - 0.5) < 0.05) g = jumpCloud(g);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, CLOUD_GOAL);
  assert.equal(g.falls, 0);
});
test("cloud: jumping into the air is a fall; three falls lose; drifting clouds cost nothing", () => {
  let g = createCloud(3);
  assert.equal(underMark(g.cloud), false, "a new cloud starts off to the side");
  for (let i = 0; i < CLOUD_FALLS; i++) g = jumpCloud(g);
  assert.equal(g.outcome, "lost");
  const idle = run(createCloud(3), tickCloud, 20);
  assert.equal(idle.falls, 0);
  assert.equal(run(createCloud(3), tickCloud, 61).outcome, "lost", "time up");
  const c = createCloud(1);
  assert.equal(tickCloud(c, Number.NaN), c);
});

test("surf: leaning against the wave keeps the board steady; 25 points win", () => {
  let g = createSurf(42);
  for (let i = 0; i < 20000 && g.outcome === "playing"; i++) {
    g = setLean(g, g.needle > 0.08 ? -1 : g.needle < -0.08 ? 1 : 0);
    g = tickSurf(g, 0.05);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, SURF_GOAL);
});
test("surf: not leaning tips over; three falls lose; lean beats any wave", () => {
  const g = run(createSurf(42), tickSurf, 120);
  assert.equal(g.outcome, "lost");
  assert.equal(g.falls, SURF_FALLS);
  for (let t = 0; t < 30; t += 0.1) assert.ok(Math.abs(wave(t, 1.2)) < LEAN);
  for (const seed of [1, 42, 300, 627])
    assert.equal(run(createSurf(seed), tickSurf, 60).falls >= 1, true, `seed ${seed} idle falls`);
  assert.ok(ZONE > 0 && ZONE < 1);
  const done = { ...createSurf(1), outcome: "won" as const };
  assert.equal(setLean(done, 1), done);
});

test("water: aim at each dry plot and pour; eight plots win within the tank", () => {
  let g = createWater(5);
  for (let i = 0; i < 2000 && g.outcome === "playing"; i++) {
    g = tickWater(g, 0.05);
    const dry = g.wet.findIndex((w) => !w);
    if (g.aim === dry) g = pour(g);
    else g = turnCan(g, dry > g.aim ? 1 : -1);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, WATER_GOAL);
  assert.equal(g.shots, WATER_TANK - WATER_GOAL, "no water wasted");
});
test("water: pouring on a wet plot wastes water; an empty tank loses; wind nudges the can", () => {
  let g = createWater(5);
  for (let i = 0; i < WATER_TANK; i++) g = pour(g);
  assert.equal(g.outcome, "lost");
  assert.equal(g.score, 1);
  assert.equal(pour(g), g);
  const blown = run(createWater(5), tickWater, 3.2);
  assert.notEqual(blown.aim, 3);
  assert.equal(turnCan(turnCan(createWater(1), 1), 1).aim, 5);
  let edge = createWater(1);
  for (let i = 0; i < 20; i++) edge = turnCan(edge, 1);
  assert.equal(edge.aim, PLOTS - 1);
});

test("range: shooting only targets wins at 15", () => {
  let g = createRange(8);
  for (let i = 0; i < 4000 && g.outcome === "playing"; i++) {
    g = tickRange(g, 0.05);
    const t = g.popups.find((p) => p.kind === "target");
    if (t) g = shoot(g, t.id);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, RANGE_GOAL);
  assert.equal(g.misses, 0);
});
test("range: three friends shot lose; pop-ups never share a cell; time runs out", () => {
  let g = createRange(8);
  for (let i = 0; i < 4000 && g.outcome === "playing"; i++) {
    g = tickRange(g, 0.05);
    assert.equal(new Set(g.popups.map((p) => p.cell)).size, g.popups.length);
    const f = g.popups.find((p) => p.kind === "friend");
    if (f) g = shoot(g, f.id);
  }
  assert.equal(g.outcome, "lost");
  assert.equal(g.misses, RANGE_MISSES);
  assert.equal(run(createRange(8), tickRange, 31).outcome, "lost");
  assert.equal(shoot(createRange(1), 99).score, 0);
});
