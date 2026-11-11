import { nextRandom, type Outcome } from "../arcade.ts";

// lg-16 바다 러너: swim on the surface or dive under. Buoys and boats float on top, rocks and
// jellyfish wait below, and pearls lie only underwater. Air runs out while diving, so come up to
// breathe. Five pearls per stage, three stages, 3 hearts.
export const SEA_GOAL = 15;
export const PEARLS_PER_STAGE = 5;
export const SEA_HEARTS = 3;
export const AIR_SECONDS = 4;
export const SWIMMER_X = 0.2;
export type Depth = "top" | "deep";
export type SeaThing = {
  id: number;
  x: number;
  depth: Depth;
  kind: "pearl" | "block";
  done: boolean;
};
export type SeaGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  hearts: number;
  depth: Depth;
  air: number;
  things: SeaThing[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const seaStage = (score: number) =>
  Math.min(3, 1 + Math.floor(score / PEARLS_PER_STAGE)) as 1 | 2 | 3;
export const createSea = (seed = 1): SeaGame => ({
  outcome: "playing",
  score: 0,
  stage: 1,
  hearts: SEA_HEARTS,
  depth: "top",
  air: AIR_SECONDS,
  things: [],
  nextId: 1,
  spawnIn: 0.4,
  seed,
});
export const setDepth = (g: SeaGame, depth: Depth): SeaGame =>
  g.outcome !== "playing" || g.depth === depth ? g : { ...g, depth };
export function tickSea(g: SeaGame, dt: number): SeaGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let { seed, nextId, spawnIn, hearts, score, depth, air } = g;
  const speed = 0.3 + g.stage * 0.06;
  const things: SeaThing[] = [];
  for (const t of g.things) {
    const moved = { ...t, x: t.x - speed * step };
    if (!moved.done && moved.depth === depth && Math.abs(moved.x - SWIMMER_X) < 0.05) {
      moved.done = true;
      if (moved.kind === "pearl") score += 1;
      else hearts -= 1;
    }
    if (moved.x > -0.1) things.push(moved);
  }
  air = depth === "deep" ? air - step : Math.min(AIR_SECONDS, air + step * 2);
  if (air <= 0) {
    hearts -= 1;
    depth = "top";
    air = AIR_SECONDS / 2;
  }
  spawnIn -= step;
  if (spawnIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    let where: Depth = r < 0.5 ? "top" : "deep";
    [r, seed] = nextRandom(seed);
    let kind: SeaThing["kind"] = where === "deep" && r < 0.55 ? "pearl" : "block";
    // Blocks keep a gap between them, so one way is always open and no one has to stay under
    // longer than a breath: a block that would come too close becomes a pearl below instead.
    if (kind === "block" && things.some((t) => t.kind === "block" && t.x > 0.65)) {
      kind = "pearl";
      where = "deep";
    }
    things.push({ id: nextId++, x: 1.05, depth: where, kind, done: false });
    [r, seed] = nextRandom(seed);
    spawnIn = 0.8 + r * 0.5 - g.stage * 0.08;
  }
  score = Math.min(SEA_GOAL, score);
  const outcome: Outcome = hearts <= 0 ? "lost" : score >= SEA_GOAL ? "won" : "playing";
  return {
    ...g,
    things,
    seed,
    nextId,
    spawnIn,
    hearts: Math.max(0, hearts),
    score,
    depth,
    air,
    stage: seaStage(score),
    outcome,
  };
}
