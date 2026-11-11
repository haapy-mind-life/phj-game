import { nextRandom, type Outcome } from "../arcade.ts";

// lg-15 하늘 러너: hold 위로 to climb, let go to sink. Fly through rings as they come; touching
// the ground or (from stage 2) a bird costs a heart. Updrafts lift the plane. Five rings per stage,
// three stages, 3 hearts. Missed rings cost nothing but don't count.
export const SKY_GOAL = 15;
export const RINGS_PER_STAGE = 5;
export const SKY_HEARTS = 3;
export const PLANE_X = 0.2;
export const RING_HALF = 0.12;
export type SkyThing = {
  id: number;
  x: number;
  h: number;
  kind: "ring" | "bird" | "updraft";
  done: boolean;
};
export type SkyGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  hearts: number;
  /** Height 0 (ground) … 1 (top). */
  height: number;
  climbing: boolean;
  things: SkyThing[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const stageOf = (score: number) =>
  Math.min(3, 1 + Math.floor(score / RINGS_PER_STAGE)) as 1 | 2 | 3;
export const createSky = (seed = 1): SkyGame => ({
  outcome: "playing",
  score: 0,
  stage: 1,
  hearts: SKY_HEARTS,
  height: 0.5,
  climbing: false,
  things: [],
  nextId: 1,
  spawnIn: 0.5,
  seed,
});
export const setClimb = (g: SkyGame, climbing: boolean): SkyGame =>
  g.outcome !== "playing" || g.climbing === climbing ? g : { ...g, climbing };
export function tickSky(g: SkyGame, dt: number): SkyGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let { seed, nextId, spawnIn, hearts, score } = g;
  const speed = 0.28 + g.stage * 0.06;
  let lift = g.climbing ? 0.55 : -0.4;
  const things: SkyThing[] = [];
  for (const t of g.things) {
    const moved = { ...t, x: t.x - speed * step };
    const here = Math.abs(moved.x - PLANE_X) < 0.04;
    if (moved.kind === "updraft" && Math.abs(moved.x - PLANE_X) < 0.12) lift += 0.5;
    if (here && !moved.done) {
      if (moved.kind === "ring" && Math.abs(g.height - moved.h) <= RING_HALF) {
        moved.done = true;
        score += 1;
      } else if (moved.kind === "bird" && Math.abs(g.height - moved.h) <= 0.08) {
        moved.done = true;
        hearts -= 1;
      }
    }
    if (moved.x > -0.1) things.push(moved);
  }
  let height = g.height + lift * step;
  if (height <= 0) {
    hearts -= 1;
    height = 0.5;
  }
  height = Math.min(1, height);
  spawnIn -= step;
  if (spawnIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    const h = 0.2 + r * 0.6;
    [r, seed] = nextRandom(seed);
    const kind = g.stage >= 2 && r < 0.35 ? "bird" : r < 0.5 ? "updraft" : "ring";
    things.push({ id: nextId++, x: 1.05, h, kind, done: false });
    [r, seed] = nextRandom(seed);
    spawnIn = 1.1 + r * 0.6 - g.stage * 0.12;
  }
  score = Math.min(SKY_GOAL, score);
  const outcome: Outcome = hearts <= 0 ? "lost" : score >= SKY_GOAL ? "won" : "playing";
  return {
    ...g,
    things,
    seed,
    nextId,
    spawnIn,
    hearts: Math.max(0, hearts),
    height,
    score,
    stage: stageOf(score),
    outcome,
  };
}
