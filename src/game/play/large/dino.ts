import { nextRandom, type Outcome } from "../arcade.ts";

// lg-20 공룡 월드: dinosaurs wander across the meadow. When one is inside the photo frame and calm,
// press 찰칵 to add it to the picture book. A dino that has just been startled (💢) must not be
// photographed — that is too close, a safety warning and a mistake. A shot of an empty frame
// wastes film. Three areas (3, 3, 2 new dinos), 20 shots of film, 3 safety warnings.
export const DINO_GOAL = 8;
export const DINO_WARNINGS = 3;
export const FILM = 20;
export const DINOS = ["🦕", "🦖", "🐊", "🦎", "🐢", "🐉", "🦤", "🦭"] as const;
export const FRAME = { from: 0.38, to: 0.62 } as const;
export type Walker = { id: number; species: number; x: number; dir: 1 | -1; startled: number };
export type DinoGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  warnings: number;
  film: number;
  book: number[];
  walker: Walker;
  nextId: number;
  seed: number;
};
export const dinoStage = (score: number) => (score < 3 ? 1 : score < 6 ? 2 : 3) as 1 | 2 | 3;
function newWalker(g: DinoGame): DinoGame {
  let r: number;
  let s = g.seed;
  // Prefer a dino not yet in the book, so the book can always be finished.
  const missing = DINOS.map((_, i) => i).filter((i) => !g.book.includes(i));
  [r, s] = nextRandom(s);
  const pool = r < 0.7 && missing.length ? missing : DINOS.map((_, i) => i);
  [r, s] = nextRandom(s);
  const species = pool[Math.min(pool.length - 1, Math.floor(r * pool.length))]!;
  [r, s] = nextRandom(s);
  const dir: 1 | -1 = r < 0.5 ? 1 : -1;
  return {
    ...g,
    seed: s,
    walker: { id: g.nextId, species, x: dir === 1 ? -0.1 : 1.1, dir, startled: 0 },
    nextId: g.nextId + 1,
  };
}
export const createDino = (seed = 1): DinoGame =>
  newWalker({
    outcome: "playing",
    score: 0,
    stage: 1,
    warnings: 0,
    film: FILM,
    book: [],
    walker: { id: 0, species: 0, x: 0, dir: 1, startled: 0 },
    nextId: 1,
    seed,
  });
export const inFrame = (w: Walker) => w.x >= FRAME.from && w.x <= FRAME.to;
export function snap(g: DinoGame): DinoGame {
  if (g.outcome !== "playing" || g.film <= 0) return g;
  const film = g.film - 1;
  const w = g.walker;
  if (inFrame(w) && w.startled > 0) {
    const warnings = g.warnings + 1;
    return {
      ...g,
      film,
      warnings,
      outcome: warnings >= DINO_WARNINGS || film === 0 ? "lost" : "playing",
    };
  }
  if (!inFrame(w) || g.book.includes(w.species))
    return { ...g, film, outcome: film === 0 ? "lost" : "playing" };
  const book = [...g.book, w.species];
  const score = g.score + 1;
  if (score >= DINO_GOAL) return { ...g, film, book, score, outcome: "won" };
  return newWalker({
    ...g,
    film,
    book,
    score,
    stage: dinoStage(score),
    outcome: film === 0 ? "lost" : "playing",
  });
}
export function tickDino(g: DinoGame, dt: number): DinoGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  const speed = 0.16 + g.stage * 0.04;
  const w = {
    ...g.walker,
    x: g.walker.x + g.walker.dir * speed * step,
    startled: Math.max(0, g.walker.startled - step),
  };
  // Now and then a dino startles for a moment (more often in later areas).
  const [r, seed] = nextRandom(g.seed);
  if (w.startled === 0 && r < step * (0.25 + g.stage * 0.15)) w.startled = 1.2;
  const next = { ...g, seed, walker: w };
  return w.x < -0.15 || w.x > 1.15 ? newWalker(next) : next;
}
