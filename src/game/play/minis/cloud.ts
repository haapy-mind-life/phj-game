import { nextRandom, type Outcome } from "../arcade.ts";

// mn-12 구름 뛰기: a cloud drifts across under the jump mark; press 점프 while it is under the
// mark to land on it. Jumping when it isn't there is a fall. Clouds speed up as you climb.
export const CLOUD_GOAL = 10;
export const CLOUD_FALLS = 3;
export const CLOUD_SECONDS = 60;
/** The jump mark sits in the middle; a cloud is under it within this distance. */
export const MARK = 0.5;
export const CLOUD_HALF = 0.13;
export type Cloud = { x: number; dir: -1 | 1; speed: number };
export type CloudGame = {
  outcome: Outcome;
  score: number;
  falls: number;
  remaining: number;
  cloud: Cloud;
  seed: number;
};
function nextCloud(score: number, seed: number): [Cloud, number] {
  const [r, s] = nextRandom(seed);
  const dir: -1 | 1 = r < 0.5 ? 1 : -1;
  return [{ x: dir === 1 ? -0.1 : 1.1, dir, speed: 0.32 + score * 0.03 }, s];
}
export function createCloud(seed = 1): CloudGame {
  const [cloud, s] = nextCloud(0, seed);
  return { outcome: "playing", score: 0, falls: 0, remaining: CLOUD_SECONDS, cloud, seed: s };
}
export const underMark = (c: Cloud) => Math.abs(c.x - MARK) <= CLOUD_HALF;

export function tickCloud(g: CloudGame, dt: number): CloudGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let { cloud, seed } = g;
  cloud = { ...cloud, x: cloud.x + cloud.dir * cloud.speed * step };
  // A cloud that drifted away is simply replaced; only a wrong jump is a fall.
  if (cloud.x < -0.15 || cloud.x > 1.15) [cloud, seed] = nextCloud(g.score, seed);
  const remaining = Math.max(0, g.remaining - step);
  return { ...g, cloud, seed, remaining, outcome: remaining === 0 ? "lost" : "playing" };
}

export function jumpCloud(g: CloudGame): CloudGame {
  if (g.outcome !== "playing") return g;
  if (!underMark(g.cloud)) {
    const falls = g.falls + 1;
    const [cloud, seed] = nextCloud(g.score, g.seed);
    return { ...g, falls, cloud, seed, outcome: falls >= CLOUD_FALLS ? "lost" : "playing" };
  }
  const score = g.score + 1;
  const [cloud, seed] = nextCloud(score, g.seed);
  return { ...g, score, cloud, seed, outcome: score >= CLOUD_GOAL ? "won" : "playing" };
}
