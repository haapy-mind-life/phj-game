import { nextRandom, type Outcome } from "../arcade.ts";

// mn-18 박스 열기: each box shows its three-picture code for a moment, then hides it. Turn the
// three dials to the same pictures and press 열기. A wrong code is a mistake and the code shows
// again. Five boxes, 3 mistakes, 120 s. The reward is fixed per box: no random prizes.
export const BOX_GOAL = 5;
export const BOX_MISSES = 3;
export const BOX_SECONDS = 120;
export const SHOW_SECONDS = 2.5;
export const SYMBOLS = ["⭐", "🌙", "☀️", "💧"] as const;
export type Glyph = 0 | 1 | 2 | 3;
export type BoxGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  code: [Glyph, Glyph, Glyph];
  dials: [Glyph, Glyph, Glyph];
  /** Seconds the code is still shown; dials are locked while it shows. */
  showing: number;
  seed: number;
};
function newCode(seed: number): [[Glyph, Glyph, Glyph], number] {
  const code: Glyph[] = [];
  let r: number;
  let s = seed;
  for (let i = 0; i < 3; i++) {
    [r, s] = nextRandom(s);
    code.push(Math.min(3, Math.floor(r * 4)) as Glyph);
  }
  return [code as [Glyph, Glyph, Glyph], s];
}
export function createBox(seed = 1): BoxGame {
  const [code, s] = newCode(seed);
  return {
    outcome: "playing",
    score: 0,
    misses: 0,
    remaining: BOX_SECONDS,
    code,
    dials: [0, 0, 0],
    showing: SHOW_SECONDS,
    seed: s,
  };
}
export function turnDial(g: BoxGame, i: 0 | 1 | 2): BoxGame {
  if (g.outcome !== "playing" || g.showing > 0) return g;
  const dials = g.dials.slice() as [Glyph, Glyph, Glyph];
  dials[i] = ((dials[i] + 1) % 4) as Glyph;
  return { ...g, dials };
}
export function openBox(g: BoxGame): BoxGame {
  if (g.outcome !== "playing" || g.showing > 0) return g;
  if (g.dials.some((d, i) => d !== g.code[i])) {
    const misses = g.misses + 1;
    return {
      ...g,
      misses,
      showing: SHOW_SECONDS,
      outcome: misses >= BOX_MISSES ? "lost" : "playing",
    };
  }
  const score = g.score + 1;
  if (score >= BOX_GOAL) return { ...g, score, outcome: "won" };
  const [code, seed] = newCode(g.seed);
  return { ...g, score, code, seed, dials: [0, 0, 0], showing: SHOW_SECONDS };
}
export function tickBox(g: BoxGame, dt: number): BoxGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.25);
  const remaining = Math.max(0, g.remaining - step);
  return {
    ...g,
    remaining,
    showing: Math.max(0, g.showing - step),
    outcome: remaining === 0 ? "lost" : "playing",
  };
}
