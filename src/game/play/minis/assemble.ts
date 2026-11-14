import { countdown, nextRandom, type Outcome } from "../arcade.ts";

// mn-09 로봇 조립: tap a part in the tray, then the empty place on the robot outline where it goes.
// A wrong place is a mistake and the part stays in the tray. Four robots, 3 mistakes, 120 s.
// This is a puzzle only: no robot card, grade or part in the save is read or changed.
export const ASSEMBLE_GOAL = 4;
export const ASSEMBLE_MISSES = 3;
export const ASSEMBLE_SECONDS = 120;
export type Slot = "head" | "body" | "armL" | "armR" | "legs";
export const SLOTS: readonly Slot[] = ["head", "body", "armL", "armR", "legs"];
export const SLOT_NAME: Record<Slot, string> = {
  head: "머리",
  body: "몸통",
  armL: "왼팔",
  armR: "오른팔",
  legs: "다리",
};
export type AssembleGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  /** Parts still in the tray, in shuffled order. */
  tray: Slot[];
  placed: Slot[];
  picked: Slot | null;
  seed: number;
};
/** The first robots have four parts; later ones add the second arm. */
const partsFor = (robot: number): Slot[] =>
  robot < 2 ? ["head", "body", "armR", "legs"] : [...SLOTS];
function shuffle(parts: Slot[], seed: number): [Slot[], number] {
  const out = parts.slice();
  let r: number;
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    [r, s] = nextRandom(s);
    const j = Math.floor(r * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return [out, s];
}
export function createAssemble(seed = 1): AssembleGame {
  const [tray, s] = shuffle(partsFor(0), seed);
  return {
    outcome: "playing",
    score: 0,
    misses: 0,
    remaining: ASSEMBLE_SECONDS,
    tray,
    placed: [],
    picked: null,
    seed: s,
  };
}
export function pickPart(g: AssembleGame, part: Slot): AssembleGame {
  if (g.outcome !== "playing" || !g.tray.includes(part)) return g;
  return { ...g, picked: g.picked === part ? null : part };
}
export function placePart(g: AssembleGame, slot: Slot): AssembleGame {
  if (g.outcome !== "playing" || !g.picked || g.placed.includes(slot)) return g;
  if (g.picked !== slot) {
    const misses = g.misses + 1;
    return { ...g, misses, picked: null, outcome: misses >= ASSEMBLE_MISSES ? "lost" : "playing" };
  }
  const placed = [...g.placed, slot];
  const tray = g.tray.filter((p) => p !== slot);
  if (tray.length) return { ...g, placed, tray, picked: null };
  const score = g.score + 1;
  if (score >= ASSEMBLE_GOAL) return { ...g, score, placed, tray, picked: null, outcome: "won" };
  const [next, seed] = shuffle(partsFor(score), g.seed);
  return { ...g, score, tray: next, placed: [], picked: null, seed };
}
/** Which places this robot needs (empty or filled), for drawing its outline. */
export const outline = (g: AssembleGame): Slot[] =>
  SLOTS.filter((s) => g.tray.includes(s) || g.placed.includes(s));
export function tickAssemble(g: AssembleGame, dt: number): AssembleGame {
  return countdown(g, dt);
}
