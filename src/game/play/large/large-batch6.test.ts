import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CAR_ZONE,
  CHAMP_GOAL,
  COURSE,
  createChampion,
  rivalSpeed,
  steerCar,
  tickChampion,
  type ChampionGame,
} from "./champion.ts";
import { SKY_GOAL, createSky, setClimb, tickSky, type SkyGame } from "./sky.ts";
import { AIR_SECONDS, SEA_GOAL, createSea, setDepth, tickSea, type SeaGame } from "./sea.ts";
import {
  NEEDS,
  RUN_GOAL,
  changeForm,
  createRobotRun,
  nextBlock,
  tickRobotRun,
} from "./robotrun.ts";

const run = <G>(g: G, tick: (g: G, dt: number) => G, seconds: number, dt = 0.05) => {
  for (let t = 0; t < seconds; t += dt) g = tick(g, dt);
  return g;
};

/** Steer away from rocks, toward boost pads, one lane at a time and never into a rock. */
function drive(g: ChampionGame): ChampionGame {
  const has = (lane: number, kind: string, from: number, to: number) =>
    g.items.some((i) => !i.used && i.kind === kind && i.lane === lane && i.y > from && i.y < to);
  const near = (lane: number, kind: string) => has(lane, kind, 0.45, CAR_ZONE.to);
  const safe = ([0, 1, 2] as const).filter((l) => !near(l, "rock"));
  const want = safe.find((l) => near(l, "boost")) ?? (safe.includes(g.lane) ? g.lane : safe[0]);
  if (want === undefined || want === g.lane) return g;
  const step = want > g.lane ? 1 : -1;
  // Don't move into a lane where a rock is right at the car.
  if (has(g.lane + step, "rock", CAR_ZONE.from - 0.08, CAR_ZONE.to)) return g;
  return steerCar(g, step);
}
test("champion: dodging rocks and taking boosts wins all three courses", () => {
  for (const seed of [1, 7, 42]) {
    let g = createChampion(seed);
    const stages = new Set<number>();
    for (let i = 0; i < 40000 && g.outcome === "playing"; i++) {
      stages.add(g.stage);
      g = tickChampion(drive(g), 0.03);
    }
    assert.equal(g.outcome, "won", `seed ${seed}`);
    assert.equal(g.score, CHAMP_GOAL);
    assert.deepEqual([...stages].sort(), [1, 2, 3]);
  }
});
test("champion: a car that never steers bumps rocks and loses; the rival is slower than a clean car", () => {
  for (const stage of [1, 2, 3]) assert.ok(rivalSpeed(stage) < 2, `stage ${stage}`);
  assert.ok(rivalSpeed(3) > rivalSpeed(1));
  for (const seed of [1, 3, 9])
    assert.equal(run(createChampion(seed), tickChampion, 120).outcome, "lost", `seed ${seed}`);
  const g = createChampion(1);
  assert.equal(tickChampion(g, Number.NaN), g);
  assert.equal(steerCar(steerCar(steerCar(g, -1), -1), -1).lane, 0);
  assert.ok(COURSE > 0);
});
test("champion: careful driving wins every seed", () => {
  for (let seed = 1; seed <= 30; seed++) {
    let g = createChampion(seed);
    for (let i = 0; i < 40000 && g.outcome === "playing"; i++) g = tickChampion(drive(g), 0.03);
    assert.equal(g.outcome, "won", `seed ${seed}`);
  }
});

function fly(g: SkyGame): SkyGame {
  const next = g.things
    .filter((t) => !t.done && t.x > 0.15 && t.kind !== "updraft")
    .sort((a, b) => a.x - b.x)[0];
  let target = next?.kind === "ring" ? next.h : 0.5;
  if (next?.kind === "bird") target = next.h > 0.5 ? next.h - 0.25 : next.h + 0.25;
  return setClimb(g, g.height < target);
}
test("sky: following the rings and passing birds wins three stages", () => {
  for (const seed of [2, 9]) {
    let g = createSky(seed);
    const stages = new Set<number>();
    for (let i = 0; i < 60000 && g.outcome === "playing"; i++) {
      stages.add(g.stage);
      g = tickSky(fly(g), 0.03);
    }
    assert.equal(g.outcome, "won", `seed ${seed}`);
    assert.equal(g.score, SKY_GOAL);
    assert.deepEqual([...stages].sort(), [1, 2, 3]);
  }
});
test("sky: letting go sinks to the ground three times and loses; holding up never touches the ground", () => {
  const idle = run(createSky(2), tickSky, 30);
  assert.equal(idle.outcome, "lost");
  const up = run(setClimb(createSky(2), true), tickSky, 5);
  assert.equal(up.height, 1);
  const g = createSky(1);
  assert.equal(setClimb(g, false), g);
});

function swim(g: SeaGame): SeaGame {
  const ahead = g.things
    .filter((t) => !t.done && t.x > 0.15 && t.x < 0.45)
    .sort((a, b) => a.x - b.x);
  const blockTop = ahead.some((t) => t.depth === "top" && t.kind === "block");
  const blockDeep = ahead.some((t) => t.depth === "deep" && t.kind === "block");
  const pearl = ahead.some((t) => t.depth === "deep" && t.kind === "pearl");
  if (g.depth === "deep" && (blockDeep || (g.air < 1.2 && !blockTop))) return setDepth(g, "top");
  if (g.depth === "top" && !blockDeep && ((blockTop && g.air > 0.6) || (pearl && g.air > 1.5)))
    return setDepth(g, "deep");
  return g;
}
test("sea: diving for pearls, dodging blocks and coming up for air wins three stages", () => {
  for (const seed of [4, 11]) {
    let g = createSea(seed);
    const stages = new Set<number>();
    for (let i = 0; i < 60000 && g.outcome === "playing"; i++) {
      stages.add(g.stage);
      g = tickSea(swim(g), 0.03);
    }
    assert.equal(g.outcome, "won", `seed ${seed}`);
    assert.equal(g.score, SEA_GOAL);
    assert.deepEqual([...stages].sort(), [1, 2, 3]);
  }
});
test("sea: blocks always keep a gap, so one way stays open", () => {
  for (const seed of [1, 4, 11, 23]) {
    let g = createSea(seed);
    for (let i = 0; i < 4000; i++) {
      g = tickSea(g, 0.03);
      const blocks = g.things.filter((t) => t.kind === "block");
      for (const a of blocks)
        for (const b of blocks)
          if (a !== b) assert.ok(Math.abs(a.x - b.x) >= 0.3, `seed ${seed}: blocks too close`);
      if (g.outcome !== "playing") g = createSea(seed + i);
    }
  }
});
test("sea: staying on top bumps into things; staying under runs out of air; both lose", () => {
  assert.equal(run(createSea(4), tickSea, 120).outcome, "lost");
  let deep = setDepth(createSea(4), "deep");
  deep = run(deep, tickSea, AIR_SECONDS + 0.2);
  assert.ok(deep.hearts < 3 || deep.outcome === "lost");
  assert.equal(deep.depth === "top" || deep.outcome === "lost", true, "out of air comes up");
});

test("robotrun: changing into the right form for each block wins three stages", () => {
  let g = createRobotRun(6);
  const stages = new Set<number>();
  for (let i = 0; i < 60000 && g.outcome === "playing"; i++) {
    stages.add(g.stage);
    const b = nextBlock(g);
    if (b) g = changeForm(g, NEEDS[b.kind]);
    g = tickRobotRun(g, 0.03);
  }
  assert.equal(g.outcome, "won");
  assert.equal(g.score, RUN_GOAL);
  assert.equal(g.hearts, 3);
  assert.deepEqual([...stages].sort(), [1, 2, 3]);
});
test("robotrun: one form for everything loses; unknown forms are ignored", () => {
  assert.equal(run(createRobotRun(6), tickRobotRun, 200).outcome, "lost");
  const g = createRobotRun(1);
  assert.equal(changeForm(g, "boat" as never), g);
  assert.equal(changeForm(g, "robot"), g, "already a robot");
});
