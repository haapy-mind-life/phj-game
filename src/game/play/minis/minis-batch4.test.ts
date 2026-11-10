import { test } from "node:test";
import assert from "node:assert/strict";
import { SPOT_CELLS, SPOT_GOAL, SPOT_MISSES, createSpot, tapSpot, tickSpot } from "./spot.ts";
import {
  HINT_GOAL,
  HINT_MISSES,
  LINE_NAME,
  createHint,
  guess,
  lineCells,
  tickHint,
} from "./hint.ts";
import {
  RESCUE_GOAL,
  connected,
  createRescue,
  rotate,
  solve,
  tickRescue,
  turnTile,
} from "./rescue.ts";
import { PARK_BUMPS, PARK_GOAL, createPark, drive, route, tickPark, type Dir } from "./park.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.1) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

test("spot: tapping the odd one out ten times wins", () => {
  let g = createSpot(2);
  while (g.outcome === "playing") {
    assert.ok(g.odd >= 0 && g.odd < SPOT_CELLS);
    g = tapSpot(tickSpot(g, 1), g.odd);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, SPOT_GOAL);
});
test("spot: wrong taps and lost rounds are misses; three lose; bad cells are ignored", () => {
  let g = createSpot(2);
  g = tapSpot(g, (g.odd + 1) % SPOT_CELLS);
  assert.equal(g.misses, 1);
  g = run(g, tickSpot, 8.2);
  assert.equal(g.misses, 2, "a round that runs out is a miss");
  assert.equal(tapSpot(g, -1), g);
  assert.equal(tapSpot(g, 1.5), g);
  g = run(g, tickSpot, 9);
  assert.equal(g.outcome, "lost");
  assert.equal(g.misses, SPOT_MISSES);
});

test("hint: the two clues always point at exactly one square, and that square wins", () => {
  let g = createHint(5);
  for (let n = 0; g.outcome === "playing"; n++) {
    const matches = lineCells(g.line).filter((c) => g.map[c] === g.land);
    assert.deepEqual(matches, [g.answer]);
    g = guess(g, g.answer);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, HINT_GOAL);
});
test("hint: wrong squares are mistakes; three lose; time runs out", () => {
  let g = createHint(5);
  for (let i = 0; i < HINT_MISSES; i++) g = guess(g, (g.answer + 1) % 9);
  assert.equal(g.outcome, "lost");
  assert.equal(guess(createHint(1), 9).score, 0);
  assert.equal(run(createHint(1), tickHint, 91).outcome, "lost");
});

test("rescue: every board starts broken but can be solved; turning to the solution wins four boards", () => {
  let g = createRescue(7);
  while (g.outcome === "playing") {
    assert.equal(connected(g.tiles), false, "a new board is never already joined");
    const need = solve(g.tiles);
    assert.ok(need, "solvable");
    const before = g.score;
    outer: for (const [i, m] of need) {
      while (g.tiles[i] !== m) {
        g = turnTile(g, i);
        if (g.score !== before || g.outcome !== "playing") break outer;
      }
    }
    assert.ok(g.score === before + 1 || g.outcome === "won");
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, RESCUE_GOAL);
});
test("rescue: four turns bring a tile back; bad squares are ignored; time runs out", () => {
  for (const m of [3, 5, 6, 10]) assert.equal(rotate(rotate(rotate(rotate(m)))), m);
  const g = createRescue(1);
  assert.equal(turnTile(g, 99), g);
  assert.equal(turnTile(g, -1), g);
  assert.equal(run(createRescue(1), tickRescue, 151).outcome, "lost");
});

test("park: following the free way parks five cars", () => {
  let g = createPark(4);
  while (g.outcome === "playing") {
    const way = route(g.lot);
    assert.ok(way && way.length >= 5);
    for (const d of way!) g = drive(g, d);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, PARK_GOAL);
  assert.equal(g.bumps, 0);
});
test("park: driving into a cone is a bump and the car stays; edges stop the car; three bumps lose", () => {
  // Car at the bottom-left square (25), a cone right above it (20).
  let g = { ...createPark(1), lot: { car: 25, spot: 4, cones: [20] } };
  assert.equal(drive(g, "down"), g, "the bottom row can't go further down");
  assert.equal(drive(g, "left"), g, "the left edge stops the car");
  for (let i = 0; i < PARK_BUMPS; i++) {
    g = drive(g, "up");
    assert.equal(g.lot.car, 25);
  }
  assert.equal(g.outcome, "lost");
  assert.equal(g.bumps, PARK_BUMPS);
  const c = createPark(1);
  assert.equal(drive(c, "sideways" as Dir), c);
  assert.equal(run(createPark(1), tickPark, 121).outcome, "lost");
});

test("hint: every line has its own name, so a clue never means two lines", () => {
  const names = [...LINE_NAME.row, ...LINE_NAME.col];
  assert.equal(new Set(names).size, 6);
});
