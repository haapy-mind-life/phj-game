import { nextRandom, type Outcome } from "../arcade.ts";

// lg-09 밤 게임: a dark 5×5 forest. Tap a dark square to shine the torch: that square and its
// neighbours light up for a moment. Tap a lit firefly to catch it; tapping a lit owl wakes it (a
// mistake). Three nights with three fireflies each; more owls and shorter light every night. The
// torch has 15 shines a night. 3 owls woken or an empty torch ends the game.
export const NIGHT_GOAL = 9;
export const PER_NIGHT = 3;
export const NIGHT_MISSES = 3;
export const SHINES = 15;
export const SIZE = 5;
export const lightFor = (stage: number) => [1.6, 1.3, 1.0][stage - 1] ?? 1.0;
export const owlsFor = (stage: number) => stage;
export type NightGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  misses: number;
  shines: number;
  fireflies: number[];
  owls: number[];
  lit: number[];
  light: number;
  seed: number;
};
export const nightStage = (score: number) =>
  Math.min(3, 1 + Math.floor(score / PER_NIGHT)) as 1 | 2 | 3;
function night(g: NightGame, stage: 1 | 2 | 3): NightGame {
  let r: number;
  let s = g.seed;
  const taken = new Set<number>();
  const pick = () => {
    for (;;) {
      [r, s] = nextRandom(s);
      const c = Math.min(SIZE * SIZE - 1, Math.floor(r * SIZE * SIZE));
      if (!taken.has(c)) {
        taken.add(c);
        return c;
      }
    }
  };
  const fireflies = Array.from({ length: PER_NIGHT }, pick);
  const owls = Array.from({ length: owlsFor(stage) }, pick);
  return { ...g, stage, fireflies, owls, lit: [], light: 0, shines: SHINES, seed: s };
}
export const createNight = (seed = 1): NightGame =>
  night(
    {
      outcome: "playing",
      score: 0,
      stage: 1,
      misses: 0,
      shines: SHINES,
      fireflies: [],
      owls: [],
      lit: [],
      light: 0,
      seed,
    },
    1,
  );
const around = (c: number) => {
  const x = c % SIZE,
    y = Math.floor(c / SIZE);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE) out.push(ny * SIZE + nx);
    }
  return out;
};
export function tapForest(g: NightGame, c: number): NightGame {
  if (g.outcome !== "playing" || !Number.isInteger(c) || c < 0 || c >= SIZE * SIZE) return g;
  if (!g.lit.includes(c)) {
    if (g.shines <= 0) return g;
    const shines = g.shines - 1;
    const next = { ...g, shines, lit: around(c), light: lightFor(g.stage) };
    return shines === 0 && !around(c).some((x) => g.fireflies.includes(x))
      ? { ...next, outcome: "lost" }
      : next;
  }
  if (g.owls.includes(c)) {
    const misses = g.misses + 1;
    return { ...g, misses, outcome: misses >= NIGHT_MISSES ? "lost" : "playing" };
  }
  if (!g.fireflies.includes(c)) return g;
  const fireflies = g.fireflies.filter((f) => f !== c);
  const score = g.score + 1;
  if (score >= NIGHT_GOAL) return { ...g, fireflies, score, outcome: "won" };
  if (fireflies.length) return { ...g, fireflies, score };
  return night({ ...g, score }, nightStage(score));
}
export function tickNight(g: NightGame, dt: number): NightGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0 || g.light <= 0) return g;
  const light = g.light - Math.min(dt, 0.25);
  if (light > 0) return { ...g, light };
  // The torch went out with no shines left and fireflies still hiding: the night is over.
  return { ...g, light: 0, lit: [], outcome: g.shines <= 0 ? "lost" : "playing" };
}
