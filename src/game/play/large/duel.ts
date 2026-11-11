import { nextRandom, type Outcome } from "../arcade.ts";

// lg-03 로봇 대결: the rival robot shows what it is about to do. 👊 a punch → dodge, 🛡️ a shield →
// charge up, 😵 an opening → attack. The right answer in time keeps you safe (and hits on an
// opening); a wrong answer or waiting too long costs a heart. Three rivals, each tougher and
// quicker. A play robot only: the watch's robot cards are not used.
export const DUEL_GOAL = 3;
export const DUEL_HEARTS = 3;
export type Signal = "punch" | "shield" | "open";
export type Answer = "dodge" | "charge" | "attack";
export const ANSWER: Record<Signal, Answer> = { punch: "dodge", shield: "charge", open: "attack" };
export const RIVAL_HP = [3, 4, 5] as const;
export const windowFor = (stage: number) => [2.5, 1.9, 1.4][stage - 1] ?? 1.4;
export type DuelGame = {
  outcome: Outcome;
  /** Rivals beaten; the one being fought is score + 1. */
  score: number;
  stage: 1 | 2 | 3;
  hearts: number;
  rivalHp: number;
  signal: Signal;
  left: number;
  seed: number;
};
function nextSignal(g: DuelGame): DuelGame {
  const [r, seed] = nextRandom(g.seed);
  const signal: Signal = r < 0.4 ? "open" : r < 0.7 ? "punch" : "shield";
  return { ...g, seed, signal, left: windowFor(g.stage) };
}
export const createDuel = (seed = 1): DuelGame =>
  nextSignal({
    outcome: "playing",
    score: 0,
    stage: 1,
    hearts: DUEL_HEARTS,
    rivalHp: RIVAL_HP[0],
    signal: "punch",
    left: 0,
    seed,
  });
function hurt(g: DuelGame): DuelGame {
  const hearts = g.hearts - 1;
  if (hearts <= 0) return { ...g, hearts: 0, outcome: "lost" };
  return nextSignal({ ...g, hearts });
}
export function answer(g: DuelGame, a: Answer): DuelGame {
  if (g.outcome !== "playing" || !(a in { dodge: 1, charge: 1, attack: 1 })) return g;
  if (ANSWER[g.signal] !== a) return hurt(g);
  if (g.signal !== "open") return nextSignal(g);
  const rivalHp = g.rivalHp - 1;
  if (rivalHp > 0) return nextSignal({ ...g, rivalHp });
  const score = g.score + 1;
  if (score >= DUEL_GOAL) return { ...g, rivalHp: 0, score, outcome: "won" };
  const stage = (score + 1) as 2 | 3;
  return nextSignal({ ...g, score, stage, rivalHp: RIVAL_HP[stage - 1] ?? 5 });
}
export function tickDuel(g: DuelGame, dt: number): DuelGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const left = g.left - Math.min(dt, 0.25);
  return left <= 0 ? hurt(g) : { ...g, left };
}
