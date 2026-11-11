import { test } from "node:test";
import assert from "node:assert/strict";
import { ANSWER, DUEL_GOAL, DUEL_HEARTS, answer, createDuel, tickDuel, windowFor } from "./duel.ts";
import {
  FUSE_GOAL,
  FUSE_MISSES,
  PARTS,
  createFuse,
  lengthFor,
  litPart,
  pressPart,
  tickFuse,
} from "./legendfuse.ts";
import {
  SHIP_Y,
  SPACE_GOAL,
  createSpace,
  fire,
  moveShip,
  raiseShield,
  tickSpace,
  type SpaceGame,
} from "./space.ts";
import { CRACK_GOAL, CRACK_MISSES, createCrack, inGreen, tapCrack, tickCrack } from "./crack.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.05) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

test("duel: answering every signal right beats three rivals; the window shortens each stage", () => {
  let g = createDuel(3);
  const stages = new Set<number>();
  while (g.outcome === "playing") {
    stages.add(g.stage);
    g = answer(tickDuel(g, 0.3), ANSWER[g.signal]);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, DUEL_GOAL);
  assert.equal(g.hearts, DUEL_HEARTS);
  assert.deepEqual([...stages].sort(), [1, 2, 3]);
  assert.ok(windowFor(1) > windowFor(2) && windowFor(2) > windowFor(3));
});
test("duel: wrong answers and waiting cost hearts; three lose; unknown answers are ignored", () => {
  let g = createDuel(3);
  const wrong = (["dodge", "charge", "attack"] as const).find((a) => a !== ANSWER[g.signal])!;
  g = answer(g, wrong);
  assert.equal(g.hearts, DUEL_HEARTS - 1);
  assert.equal(answer(g, "jump" as never), g);
  assert.equal(run(g, tickDuel, 10).outcome, "lost");
});

test("legendfuse: the show lights each part in order; repeating it wins six fusions over three stages", () => {
  let g = createFuse(5);
  const stages = new Set<number>();
  while (g.outcome === "playing") {
    stages.add(g.stage);
    const seen: string[] = [];
    while (g.showing > 0) {
      const lit = litPart(g);
      if (lit && seen[seen.length - 1] !== lit + seen.length) seen.push(lit + seen.length);
      g = tickFuse(g, 0.05);
    }
    assert.equal(pressPart(createFuse(5), "head").step, 0, "locked while the show plays");
    for (const p of g.order) g = pressPart(g, p);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, FUSE_GOAL);
  assert.deepEqual([...stages].sort(), [1, 2, 3]);
  assert.ok(lengthFor(0) < lengthFor(5));
});
test("legendfuse: wrong parts or waiting are mistakes; three lose", () => {
  let g = run(createFuse(5), tickFuse, 3);
  const wrong = PARTS.find((p) => p !== g.order[0])!;
  g = pressPart(g, wrong);
  assert.equal(g.misses, 1);
  assert.ok(g.showing > 0, "the order shows again");
  assert.equal(pressPart(g, "tail" as never), g);
  g = run(g, tickFuse, 30);
  assert.equal(g.outcome, "lost");
  assert.equal(g.misses, FUSE_MISSES);
});

function pilot(g: SpaceGame): SpaceGame {
  const mine = g.things.filter((t) => t.lane === g.lane).sort((a, b) => b.y - a.y)[0];
  if (mine?.kind === "drone") return fire(g);
  if (mine?.kind === "rock" && mine.y > 0.55) {
    const free = ([0, 1, 2] as const).find((l) => !g.things.some((t) => t.lane === l && t.y > 0.5));
    if (free !== undefined) return moveShip(g, free > g.lane ? 1 : -1);
    if (mine.y > 0.8) return raiseShield(g);
  }
  const drone = g.things.filter((t) => t.kind === "drone").sort((a, b) => b.y - a.y)[0];
  if (
    drone &&
    drone.lane !== g.lane &&
    !g.things.some((t) => t.kind === "rock" && t.lane === drone.lane && t.y > 0.5)
  )
    return moveShip(g, drone.lane > g.lane ? 1 : -1);
  return g;
}
test("space: shooting drones and stepping around rocks wins three waves", () => {
  for (const seed of [2, 8, 21]) {
    let g = createSpace(seed);
    const stages = new Set<number>();
    for (let i = 0; i < 60000 && g.outcome === "playing"; i++) {
      stages.add(g.stage);
      g = tickSpace(pilot(g), 0.03);
    }
    assert.equal(g.outcome, "won", `seed ${seed}`);
    assert.equal(g.score, SPACE_GOAL);
    assert.deepEqual([...stages].sort(), [1, 2, 3]);
  }
});
test("space: a ship that does nothing loses; the shield blocks one hit then needs to recharge", () => {
  assert.equal(run(createSpace(2), tickSpace, 120).outcome, "lost");
  let g: SpaceGame = {
    ...createSpace(1),
    things: [{ id: 99, lane: 1 as const, y: SHIP_Y - 0.01, kind: "rock" as const }],
  };
  g = raiseShield(g);
  assert.equal(raiseShield(g), g, "already up");
  g = tickSpace(g, 0.1);
  assert.equal(g.hearts, 3, "the shield took the rock");
  const empty = createSpace(1);
  assert.equal(fire(empty), empty, "nothing to shoot");
});

test("crack: tapping in the green cracks twelve peanuts; the green narrows each stage", () => {
  let g = createCrack();
  const stages = new Set<number>();
  for (let i = 0; i < 20000 && g.outcome === "playing"; i++) {
    stages.add(g.stage);
    g = tickCrack(g, 0.02);
    if (inGreen(g)) g = tapCrack(g);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, CRACK_GOAL);
  assert.equal(g.misses, 0);
  assert.deepEqual([...stages].sort(), [1, 2, 3]);
});
test("crack: tapping outside the green and leaving a peanut are mistakes; three lose", () => {
  let g = createCrack();
  g = tapCrack(g);
  assert.equal(g.misses, 1, "bar starts outside the green");
  g = run(g, tickCrack, 9, 0.05);
  assert.equal(g.outcome, "lost");
  assert.equal(g.misses, CRACK_MISSES);
  const c = createCrack();
  assert.equal(tickCrack(c, Number.NaN), c);
});
