import { test } from "node:test";
import assert from "node:assert/strict";
import { arcadeReward } from "../arcade.ts";
import {
  CAR_Z,
  COASTER_GOAL,
  COINS_PER_WING,
  FIRE_REACH,
  MAX_WINGS,
  START_WINGS,
  createCoaster,
  fire,
  jump,
  tickCoaster,
  type CoasterGame,
  type CoasterThing,
} from "./coaster.ts";

const at = (g: CoasterGame, ...things: Partial<CoasterThing>[]): CoasterGame => ({
  ...g,
  spawnIn: 99,
  nextId: 100,
  things: things.map((t, i) => ({
    id: i + 1,
    z: 0.1,
    kind: "bar",
    high: false,
    done: false,
    ...t,
  })),
});
/** Runs until every listed thing has reached the car. */
const pass = (g: CoasterGame) => {
  for (let i = 0; i < 40 && g.outcome === "playing" && g.things.some((t) => !t.done); i++)
    g = tickCoaster(g, 0.05);
  return g;
};

test("coaster: a bar cleared in a jump scores; touching it costs a wing, then it is out", () => {
  const g = createCoaster(3);
  assert.equal(g.wings, START_WINGS);
  const cleared = pass(jump(at(g, { kind: "bar" })));
  assert.equal(cleared.score, 1);
  assert.equal(cleared.wings, START_WINGS);
  const bumped = pass(at(g, { kind: "bar" }));
  assert.equal(bumped.score, 0);
  assert.equal(bumped.wings, START_WINGS - 1);
  assert.equal(bumped.outcome, "playing");
  const out = pass(at({ ...g, wings: 0 }, { kind: "bar" }));
  assert.equal(out.outcome, "lost");
});

test("coaster: the energy beam stops the nearest villain in reach, not one far away", () => {
  const g = at(createCoaster(), { kind: "villain", z: 0.5 }, { kind: "villain", z: 0.95 });
  const shot = fire(g);
  assert.equal(shot.score, 1);
  assert.deepEqual(
    shot.things.map((t) => t.done),
    [true, false],
  );
  // Recharging: a second shot right away does nothing.
  assert.equal(fire(shot), shot);
  const far = fire(at(createCoaster(), { kind: "villain", z: FIRE_REACH + 0.1 }));
  assert.equal(far.score, 0);
  assert.ok(far.cooldown > 0, "a miss still recharges");
  // A villain that reaches the car is a bump, even in a jump.
  const bumped = pass(jump(at(createCoaster(), { kind: "villain", z: CAR_Z + 0.02 })));
  assert.equal(bumped.wings, START_WINGS - 1);
});

test("coaster: low coins on the rail, high coins in a jump; 5 coins grow a wing up to 2", () => {
  const g = createCoaster();
  assert.equal(pass(at(g, { kind: "coin", high: false })).coins, 1);
  assert.equal(pass(jump(at(g, { kind: "coin", high: false }))).coins, 0);
  assert.equal(pass(at(g, { kind: "coin", high: true })).coins, 0);
  assert.equal(pass(jump(at(g, { kind: "coin", high: true }))).coins, 1);
  const grown = pass(at({ ...g, coins: COINS_PER_WING - 1 }, { kind: "coin" }));
  assert.equal(grown.wings, START_WINGS + 1);
  const capped = pass(
    at({ ...g, wings: MAX_WINGS, coins: 2 * COINS_PER_WING - 1 }, { kind: "coin" }),
  );
  assert.equal(capped.wings, MAX_WINGS);
});

test("coaster: 5 points a stage, faster rail, won at 15 and pays the large-game reward", () => {
  let g = createCoaster();
  assert.equal(g.stage, 1);
  g = pass(jump(at({ ...g, score: 4 }, { kind: "bar" })));
  assert.equal(g.stage, 2);
  const last = fire(
    at({ ...createCoaster(), score: COASTER_GOAL - 1 }, { kind: "villain", z: 0.3 }),
  );
  assert.equal(last.outcome, "won");
  assert.equal(last.stage, 3);
  assert.equal(arcadeReward("coaster", last.score), 40);
});

test("coaster: spawns keep bars a jump apart and the same seed plays the same rail", () => {
  const run = (seed: number) => {
    let g: CoasterGame = { ...createCoaster(seed), wings: 99 };
    const arrivals: { kind: string; t: number }[] = [];
    let t = 0;
    for (let i = 0; i < 1200; i++) {
      const before = new Set(g.things.filter((x) => x.done).map((x) => x.id));
      g = tickCoaster(g, 0.05);
      t += 0.05;
      for (const x of g.things) if (x.done && !before.has(x.id)) arrivals.push({ kind: x.kind, t });
    }
    return arrivals;
  };
  const a = run(7);
  assert.deepEqual(a, run(7));
  assert.ok(a.some((x) => x.kind === "bar") && a.some((x) => x.kind === "villain"));
  for (let i = 1; i < a.length; i++) assert.ok(a[i]!.t - a[i - 1]!.t >= 0.75, `gap at ${i}`);
});

test("coaster: bad dt, finished games and repeated jumps change nothing", () => {
  const g = createCoaster();
  for (const bad of [0, -1, Number.NaN, Infinity]) assert.equal(tickCoaster(g, bad), g);
  const up = jump(g);
  assert.equal(jump(up), up);
  const won: CoasterGame = { ...g, outcome: "won" };
  assert.equal(tickCoaster(won, 0.1), won);
  assert.equal(jump(won), won);
  assert.equal(fire(won), won);
});
