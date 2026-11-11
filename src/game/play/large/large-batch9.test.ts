import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NIGHT_GOAL,
  NIGHT_MISSES,
  SHINES,
  SIZE,
  createNight,
  lightFor,
  tapForest,
  tickNight,
  type NightGame,
} from "./night.ts";
import { FEAST_GOAL, FEAST_MISSES, createFeast, pickDish, tickFeast } from "./feast.ts";
import {
  DINOS,
  DINO_GOAL,
  DINO_WARNINGS,
  FILM,
  createDino,
  inFrame,
  snap,
  tickDino,
} from "./dino.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.05) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

/** Shine on each firefly's square and catch it while lit. */
function hunt(g: NightGame): NightGame {
  const f = g.fireflies[0]!;
  if (!g.lit.includes(f)) g = tapForest(run(g, tickNight, 2), f);
  return tapForest(g, f);
}
test("night: shining on fireflies and catching them wins three nights", () => {
  let g = createNight(3);
  const stages = new Set<number>();
  while (g.outcome === "playing") {
    stages.add(g.stage);
    assert.equal(g.owls.length, g.stage);
    g = hunt(g);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, NIGHT_GOAL);
  assert.deepEqual([...stages].sort(), [1, 2, 3]);
  assert.ok(lightFor(1) > lightFor(3));
});
test("night: waking owls three times loses; dark squares can't be caught; the torch runs out", () => {
  let g = createNight(3);
  const owl = g.owls[0]!;
  g = tapForest(g, owl);
  for (let i = 0; i < NIGHT_MISSES; i++) g = tapForest(g, owl);
  assert.equal(g.outcome, "lost");
  let t = createNight(3);
  const empty = [...Array(SIZE * SIZE).keys()].filter(
    (c) =>
      !t.fireflies.some(
        (f) =>
          Math.abs((f % SIZE) - (c % SIZE)) <= 1 &&
          Math.abs(Math.floor(f / SIZE) - Math.floor(c / SIZE)) <= 1,
      ),
  );
  for (let i = 0; i < SHINES + 2 && t.outcome === "playing"; i++)
    t = tickNight(tapForest(run(t, tickNight, 2), empty[i % empty.length]!), 5);
  assert.equal(t.outcome, "lost");
  assert.equal(tapForest(createNight(1), 99).shines, SHINES);
});

test("feast: picking each ordered food fills six plates over three courses", () => {
  for (const seed of [2, 7]) {
    let g = createFeast(seed);
    const stages = new Set<number>();
    for (let i = 0; i < 20000 && g.outcome === "playing"; i++) {
      stages.add(g.stage);
      g = tickFeast(g, 0.05);
      const want = g.belt.find(
        (d) => g.order.includes(d.food) && !g.plate.includes(d.food) && d.x < 0.9,
      );
      if (want) g = pickDish(g, want.id);
    }
    assert.equal(g.outcome, "won", `seed ${seed}`);
    assert.equal(g.score, FEAST_GOAL);
    assert.equal(g.misses, 0);
    assert.deepEqual([...stages].sort(), [1, 2, 3]);
  }
});
test("feast: foods not on the order are mistakes; three lose; time runs out", () => {
  let g = createFeast(2);
  for (let i = 0; i < 4000 && g.outcome === "playing"; i++) {
    g = tickFeast(g, 0.05);
    const wrong = g.belt.find((d) => !g.order.includes(d.food));
    if (wrong) g = pickDish(g, wrong.id);
  }
  assert.equal(g.outcome, "lost");
  assert.equal(g.misses, FEAST_MISSES);
  assert.equal(run(createFeast(2), tickFeast, 121).outcome, "lost");
  assert.equal(pickDish(createFeast(1), 999).misses, 0);
});

test("dino: photographing each calm new dino in the frame fills the book of eight", () => {
  for (const seed of [1, 4, 9]) {
    let g = createDino(seed);
    const stages = new Set<number>();
    for (let i = 0; i < 60000 && g.outcome === "playing"; i++) {
      stages.add(g.stage);
      g = tickDino(g, 0.03);
      const w = g.walker;
      if (
        inFrame(w) &&
        w.startled === 0 &&
        !g.book.includes(w.species) &&
        Math.abs(w.x - 0.5) < 0.05
      )
        g = snap(g);
    }
    assert.equal(g.outcome, "won", `seed ${seed}`);
    assert.equal(new Set(g.book).size, DINO_GOAL);
    assert.ok(g.film > 0);
    assert.deepEqual([...stages].sort(), [1, 2, 3]);
  }
  assert.equal(DINOS.length, DINO_GOAL);
});
test("dino: a startled dino is a safety warning; three warnings lose; empty shots use film", () => {
  let g = createDino(1);
  g = { ...g, walker: { ...g.walker, x: 0.5, startled: 1 } };
  for (let i = 0; i < DINO_WARNINGS; i++) g = snap(g);
  assert.equal(g.outcome, "lost");
  let e = createDino(1);
  for (let i = 0; i < FILM; i++) e = snap(e);
  assert.equal(e.outcome, "lost", "all film used on an empty frame");
  assert.equal(e.film, 0);
});
