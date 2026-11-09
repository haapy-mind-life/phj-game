import { nextRandom, type Outcome } from "../arcade.ts";

// mn-02 풍선 터뜨리기: balloons float up three lanes; tap one while it is inside the gold ring.
// A tap outside the ring is a miss and the balloon floats on. Balloons that float away cost nothing.
export const BALLOON_GOAL = 10;
export const BALLOON_SECONDS = 45;
export const BALLOON_MISSES = 5;
/** The gold ring, as height from the bottom (0) to the top (1). */
export const RING = { from: 0.45, to: 0.62 } as const;
const MAX_ON_SCREEN = 4;
export type Balloon = { id: number; lane: 0 | 1 | 2; y: number; speed: number };
export type BalloonGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  balloons: Balloon[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const createBalloons = (seed = 1): BalloonGame => ({
  outcome: "playing",
  score: 0,
  misses: 0,
  remaining: BALLOON_SECONDS,
  balloons: [],
  nextId: 1,
  spawnIn: 0,
  seed,
});
export const inRing = (b: Balloon) => b.y >= RING.from && b.y <= RING.to;

export function tickBalloons(g: BalloonGame, dt: number): BalloonGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.25);
  let { seed, nextId, spawnIn } = g;
  const balloons = g.balloons
    .map((b) => ({ ...b, y: b.y + b.speed * step }))
    .filter((b) => b.y <= 1.05);
  spawnIn -= step;
  if (spawnIn <= 0 && balloons.length < MAX_ON_SCREEN) {
    let r: number;
    [r, seed] = nextRandom(seed);
    const lane = Math.min(2, Math.floor(r * 3)) as 0 | 1 | 2;
    [r, seed] = nextRandom(seed);
    balloons.push({ id: nextId++, lane, y: 0, speed: 0.17 + r * 0.12 });
    [r, seed] = nextRandom(seed);
    spawnIn = 0.9 + r * 0.6;
  }
  const remaining = Math.max(0, g.remaining - step);
  return {
    ...g,
    balloons,
    seed,
    nextId,
    spawnIn,
    remaining,
    outcome: remaining === 0 ? "lost" : "playing",
  };
}

export function tapBalloon(g: BalloonGame, id: number): BalloonGame {
  if (g.outcome !== "playing") return g;
  const b = g.balloons.find((x) => x.id === id);
  if (!b) return g;
  if (!inRing(b)) {
    const misses = g.misses + 1;
    return { ...g, misses, outcome: misses >= BALLOON_MISSES ? "lost" : "playing" };
  }
  const score = g.score + 1;
  return {
    ...g,
    score,
    balloons: g.balloons.filter((x) => x.id !== id),
    outcome: score >= BALLOON_GOAL ? "won" : "playing",
  };
}
