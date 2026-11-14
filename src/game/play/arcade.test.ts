import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARCADE,
  MINI_COMPLETION_BONUS,
  arcadeReward,
  isArcadeKey,
  normalizeArcadeBest,
  countdown,
  nextRandom,
} from "./arcade.ts";
import { KART_GAMES } from "./kart-catalog.ts";

test("every arcade game is in the kart catalog, playable on /mini/$game", () => {
  for (const g of ARCADE) {
    const entry = KART_GAMES.find((k) => k.id === g.catalogId);
    assert.ok(entry, g.catalogId);
    assert.ok(entry.kind === "mini" || entry.kind === "large", g.catalogId);
    assert.equal(entry.name, g.name);
    assert.equal(entry.status, "playable", g.catalogId);
    assert.equal("game" in entry && entry.game, g.key);
  }
  assert.equal(new Set(ARCADE.map((g) => g.key)).size, ARCADE.length);
});

test("no run pays more than 땅콩 톡톡's best (42 coins)", () => {
  for (const g of ARCADE) {
    const best = arcadeReward(g.key, g.goal);
    assert.equal(best, g.goal * g.coinsPerPoint + MINI_COMPLETION_BONUS, g.key);
    assert.ok(best <= 42, `${g.key} pays ${best}`);
    assert.equal(arcadeReward(g.key, g.goal + 50), best, "capped at the goal");
    assert.equal(arcadeReward(g.key, -3), 0);
    assert.equal(arcadeReward(g.key, Number.NaN), 0);
    assert.equal(
      arcadeReward(g.key, g.goal - 1),
      (g.goal - 1) * g.coinsPerPoint,
      "no bonus short of goal",
    );
  }
});

test("best scores: old saves load as 0, junk is dropped, values are clamped", () => {
  const empty = normalizeArcadeBest(undefined);
  for (const g of ARCADE) assert.equal(empty[g.key], 0);
  const out = normalizeArcadeBest({ balloons: 7.9, coins: 999, nope: 3, jump: "x", dodge: -2 });
  assert.equal(out.balloons, 7);
  assert.equal(out.coins, 15);
  assert.equal(out.jump, 0);
  assert.equal(out.dodge, 0);
  assert.equal("nope" in out, false);
  assert.deepEqual(normalizeArcadeBest(JSON.parse(JSON.stringify(out))), out);
});

test("isArcadeKey knows only the table", () => {
  assert.ok(isArcadeKey("balloons"));
  assert.equal(isArcadeKey("peanuts"), false);
  assert.equal(isArcadeKey(3), false);
});

test("nextRandom repeats for the same seed and stays in [0, 1)", () => {
  let a = 42,
    b = 42;
  for (let i = 0; i < 50; i++) {
    const [x, na] = nextRandom(a);
    const [y, nb] = nextRandom(b);
    assert.equal(x, y);
    assert.ok(x >= 0 && x < 1);
    a = na;
    b = nb;
  }
});

test("countdown runs the clock, caps a long frame and ends in a loss at zero", () => {
  const g = { remaining: 1, outcome: "playing" as const, score: 3 };
  assert.deepEqual(countdown(g, 0.1), { remaining: 0.9, outcome: "playing", score: 3 });
  assert.equal(countdown(g, 5).remaining, 0.75);
  for (const bad of [0, -1, Number.NaN, Infinity]) assert.equal(countdown(g, bad), g);
  const end = countdown({ remaining: 0.2, outcome: "playing" as const }, 0.25);
  assert.deepEqual(end, { remaining: 0, outcome: "lost" });
  const won = { remaining: 0.1, outcome: "won" as const };
  assert.equal(countdown(won, 0.25), won);
});
