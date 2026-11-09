import { nextRandom, type Outcome } from "../arcade.ts";

// mn-05 빠른 점프: one of three pads lights up; jump to it before its light runs out. Each good
// jump makes the next light a little shorter. A wrong pad or a light that runs out is a miss.
export const JUMP_GOAL = 12;
export const JUMP_MISSES = 3;
export const FIRST_WINDOW = 2.2;
export const LAST_WINDOW = 1.1;
export type Pad = 0 | 1 | 2;
export type JumpGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  /** Where Hyunjun stands and the pad that is lit now. */
  at: Pad;
  target: Pad;
  /** Seconds left on the lit pad, and the full window it started with. */
  remaining: number;
  window: number;
  seed: number;
};
export const windowFor = (score: number) =>
  Math.max(LAST_WINDOW, FIRST_WINDOW - (score * (FIRST_WINDOW - LAST_WINDOW)) / (JUMP_GOAL - 1));

function light(g: JumpGame): JumpGame {
  const [r, seed] = nextRandom(g.seed);
  // Never the pad Hyunjun stands on, so every light means a real jump.
  const others = ([0, 1, 2] as Pad[]).filter((p) => p !== g.at);
  const target = others[Math.min(1, Math.floor(r * 2))]!;
  const window = windowFor(g.score);
  return { ...g, seed, target, window, remaining: window };
}
export const createJump = (seed = 1): JumpGame =>
  light({
    outcome: "playing",
    score: 0,
    misses: 0,
    at: 1,
    target: 1,
    remaining: FIRST_WINDOW,
    window: FIRST_WINDOW,
    seed,
  });

function miss(g: JumpGame): JumpGame {
  const misses = g.misses + 1;
  if (misses >= JUMP_MISSES) return { ...g, misses, outcome: "lost", remaining: 0 };
  return light({ ...g, misses });
}

export function tickJump(g: JumpGame, dt: number): JumpGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const remaining = g.remaining - Math.min(dt, 0.25);
  return remaining <= 0 ? miss({ ...g, remaining: 0 }) : { ...g, remaining };
}

export function jumpTo(g: JumpGame, pad: Pad): JumpGame {
  if (g.outcome !== "playing") return g;
  if (pad !== g.target) return miss(g);
  const score = g.score + 1;
  if (score >= JUMP_GOAL) return { ...g, at: pad, score, outcome: "won", remaining: 0 };
  return light({ ...g, at: pad, score });
}
