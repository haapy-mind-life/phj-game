import { nextRandom, type Outcome } from "../arcade.ts";

// lg-14 자동차 챔피언: three courses on a three-lane road against a rival car. Steer around rocks
// and drive over boost pads. The rival is a little slower than a car that never bumps, so careful
// driving always wins; each rock slows the car for a moment, and boosts win back time. Reaching
// the finish first wins the course; the rival first, or three bumps, ends the race.
export const CHAMP_GOAL = 3;
export const CHAMP_HEARTS = 3;
export const COURSE = 30;
export const BASE_SPEED = 2;
export const BOOST = 1.6;
export const BOOST_SECONDS = 1.5;
export const BUMP_SECONDS = 1;
export const CAR_ZONE = { from: 0.8, to: 0.94 } as const;
export type Lane = 0 | 1 | 2;
export type RoadItem = { id: number; lane: Lane; y: number; kind: "rock" | "boost"; used: boolean };
export type ChampionGame = {
  outcome: Outcome;
  /** Courses won; the course being driven is score + 1. */
  score: number;
  stage: 1 | 2 | 3;
  hearts: number;
  lane: Lane;
  distance: number;
  rival: number;
  boost: number;
  /** Seconds left at half speed after a bump. */
  slow: number;
  items: RoadItem[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
/** Just slower than a car that never bumps, a little faster each course, so careful driving
 * always wins and every bump costs real time. */
export const rivalSpeed = (stage: number) => BASE_SPEED * (0.93 + 0.02 * stage);
function course(g: ChampionGame, stage: 1 | 2 | 3): ChampionGame {
  return { ...g, stage, distance: 0, rival: 0, boost: 0, slow: 0, items: [], spawnIn: 0.4 };
}
export const createChampion = (seed = 1): ChampionGame =>
  course(
    {
      outcome: "playing",
      score: 0,
      stage: 1,
      hearts: CHAMP_HEARTS,
      lane: 1,
      distance: 0,
      rival: 0,
      boost: 0,
      slow: 0,
      items: [],
      nextId: 1,
      spawnIn: 0,
      seed,
    },
    1,
  );
export function steerCar(g: ChampionGame, dir: -1 | 1): ChampionGame {
  if (g.outcome !== "playing") return g;
  const lane = Math.min(2, Math.max(0, g.lane + dir)) as Lane;
  return lane === g.lane ? g : { ...g, lane };
}
export function tickChampion(g: ChampionGame, dt: number): ChampionGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let { seed, nextId, spawnIn, hearts, boost, slow } = g;
  const speed = BASE_SPEED * (boost > 0 ? BOOST : 1) * (slow > 0 ? 0.5 : 1);
  boost = Math.max(0, boost - step);
  slow = Math.max(0, slow - step);
  // The road scrolls with the car's own speed, so a boost also brings things closer faster.
  const items: RoadItem[] = [];
  for (const item of g.items) {
    const moved = { ...item, y: item.y + speed * 0.16 * step };
    if (
      !moved.used &&
      moved.lane === g.lane &&
      moved.y >= CAR_ZONE.from &&
      moved.y <= CAR_ZONE.to
    ) {
      moved.used = true;
      if (moved.kind === "rock") {
        hearts -= 1;
        slow = BUMP_SECONDS;
      } else boost = BOOST_SECONDS;
    }
    if (moved.y <= 1.05) items.push(moved);
  }
  spawnIn -= step;
  if (spawnIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    const lane = Math.min(2, Math.floor(r * 3)) as Lane;
    [r, seed] = nextRandom(seed);
    const kind = r < 0.35 ? "boost" : "rock";
    items.push({ id: nextId++, lane, y: 0, kind, used: false });
    [r, seed] = nextRandom(seed);
    spawnIn = 0.55 + r * 0.4 - g.stage * 0.05;
  }
  const distance = g.distance + speed * step;
  const rival = g.rival + rivalSpeed(g.stage) * step;
  const next = {
    ...g,
    items,
    seed,
    nextId,
    spawnIn,
    hearts: Math.max(0, hearts),
    boost,
    slow,
    distance,
    rival,
  };
  if (hearts <= 0 || rival >= COURSE) return { ...next, outcome: "lost" };
  if (distance < COURSE) return next;
  const score = g.score + 1;
  if (score >= CHAMP_GOAL) return { ...next, score, outcome: "won" };
  return course({ ...next, score }, (score + 1) as 2 | 3);
}
