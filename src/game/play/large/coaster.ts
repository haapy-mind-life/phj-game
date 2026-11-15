import { nextRandom, type Outcome } from "../arcade.ts";

// lg-21 경찰 롤러코스터 (PROPOSED rules, 2026-11-15): the police car rides the rail looking
// ahead. Things come down the rail from far (z = 1) to the car (z = 0):
// - 🚧 bar: 「점프」 so the car is in the air when it arrives → 1 point.
// - 🤖 villain: 「에너지 발사」 before it reaches the car → 1 point.
// - 🪙 coin: low ones are picked up on the rail, high ones only in a jump. Every 5 coins grow
//   the small wings by one (most 2).
// Touching a bar or a villain uses up one wing; with no wing left it is out (lost).
// Five points a stage, three stages, faster each stage.
export const COASTER_GOAL = 15;
export const POINTS_PER_STAGE = 5;
export const START_WINGS = 1;
export const MAX_WINGS = 2;
export const COINS_PER_WING = 5;
export const JUMP_TIME = 0.75;
export const FIRE_COOLDOWN = 0.5;
/** A villain can be hit from this far down the rail. */
export const FIRE_REACH = 0.8;
/** Where a thing meets the car. */
export const CAR_Z = 0.05;

export type CoasterKind = "bar" | "villain" | "coin";
export type CoasterThing = {
  id: number;
  z: number;
  kind: CoasterKind;
  /** Coins only: a high coin needs a jump. */
  high: boolean;
  done: boolean;
};
export type CoasterGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  wings: number;
  coins: number;
  /** Seconds left in the air (0 on the rail). */
  air: number;
  cooldown: number;
  /** Seconds the energy beam stays on screen. */
  beam: number;
  /** Seconds the "bump" flash stays on screen after a hit. */
  bump: number;
  things: CoasterThing[];
  nextId: number;
  spawnIn: number;
  seed: number;
};

export const stageOf = (score: number) =>
  Math.min(3, 1 + Math.floor(score / POINTS_PER_STAGE)) as 1 | 2 | 3;
export const coasterSpeed = (stage: number) => 0.42 + stage * 0.08;

export const createCoaster = (seed = 1): CoasterGame => ({
  outcome: "playing",
  score: 0,
  stage: 1,
  wings: START_WINGS,
  coins: 0,
  air: 0,
  cooldown: 0,
  beam: 0,
  bump: 0,
  things: [],
  nextId: 1,
  spawnIn: 0.6,
  seed,
});

export const jump = (g: CoasterGame): CoasterGame =>
  g.outcome !== "playing" || g.air > 0 ? g : { ...g, air: JUMP_TIME };

/** Hits the nearest villain within reach. A miss still needs the short recharge. */
export function fire(g: CoasterGame): CoasterGame {
  if (g.outcome !== "playing" || g.cooldown > 0) return g;
  const target = g.things
    .filter((t) => t.kind === "villain" && !t.done && t.z <= FIRE_REACH && t.z > CAR_Z)
    .sort((a, b) => a.z - b.z)[0];
  const things = target
    ? g.things.map((t) => (t.id === target.id ? { ...t, done: true } : t))
    : g.things;
  const score = Math.min(COASTER_GOAL, g.score + (target ? 1 : 0));
  return {
    ...g,
    things,
    score,
    stage: stageOf(score),
    cooldown: FIRE_COOLDOWN,
    beam: 0.25,
    outcome: score >= COASTER_GOAL ? "won" : "playing",
  };
}

function pickKind(stage: number, r: number): CoasterKind {
  const villain = 0.15 + stage * 0.07;
  return r < villain ? "villain" : r < villain + 0.4 ? "bar" : "coin";
}

export function tickCoaster(g: CoasterGame, dt: number): CoasterGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  const airborne = g.air > 0;
  let { seed, nextId, spawnIn, wings, coins, score, bump } = g;
  let out = false;
  const hit = () => {
    if (wings > 0) wings -= 1;
    else out = true;
    bump = 0.4;
  };
  const speed = coasterSpeed(g.stage);
  const things: CoasterThing[] = [];
  for (const t of g.things) {
    const moved = { ...t, z: t.z - speed * step };
    if (!moved.done && moved.z <= CAR_Z) {
      moved.done = true;
      if (moved.kind === "bar") {
        if (airborne) score += 1;
        else hit();
      } else if (moved.kind === "villain") {
        hit();
      } else if (moved.high === airborne) {
        coins += 1;
        if (coins % COINS_PER_WING === 0) wings = Math.min(MAX_WINGS, wings + 1);
      }
    }
    if (moved.z > -0.1) things.push(moved);
  }
  spawnIn -= step;
  if (spawnIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    const kind = pickKind(g.stage, r);
    [r, seed] = nextRandom(seed);
    things.push({ id: nextId++, z: 1, kind, high: kind === "coin" && r < 0.4, done: false });
    [r, seed] = nextRandom(seed);
    // Never closer than a jump plus a little, so every bar can be cleared on its own.
    spawnIn = Math.max(0.95, 1.5 + r * 0.6 - g.stage * 0.15);
  }
  score = Math.min(COASTER_GOAL, score);
  const outcome: Outcome = out ? "lost" : score >= COASTER_GOAL ? "won" : "playing";
  return {
    ...g,
    things,
    seed,
    nextId,
    spawnIn,
    wings,
    coins,
    score,
    stage: stageOf(score),
    air: Math.max(0, g.air - step),
    cooldown: Math.max(0, g.cooldown - step),
    beam: Math.max(0, g.beam - step),
    bump: Math.max(0, bump - step),
    outcome,
  };
}
