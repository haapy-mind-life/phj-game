import { nextRandom, type Outcome } from "../arcade.ts";

// lg-04 전설 합체: parts of a legend light up one after another; press them in the same order to
// fuse. Each stage has two fusions and the order gets longer (3·4 → 4·5 → 5·6). A wrong part, or
// waiting more than 6 s for the next one, is a mistake and the order shows again. 3 mistakes.
// A play fusion only: the watch's legend cards are not used.
export const FUSE_GOAL = 6;
export const FUSE_MISSES = 3;
export const PARTS = ["head", "arm", "leg", "wing"] as const;
export type Part = (typeof PARTS)[number];
export const SHOW_STEP = 0.7;
export const WAIT_SECONDS = 6;
export const lengthFor = (n: number) => [3, 4, 4, 5, 5, 6][n] ?? 6;
export type FuseGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  misses: number;
  order: Part[];
  step: number;
  /** Seconds left of the show; buttons are locked while it plays. */
  showing: number;
  wait: number;
  seed: number;
};
export const stageOfFuse = (score: number) => Math.min(3, 1 + Math.floor(score / 2)) as 1 | 2 | 3;
function newOrder(g: FuseGame): FuseGame {
  let r: number;
  let s = g.seed;
  const order: Part[] = [];
  while (order.length < lengthFor(g.score)) {
    [r, s] = nextRandom(s);
    let i = Math.min(3, Math.floor(r * 4));
    // A part shown twice in a row would read as one long flash, so step to the next part.
    if (PARTS[i] === order[order.length - 1]) i = (i + 1) % 4;
    order.push(PARTS[i]!);
  }
  return show({ ...g, order, seed: s });
}
const show = (g: FuseGame): FuseGame => ({
  ...g,
  step: 0,
  showing: g.order.length * SHOW_STEP,
  wait: WAIT_SECONDS,
});
/** Which part is lit right now during the show, or null. */
export function litPart(g: FuseGame): Part | null {
  if (g.showing <= 0) return null;
  const elapsed = g.order.length * SHOW_STEP - g.showing;
  return g.order[Math.min(g.order.length - 1, Math.floor(elapsed / SHOW_STEP))] ?? null;
}
export const createFuse = (seed = 1): FuseGame =>
  newOrder({
    outcome: "playing",
    score: 0,
    stage: 1,
    misses: 0,
    order: [],
    step: 0,
    showing: 0,
    wait: 0,
    seed,
  });
function miss(g: FuseGame): FuseGame {
  const misses = g.misses + 1;
  if (misses >= FUSE_MISSES) return { ...g, misses, outcome: "lost" };
  return show({ ...g, misses });
}
export function pressPart(g: FuseGame, p: Part): FuseGame {
  if (g.outcome !== "playing" || g.showing > 0 || !PARTS.includes(p)) return g;
  if (g.order[g.step] !== p) return miss(g);
  if (g.step + 1 < g.order.length) return { ...g, step: g.step + 1, wait: WAIT_SECONDS };
  const score = g.score + 1;
  if (score >= FUSE_GOAL) return { ...g, score, step: g.order.length, outcome: "won" };
  return newOrder({ ...g, score, stage: stageOfFuse(score) });
}
export function tickFuse(g: FuseGame, dt: number): FuseGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.25);
  if (g.showing > 0) return { ...g, showing: Math.max(0, g.showing - step) };
  const wait = g.wait - step;
  return wait <= 0 ? miss(g) : { ...g, wait };
}
