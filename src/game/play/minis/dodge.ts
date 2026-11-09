import { nextRandom, type Outcome } from "../arcade.ts";

// mn-17 장애물 피하기: Hyunjun's car drives up a three-lane road; rocks come down. Move left or
// right to pass them. Every rock that goes by counts; a bump costs a heart (3 hearts).
export const DODGE_GOAL = 20;
export const DODGE_HEARTS = 3;
/** Where the car sits, as distance down the road (0 top, 1 bottom). */
export const CAR_ZONE = { from: 0.8, to: 0.94 } as const;
export type Lane = 0 | 1 | 2;
export type Rock = { id: number; lane: Lane; y: number; hit: boolean };
export type DodgeGame = {
  outcome: Outcome;
  score: number;
  hearts: number;
  lane: Lane;
  rocks: Rock[];
  speed: number;
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const createDodge = (seed = 1): DodgeGame => ({
  outcome: "playing",
  score: 0,
  hearts: DODGE_HEARTS,
  lane: 1,
  rocks: [],
  speed: 0.32,
  nextId: 1,
  spawnIn: 0.6,
  seed,
});

export function steer(g: DodgeGame, dir: -1 | 1): DodgeGame {
  if (g.outcome !== "playing") return g;
  const lane = Math.min(2, Math.max(0, g.lane + dir)) as Lane;
  return lane === g.lane ? g : { ...g, lane };
}

export function tickDodge(g: DodgeGame, dt: number): DodgeGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let { seed, nextId, spawnIn, score, hearts } = g;
  const rocks: Rock[] = [];
  for (const rock of g.rocks) {
    const moved = { ...rock, y: rock.y + g.speed * step };
    if (!moved.hit && moved.lane === g.lane && moved.y >= CAR_ZONE.from && moved.y <= CAR_ZONE.to) {
      moved.hit = true;
      hearts -= 1;
    }
    if (moved.y > 1.05) {
      if (!moved.hit) score += 1;
      continue;
    }
    rocks.push(moved);
  }
  spawnIn -= step;
  if (spawnIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    const lane = Math.min(2, Math.floor(r * 3)) as Lane;
    rocks.push({ id: nextId++, lane, y: 0, hit: false });
    [r, seed] = nextRandom(seed);
    spawnIn = 0.75 + r * 0.5;
  }
  const outcome: Outcome = hearts <= 0 ? "lost" : score >= DODGE_GOAL ? "won" : "playing";
  return {
    ...g,
    rocks,
    seed,
    nextId,
    spawnIn,
    score: Math.min(score, DODGE_GOAL),
    hearts: Math.max(0, hearts),
    speed: Math.min(0.55, 0.32 + score * 0.012),
    outcome,
  };
}
