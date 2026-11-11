import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLUES,
  CONTINENTS,
  EARTH_GOAL,
  EARTH_MISSES,
  clueSeconds,
  createEarth,
  flyTo,
  tickEarth,
  topic,
} from "./earth.ts";
import { GOODS, THAI_GOAL, THAI_MISSES, buy, createThai, listSize, tickThai } from "./thai.ts";
import {
  ISLAND_GOAL,
  ISLAND_MISSES,
  createIsland,
  digIsland,
  sizeFor,
  tickIsland,
} from "./island.ts";
import {
  GOLD_GOAL,
  compass,
  createGold,
  sideFor,
  tickGold,
  walk,
  type Dir,
  type GoldGame,
} from "./goldking.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.1) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

test("earth: every clue has one continent; flying right wins eight stamps over three stages", () => {
  for (const c of CLUES) assert.ok(CONTINENTS.includes(c.at));
  let g = createEarth(4);
  const stages = new Set<number>();
  while (g.outcome === "playing") {
    stages.add(g.stage);
    g = flyTo(tickEarth(g, 1), CLUES[g.clue]!.at);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, EARTH_GOAL);
  assert.deepEqual([...stages].sort(), [1, 2, 3]);
  assert.ok(clueSeconds(1) > clueSeconds(3));
});
test("earth: wrong continents and running out of time are mistakes; three lose", () => {
  let g = createEarth(4);
  g = flyTo(
    g,
    CONTINENTS.find((c) => c !== CLUES[g.clue]!.at)!,
  );
  assert.equal(g.misses, 1);
  assert.equal(flyTo(g, "남극" as never), g);
  assert.equal(run(g, tickEarth, 25).outcome, "lost");
  assert.equal(run(createEarth(1), tickEarth, 31).misses, EARTH_MISSES);
});

test("thai: buying what each list asks for finishes three markets; lists grow 3 → 4 → 5", () => {
  let g = createThai(6);
  const sizes: number[] = [];
  while (g.outcome === "playing") {
    if (!g.bought.length) sizes.push(g.list.length);
    assert.equal(new Set(g.stall).size, 6);
    for (const item of g.list) assert.ok(g.stall.includes(item));
    g = buy(
      g,
      g.list.find((i) => !g.bought.includes(i))!,
    );
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, THAI_GOAL);
  assert.deepEqual(sizes, [listSize(1), listSize(2), listSize(3)]);
});
test("thai: off-list goods are mistakes; buying twice is ignored; three lose; time runs out", () => {
  let g = createThai(6);
  const first = g.list[0]!;
  g = buy(g, first);
  assert.equal(buy(g, first), g, "already bought");
  const off = g.stall.find((i) => !g.list.includes(i))!;
  for (let i = 0; i < THAI_MISSES; i++) g = buy(g, off);
  assert.equal(g.outcome, "lost");
  assert.equal(buy(createThai(1), GOODS.length + 3).score, 0);
  assert.equal(run(createThai(1), tickThai, 151).outcome, "lost");
});

test("island: digging where the clue points finds six treasures; the map grows 3 → 4 → 5", () => {
  let g = createIsland(2);
  const sizes = new Set<number>();
  while (g.outcome === "playing") {
    sizes.add(sizeFor(g.stage));
    assert.ok(g.row < sizeFor(g.stage) && g.col < sizeFor(g.stage));
    g = digIsland(g, g.row, g.col);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, ISLAND_GOAL);
  assert.deepEqual([...sizes].sort(), [3, 4, 5]);
});
test("island: wrong squares are mistakes; off-map digs are ignored; three lose; time runs out", () => {
  let g = createIsland(2);
  const wrongCol = (g.col + 1) % 3;
  for (let i = 0; i < ISLAND_MISSES; i++) g = digIsland(g, g.row, wrongCol);
  assert.equal(g.outcome, "lost");
  const c = createIsland(1);
  assert.equal(digIsland(c, 3, 0), c, "a 3×3 map has no fourth row");
  assert.equal(digIsland(c, 0.5, 0), c);
  assert.equal(run(createIsland(1), tickIsland, 121).outcome, "lost");
});

function follow(g: GoldGame): GoldGame {
  const c = compass(g)!;
  const d: Dir = c.arrow.includes("⬆")
    ? "up"
    : c.arrow.includes("⬇")
      ? "down"
      : c.arrow.includes("⬅")
        ? "left"
        : "right";
  return walk(g, d);
}
test("goldking: following the compass picks up six coins within the step budget", () => {
  for (const seed of [1, 5, 13]) {
    let g = createGold(seed);
    const sides = new Set<number>();
    while (g.outcome === "playing") {
      sides.add(sideFor(g.stage));
      g = follow(g);
    }
    assert.equal(g.outcome, "won", `seed ${seed}`);
    assert.equal(g.score, GOLD_GOAL);
    assert.deepEqual([...sides].sort(), [5, 6, 7]);
  }
});
test("goldking: walking away from the coins uses up the steps and loses; edges stop you", () => {
  let g = createGold(1);
  const start = g;
  for (let i = 0; i < 200 && g.outcome === "playing"; i++) g = walk(g, i % 2 ? "up" : "down");
  assert.equal(g.outcome === "lost" || g.score < GOLD_GOAL, true);
  let edge = start;
  for (let i = 0; i < 10; i++) edge = walk(edge, "left");
  assert.equal(edge.x, 0);
  assert.equal(walk({ ...edge, coins: [[4, 4]] }, "left").x, 0);
  assert.equal(walk(start, "sideways" as never), start);
  assert.equal(tickGold(start, 5), start);
  assert.equal(compass({ ...start, x: 1, y: 1, coins: [[2, 1]] })!.far, "바로 옆");
});

test("earth: clue questions use the right Korean particle", () => {
  assert.equal(topic("판다"), "판다는");
  assert.equal(topic("자유의 여신상"), "자유의 여신상은");
  assert.equal(topic("에펠탑"), "에펠탑은");
  assert.equal(topic("코알라"), "코알라는");
});
