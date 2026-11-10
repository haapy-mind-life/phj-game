import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BALLOON_GOAL,
  BALLOON_MISSES,
  createBalloons,
  inRing,
  tapBalloon,
  tickBalloons,
  type BalloonGame,
} from "./balloons.ts";
import { COIN_GOAL, COIN_HEARTS, createCoins, tapFalling, tickCoins } from "./coins.ts";
import {
  JUMP_GOAL,
  JUMP_MISSES,
  LAST_WINDOW,
  createJump,
  jumpTo,
  tickJump,
  windowFor,
} from "./jump.ts";
import { DODGE_GOAL, DODGE_HEARTS, createDodge, steer, tickDodge } from "./dodge.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.05) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

// ── 풍선 ──
test("balloons: a tap inside the gold ring pops; ten pops win", () => {
  let g: BalloonGame = createBalloons(7);
  for (let i = 0; i < 2000 && g.outcome === "playing"; i++) {
    g = tickBalloons(g, 0.05);
    const ready = g.balloons.find(inRing);
    if (ready) g = tapBalloon(g, ready.id);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, BALLOON_GOAL);
  assert.equal(g.misses, 0);
});
test("balloons: taps outside the ring are misses; five misses lose", () => {
  let g = tickBalloons(createBalloons(3), 0.05);
  const low = g.balloons[0]!;
  assert.equal(inRing(low), false);
  for (let i = 0; i < BALLOON_MISSES; i++) g = tapBalloon(g, low.id);
  assert.equal(g.outcome, "lost");
  assert.equal(g.score, 0);
  assert.equal(tapBalloon(g, low.id), g, "nothing changes after the end");
});
test("balloons: time runs out; broken ticks and unknown taps change nothing", () => {
  const g = createBalloons(1);
  assert.equal(tickBalloons(g, Number.NaN), g);
  assert.equal(tickBalloons(g, -1), g);
  assert.equal(tapBalloon(g, 999), g);
  assert.equal(run(g, tickBalloons, 46).outcome, "lost");
  assert.ok(run(g, tickBalloons, 20).balloons.length <= 4);
});

// ── 코인 ──
test("coins: tapping coins wins at 15; clouds are left alone", () => {
  let g = createCoins(11);
  for (let i = 0; i < 4000 && g.outcome === "playing"; i++) {
    g = tickCoins(g, 0.05);
    const coin = g.items.find((x) => x.kind === "coin");
    if (coin) g = tapFalling(g, coin.id);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, COIN_GOAL);
  assert.equal(g.hearts, COIN_HEARTS);
});
test("coins: three clouds tapped lose; things falling past cost nothing", () => {
  let g = createCoins(5);
  let tapped = 0;
  for (let i = 0; i < 4000 && g.outcome === "playing"; i++) {
    g = tickCoins(g, 0.05);
    const cloud = g.items.find((x) => x.kind === "cloud");
    if (cloud) {
      g = tapFalling(g, cloud.id);
      tapped++;
    }
  }
  assert.equal(g.outcome, "lost");
  assert.equal(tapped, COIN_HEARTS);
  const idle = run(createCoins(5), tickCoins, 10);
  assert.equal(idle.hearts, COIN_HEARTS);
  assert.equal(run(createCoins(5), tickCoins, 31).outcome, "lost", "time up");
});

// ── 점프 ──
test("jump: the lit pad is never where Hyunjun stands; twelve good jumps win", () => {
  let g = createJump(9);
  for (let i = 0; i < JUMP_GOAL; i++) {
    assert.notEqual(g.target, g.at);
    g = jumpTo(tickJump(g, 0.3), g.target);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.misses, 0);
});
test("jump: wrong pads and lights that run out are misses; three lose", () => {
  let g = createJump(2);
  const wrong = ([0, 1, 2] as const).find((p) => p !== g.target)!;
  g = jumpTo(g, wrong);
  assert.equal(g.misses, 1);
  g = tickJump(g, 0.25);
  g = run(g, tickJump, g.remaining + 0.1, 0.05);
  assert.equal(g.misses, 2);
  g = run(g, tickJump, 3);
  assert.equal(g.outcome, "lost");
  assert.equal(g.misses, JUMP_MISSES);
});
test("jump: the window shrinks to the floor and never below", () => {
  assert.ok(windowFor(0) > windowFor(5));
  assert.equal(windowFor(JUMP_GOAL - 1), LAST_WINDOW);
  assert.equal(windowFor(50), LAST_WINDOW);
});

// ── 장애물 ──
test("dodge: steering out of every rock's lane passes 20 and wins", () => {
  let g = createDodge(4);
  for (let i = 0; i < 20000 && g.outcome === "playing"; i++) {
    const danger = g.rocks.find((r) => r.lane === g.lane && r.y > 0.55 && r.y < 0.95);
    if (danger) {
      const free = ([0, 1, 2] as const).find(
        (l) => !g.rocks.some((r) => r.lane === l && r.y > 0.5 && r.y < 1),
      );
      if (free !== undefined) g = steer(g, free > g.lane ? 1 : -1);
    }
    g = tickDodge(g, 0.05);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, DODGE_GOAL);
});
test("dodge: standing still bumps rocks; three bumps lose; lanes stay on the road", () => {
  const g = run(createDodge(4), tickDodge, 120);
  assert.equal(g.outcome, "lost");
  assert.equal(g.hearts, 0);
  assert.ok(g.score < DODGE_GOAL);
  const left = steer(steer(steer(createDodge(1), -1), -1), -1);
  assert.equal(left.lane, 0);
  assert.equal(steer(left, -1), left);
  assert.equal(steer(steer(createDodge(1), 1), 1).lane, 2);
  assert.equal(createDodge(1).hearts, DODGE_HEARTS);
});
