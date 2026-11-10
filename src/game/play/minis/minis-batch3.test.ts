import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COOK_GOAL,
  COOK_MISSES,
  addIngredient,
  createCook,
  tickCook,
  type Ingredient,
} from "./cook.ts";
import { THINGS, TIDY_GOAL, TIDY_MISSES, ZONES, createTidy, putAway, tickTidy } from "./tidy.ts";
import {
  BOX_GOAL,
  BOX_MISSES,
  SHOW_SECONDS,
  createBox,
  openBox,
  tickBox,
  turnDial,
} from "./box.ts";
import {
  ASSEMBLE_GOAL,
  ASSEMBLE_MISSES,
  createAssemble,
  outline,
  pickPart,
  placePart,
  tickAssemble,
} from "./assemble.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.1) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

test("cook: following each card makes six dishes; cards grow longer", () => {
  let g = createCook(4);
  const lengths: number[] = [];
  while (g.outcome === "playing") {
    if (g.step === 0) lengths.push(g.recipe.length);
    g = addIngredient(g, g.recipe[g.step]!);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, COOK_GOAL);
  assert.equal(g.misses, 0);
  assert.ok(lengths[0]! < lengths[lengths.length - 1]!);
});
test("cook: wrong ingredients are mistakes and keep progress; three lose; time runs out", () => {
  let g = createCook(4);
  g = addIngredient(g, g.recipe[0]!);
  const wrong = ([0, 1, 2, 3, 4, 5] as Ingredient[]).find((i) => i !== g.recipe[1])!;
  g = addIngredient(g, wrong);
  assert.equal(g.step, 1);
  assert.equal(g.misses, 1);
  g = addIngredient(addIngredient(g, wrong), wrong);
  assert.equal(g.outcome, "lost");
  assert.equal(g.misses, COOK_MISSES);
  assert.equal(run(createCook(1), tickCook, 61).outcome, "lost");
  const c = createCook(1);
  assert.equal(tickCook(c, Number.NaN), c);
});

test("tidy: putting each thing in its place wins at 12; the same thing never comes twice in a row", () => {
  let g = createTidy(6);
  let prev = -1;
  while (g.outcome === "playing") {
    assert.notEqual(g.thing, prev);
    prev = g.thing;
    g = putAway(g, THINGS[g.thing]!.zone);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, TIDY_GOAL);
});
test("tidy: wrong places are mistakes; three lose; idling runs out of time", () => {
  let g = createTidy(6);
  const wrong = ZONES.find((z) => z !== THINGS[g.thing]!.zone)!;
  for (let i = 0; i < TIDY_MISSES; i++) g = putAway(g, wrong);
  assert.equal(g.outcome, "lost");
  assert.equal(putAway(g, THINGS[g.thing]!.zone), g);
  assert.equal(run(createTidy(1), tickTidy, 61).outcome, "lost");
});

test("box: dials are locked while the code shows; matching it opens five boxes", () => {
  let g = createBox(3);
  assert.equal(turnDial(g, 0), g, "locked while showing");
  assert.equal(openBox(g), g);
  while (g.outcome === "playing") {
    const code = g.code;
    g = run(g, tickBox, SHOW_SECONDS + 0.1);
    for (const i of [0, 1, 2] as const) while (g.dials[i] !== code[i]) g = turnDial(g, i);
    g = openBox(g);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, BOX_GOAL);
});
test("box: a wrong code is a mistake and shows the code again; three lose; time runs out", () => {
  let g = run(createBox(3), tickBox, SHOW_SECONDS + 0.1);
  if (g.dials.every((d, i) => d === g.code[i])) g = turnDial(g, 0);
  for (let i = 0; i < BOX_MISSES; i++) {
    g = openBox(g);
    if (g.outcome === "playing") {
      assert.equal(g.showing, SHOW_SECONDS);
      g = run(g, tickBox, SHOW_SECONDS + 0.1);
    }
  }
  assert.equal(g.outcome, "lost");
  assert.equal(run(createBox(1), tickBox, 121).outcome, "lost");
});

test("assemble: picking each part and its place builds four robots; later robots have more parts", () => {
  let g = createAssemble(9);
  const sizes: number[] = [];
  while (g.outcome === "playing") {
    if (!g.placed.length) sizes.push(outline(g).length);
    const part = g.tray[0]!;
    g = placePart(pickPart(g, part), part);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, ASSEMBLE_GOAL);
  assert.deepEqual(sizes, [4, 4, 5, 5]);
});
test("assemble: a wrong place is a mistake and the part stays; three lose; no place without a part", () => {
  let g = createAssemble(9);
  assert.equal(placePart(g, "head"), g, "nothing picked");
  const part = g.tray[0]!;
  const wrong = outline(g).find((s) => s !== part)!;
  for (let i = 0; i < ASSEMBLE_MISSES; i++) {
    g = placePart(pickPart(g, part), wrong);
    if (i < ASSEMBLE_MISSES - 1) assert.ok(g.tray.includes(part));
  }
  assert.equal(g.outcome, "lost");
  assert.equal(pickPart(createAssemble(1), "armL").picked, null, "first robots have no left arm");
  assert.equal(run(createAssemble(1), tickAssemble, 121).outcome, "lost");
});
