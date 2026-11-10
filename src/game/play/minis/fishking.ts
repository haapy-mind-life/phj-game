import { nextRandom, type Outcome } from "../arcade.ts";

// mn-06 낚시왕: wait for a bite. When the float bobs, a needle swings across the pull gauge; press
// 당기기 while it is in the green part. Pulling outside the green, or before a bite, snaps the line.
// A bite left alone swims away. 60 s, 5 fish, 3 snapped lines.
export const FISH_GOAL = 5;
export const FISH_SNAPS = 3;
export const FISH_SECONDS = 60;
export const BITE_SECONDS = 3;
export const GREEN = 0.2;
export type FishGame = {
  outcome: Outcome;
  score: number;
  snaps: number;
  remaining: number;
  phase: "waiting" | "bite";
  /** Seconds until the next bite, or left in this bite. */
  left: number;
  /** Needle 0…1 and where the green part starts. */
  needle: number;
  dir: 1 | -1;
  green: number;
  seed: number;
};
function wait(g: FishGame): FishGame {
  const [r, seed] = nextRandom(g.seed);
  return { ...g, seed, phase: "waiting", left: 1 + r * 2, needle: 0, dir: 1 };
}
function bite(g: FishGame): FishGame {
  const [r, seed] = nextRandom(g.seed);
  return { ...g, seed, phase: "bite", left: BITE_SECONDS, green: 0.15 + r * (0.85 - GREEN - 0.15) };
}
export const createFish = (seed = 1): FishGame =>
  wait({
    outcome: "playing",
    score: 0,
    snaps: 0,
    remaining: FISH_SECONDS,
    phase: "waiting",
    left: 0,
    needle: 0,
    dir: 1,
    green: 0.4,
    seed,
  });
export const inGreen = (g: FishGame) =>
  g.phase === "bite" && g.needle >= g.green && g.needle <= g.green + GREEN;
export function pull(g: FishGame): FishGame {
  if (g.outcome !== "playing") return g;
  if (!inGreen(g)) {
    const snaps = g.snaps + 1;
    if (snaps >= FISH_SNAPS) return { ...g, snaps, outcome: "lost" };
    return wait({ ...g, snaps });
  }
  const score = g.score + 1;
  if (score >= FISH_GOAL) return { ...g, score, outcome: "won" };
  return wait({ ...g, score });
}
export function tickFish(g: FishGame, dt: number): FishGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  const remaining = Math.max(0, g.remaining - step);
  if (remaining === 0) return { ...g, remaining, outcome: "lost" };
  const left = g.left - step;
  if (g.phase === "waiting")
    return left <= 0 ? bite({ ...g, remaining }) : { ...g, remaining, left };
  if (left <= 0) return wait({ ...g, remaining }); // the fish swam away
  let needle = g.needle + g.dir * step * 0.9;
  let dir = g.dir;
  if (needle >= 1) [needle, dir] = [1, -1];
  if (needle <= 0) [needle, dir] = [0, 1];
  return { ...g, remaining, left, needle, dir };
}
