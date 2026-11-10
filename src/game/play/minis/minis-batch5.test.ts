import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LAST_STAY,
  SKY,
  STAR_GOAL,
  STAR_MISSES,
  createStars,
  stayFor,
  tapSky,
  tickStars,
} from "./starhop.ts";
import { FISH_GOAL, FISH_SNAPS, createFish, inGreen, pull, tickFish } from "./fishking.ts";
import { BEACH, DIG_GOAL, DIG_TRIES, clueAt, createDig, digAt } from "./dig.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.05) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

test("starhop: tapping the star before it hops wins 15; it never lands where it was", () => {
  let g = createStars(3);
  while (g.outcome === "playing") {
    const before = g.at;
    g = tapSky(tickStars(g, 0.3), g.at);
    if (g.outcome === "playing") assert.notEqual(g.at, before);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, STAR_GOAL);
  assert.equal(stayFor(STAR_GOAL - 1), LAST_STAY);
});
test("starhop: the star hops away on its own; empty taps are misses; time runs out", () => {
  const g = createStars(3);
  assert.notEqual(run(g, tickStars, 1.6).at, g.at, "hopped by itself");
  let m = g;
  for (let i = 0; i < STAR_MISSES; i++) m = tapSky(m, (m.at + 1) % SKY);
  assert.equal(m.outcome, "lost");
  assert.equal(tapSky(g, SKY), g);
  assert.equal(run(createStars(1), tickStars, 41).outcome, "lost");
});

test("fishking: waiting for the bite and pulling in the green catches five fish", () => {
  let g = createFish(5);
  for (let i = 0; i < 20000 && g.outcome === "playing"; i++) {
    g = tickFish(g, 0.02);
    if (inGreen(g) && g.needle > g.green + 0.05) g = pull(g);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, FISH_GOAL);
  assert.equal(g.snaps, 0);
});
test("fishking: pulling too early snaps the line; three snaps lose; a bite left alone swims away", () => {
  let g = createFish(5);
  assert.equal(g.phase, "waiting");
  for (let i = 0; i < FISH_SNAPS; i++) g = pull(g);
  assert.equal(g.outcome, "lost");
  const idle = run(createFish(5), tickFish, 20);
  assert.equal(idle.snaps, 0);
  assert.equal(idle.score, 0);
  assert.equal(run(createFish(5), tickFish, 61).outcome, "lost");
});

test("dig: clues are honest and digging the treasures wins with digs to spare", () => {
  let g = createDig(8);
  assert.equal(new Set(g.treasures).size, DIG_GOAL);
  for (let c = 0; c < BEACH * BEACH; c++) {
    const clue = clueAt(g, c);
    if (g.treasures.includes(c)) assert.equal(clue, "found");
    else assert.notEqual(clue, "found");
  }
  for (const t of g.treasures) g = digAt(g, t);
  assert.equal(g.outcome, "won");
  assert.equal(g.tries, DIG_TRIES - DIG_GOAL);
});
test("dig: sand digs use up the tries; the same square can't be dug twice; bad squares ignored", () => {
  let g = createDig(8);
  const sand = [...Array(BEACH * BEACH).keys()].filter((c) => !g.treasures.includes(c));
  const once = digAt(g, sand[0]!);
  assert.equal(digAt(once, sand[0]!), once);
  assert.equal(digAt(g, 25), g);
  for (const c of sand.slice(0, DIG_TRIES)) g = digAt(g, c);
  assert.equal(g.outcome, "lost");
  assert.equal(g.tries, 0);
});
