import { test } from "node:test";
import assert from "node:assert/strict";
import { stepPlayer, cameraAt, BLOCKS, PORTALS, newMini, stepMini, actMini } from "./adventure.ts";
import { migrateSave, reduceWorld } from "../../lib/world-model.ts";

test("diagonal movement has the same speed and north edge wraps", () => {
  const p = { x: 1100, y: 850 };
  const a = stepPlayer(p, { x: 1, y: 0 }, 1 / 60);
  const b = stepPlayer(p, { x: 1, y: 1 }, 1 / 60);
  assert.ok(Math.abs(Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)) < 0.01);
  assert.ok(stepPlayer({ x: 2, y: 2 }, { x: -1, y: -1 }, 1).y > 10780);
});
test("lake and buildings block walking while all entrances are reachable ground", () => {
  for (const p of PORTALS) assert.deepEqual(stepPlayer(p, { x: 0, y: 0 }, 0), { x: p.x, y: p.y });
  const lake = BLOCKS.find((b) => b.id === "lake")!;
  const p = { x: lake.x - 19, y: lake.y + 50 };
  assert.equal(stepPlayer(p, { x: 1, y: 0 }, 0.05).x, p.x);
});
test("camera follows seamlessly across wrapped edges", () => {
  assert.deepEqual(cameraAt({ x: 24, y: 24 }, 800, 500), { x: -376, y: -226 });
  assert.deepEqual(cameraAt({ x: 10176, y: 1776 }, 800, 500), { x: 9776, y: 1526 });
});
test("treasure can be won, rewards freeze, and restart clears progress", () => {
  const g = newMini("treasure");
  for (const target of g.items) {
    g.player = { x: target.x, y: target.y };
    stepMini(g, { x: 0, y: 0 }, 0.01);
  }
  assert.equal(g.phase, "won");
  const score = g.score;
  stepMini(g, { x: 1, y: 0 }, 1);
  assert.equal(g.score, score);
  assert.equal(newMini("treasure").score, 0);
});
test("stars end on timeout and fishing requires timing, not repeated button presses", () => {
  const stars = newMini("stars");
  for (let i = 0; i < 1000; i++) stepMini(stars, { x: 0, y: 0 }, 0.05);
  assert.equal(stars.phase, "over");
  const fish = newMini("fishing");
  fish.cursor = 0;
  actMini(fish);
  assert.equal(fish.score, 0);
  fish.cooldown = 0;
  fish.cursor = 0.5;
  actMini(fish);
  assert.equal(fish.score, 1);
  actMini(fish);
  assert.equal(fish.score, 1);
});
test("minigame settlement is idempotent and does not corrupt runner records", () => {
  const s = migrateSave(null);
  const action = {
    type: "settle-mini" as const,
    id: "mini-1",
    game: "treasure" as const,
    score: 6,
  };
  const a = reduceWorld(s, action);
  assert.equal(a.money, s.money + 34);
  assert.equal(a.runs, s.runs);
  assert.equal(a.runnerBest, s.runnerBest);
  assert.deepEqual(reduceWorld(a, action), a);
  assert.equal(migrateSave(a).miniBest.treasure, 6);
});

test("all minigames have a reachable win state and a terminal timeout", () => {
  for (const kind of ["stars", "fishing", "treasure"] as const) {
    const g = newMini(kind);
    if (kind === "fishing")
      for (let i = 0; i < 5; i++) {
        g.cooldown = 0;
        g.cursor = 0.5;
        actMini(g);
      }
    else
      for (let wave = 0; wave < (kind === "stars" ? 3 : 1); wave++) {
        for (const item of [...g.items]) {
          g.player = { x: item.x, y: item.y };
          stepMini(g, { x: 0, y: 0 }, 0.01);
        }
      }
    assert.equal(g.phase, "won", kind);
    const idle = newMini(kind);
    idle.time = 0.01;
    stepMini(idle, { x: 0, y: 0 }, 0.05);
    assert.equal(idle.phase, "over", kind);
  }
});

test("each world entrance is reachable from the plaza without crossing a building or lake", () => {
  const pending = [{ x: 1350, y: 920 }];
  const seen = new Set<string>();
  const reached = new Set<string>();
  while (pending.length) {
    const p = pending.pop()!;
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    for (const gate of PORTALS)
      if (Math.hypot(gate.x - p.x, gate.y - p.y) < 70) reached.add(gate.id);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const n = stepPlayer(p, { x: dx, y: dy }, 0.05);
      if (n.x !== p.x || n.y !== p.y) {
        const q = { x: Math.round(n.x / 10) * 10, y: Math.round(n.y / 10) * 10 };
        if (q.x < 20 || q.x > 2700 || q.y < 20 || q.y > 1780) continue;
        if (!seen.has(`${q.x},${q.y}`)) pending.push(q);
      }
    }
  }
  assert.equal(reached.size, PORTALS.length);
});

test("a companion visibly walks to nearby treasure only after the player participates", () => {
  const g = newMini("treasure");
  for (let i = 0; i < 200; i++) stepMini(g, { x: 0, y: 0 }, 0.05, 1);
  assert.equal(g.score, 0);
  g.player = { ...g.items[0]! };
  stepMini(g, { x: 0, y: 0 }, 0.01, 1);
  assert.equal(g.playerScore, 1);
  g.player = { x: g.items[1]!.x - 100, y: g.items[1]!.y };
  for (let i = 0; i < 300; i++) stepMini(g, { x: 0, y: 0 }, 0.05, 1);
  assert.ok(g.assisted >= 1 && g.assisted <= 2);
  assert.ok(g.helper.x > g.player.x);
});

test("walking distance is stable at 10fps and 60fps without teleporting after a long pause", () => {
  const start = { x: 1350, y: 920 };
  let smooth = { ...start },
    slow = { ...start };
  for (let i = 0; i < 60; i++) smooth = stepPlayer(smooth, { x: 0, y: 1 }, 1 / 60);
  for (let i = 0; i < 10; i++) slow = stepPlayer(slow, { x: 0, y: 1 }, 0.1);
  assert.ok(Math.abs(smooth.y - slow.y) < 0.001);
  const resumed = stepPlayer(start, { x: 0, y: 1 }, 30);
  assert.ok(resumed.y - start.y <= 24.501);
});
