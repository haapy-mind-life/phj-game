import { nextRandom, type Outcome } from "../arcade.ts";

// lg-19 우주 대전쟁: made-up machine drones and rocks come down three lanes toward Hyunjun's ship.
// 발사 sends a safe energy shot up the ship's lane and breaks the nearest drone there; rocks can't
// be shot — move away or raise the shield (1 s, then 3 s to recharge). Anything that reaches the
// ship in its lane costs a heart. Three waves, five drones each, getting faster. 3 hearts.
export const SPACE_GOAL = 15;
export const PER_WAVE = 5;
export const SPACE_HEARTS = 3;
export const SHIELD_SECONDS = 1;
export const SHIELD_RECHARGE = 3;
export const SHIP_Y = 0.88;
export type Lane = 0 | 1 | 2;
export type SpaceThing = { id: number; lane: Lane; y: number; kind: "drone" | "rock" };
export type SpaceGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  hearts: number;
  lane: Lane;
  shield: number;
  recharge: number;
  things: SpaceThing[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const waveOf = (score: number) => Math.min(3, 1 + Math.floor(score / PER_WAVE)) as 1 | 2 | 3;
export const createSpace = (seed = 1): SpaceGame => ({
  outcome: "playing",
  score: 0,
  stage: 1,
  hearts: SPACE_HEARTS,
  lane: 1,
  shield: 0,
  recharge: 0,
  things: [],
  nextId: 1,
  spawnIn: 0.5,
  seed,
});
export function moveShip(g: SpaceGame, dir: -1 | 1): SpaceGame {
  if (g.outcome !== "playing") return g;
  const lane = Math.min(2, Math.max(0, g.lane + dir)) as Lane;
  return lane === g.lane ? g : { ...g, lane };
}
export function fire(g: SpaceGame): SpaceGame {
  if (g.outcome !== "playing") return g;
  const target = g.things
    .filter((t) => t.kind === "drone" && t.lane === g.lane && t.y < SHIP_Y)
    .sort((a, b) => b.y - a.y)[0];
  if (!target) return g;
  const score = g.score + 1;
  const things = g.things.filter((t) => t.id !== target.id);
  if (score >= SPACE_GOAL) return { ...g, things, score, outcome: "won" };
  return { ...g, things, score, stage: waveOf(score) };
}
export function raiseShield(g: SpaceGame): SpaceGame {
  if (g.outcome !== "playing" || g.shield > 0 || g.recharge > 0) return g;
  return { ...g, shield: SHIELD_SECONDS, recharge: SHIELD_SECONDS + SHIELD_RECHARGE };
}
export function tickSpace(g: SpaceGame, dt: number): SpaceGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let { seed, nextId, spawnIn, hearts } = g;
  const speed = 0.16 + g.stage * 0.05;
  const things: SpaceThing[] = [];
  for (const t of g.things) {
    const moved = { ...t, y: t.y + speed * step };
    if (moved.y >= SHIP_Y) {
      if (moved.lane === g.lane && g.shield <= 0) hearts -= 1;
      continue;
    }
    things.push(moved);
  }
  spawnIn -= step;
  if (spawnIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    const lane = Math.min(2, Math.floor(r * 3)) as Lane;
    [r, seed] = nextRandom(seed);
    things.push({ id: nextId++, lane, y: 0, kind: r < 0.3 ? "rock" : "drone" });
    [r, seed] = nextRandom(seed);
    spawnIn = 1.3 + r * 0.6 - g.stage * 0.15;
  }
  const outcome: Outcome = hearts <= 0 ? "lost" : "playing";
  return {
    ...g,
    things,
    seed,
    nextId,
    spawnIn,
    hearts: Math.max(0, hearts),
    shield: Math.max(0, g.shield - step),
    recharge: Math.max(0, g.recharge - step),
    outcome,
  };
}
