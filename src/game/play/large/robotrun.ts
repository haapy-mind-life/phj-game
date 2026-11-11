import { nextRandom, type Outcome } from "../arcade.ts";

// lg-17 로봇 러너: a wall needs the robot (to smash it), a gap needs the plane (to fly over it), a
// low tunnel needs the car (to drive under it). Change into the right form before each one
// arrives. Five passes per stage, three stages getting faster, 3 hearts. A play robot only: the
// watch's robot cards are not used.
export const RUN_GOAL = 15;
export const PER_STAGE = 5;
export const RUN_HEARTS = 3;
export const RUNNER_X = 0.2;
export type Form = "robot" | "plane" | "car";
export type Block = "wall" | "gap" | "tunnel";
export const NEEDS: Record<Block, Form> = { wall: "robot", gap: "plane", tunnel: "car" };
export type RunThing = { id: number; x: number; kind: Block; done: boolean };
export type RobotRunGame = {
  outcome: Outcome;
  score: number;
  stage: 1 | 2 | 3;
  hearts: number;
  form: Form;
  things: RunThing[];
  nextId: number;
  spawnIn: number;
  seed: number;
};
export const runStage = (score: number) =>
  Math.min(3, 1 + Math.floor(score / PER_STAGE)) as 1 | 2 | 3;
export const createRobotRun = (seed = 1): RobotRunGame => ({
  outcome: "playing",
  score: 0,
  stage: 1,
  hearts: RUN_HEARTS,
  form: "robot",
  things: [],
  nextId: 1,
  spawnIn: 0.5,
  seed,
});
export const changeForm = (g: RobotRunGame, form: Form): RobotRunGame =>
  g.outcome !== "playing" || g.form === form || !(form in { robot: 1, plane: 1, car: 1 })
    ? g
    : { ...g, form };
export function tickRobotRun(g: RobotRunGame, dt: number): RobotRunGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const step = Math.min(dt, 0.1);
  let { seed, nextId, spawnIn, hearts, score } = g;
  const speed = 0.3 + g.stage * 0.07;
  const things: RunThing[] = [];
  for (const t of g.things) {
    const moved = { ...t, x: t.x - speed * step };
    if (!moved.done && moved.x <= RUNNER_X) {
      moved.done = true;
      if (NEEDS[moved.kind] === g.form) score += 1;
      else hearts -= 1;
    }
    if (moved.x > -0.1) things.push(moved);
  }
  spawnIn -= step;
  if (spawnIn <= 0) {
    let r: number;
    [r, seed] = nextRandom(seed);
    const kinds: Block[] = ["wall", "gap", "tunnel"];
    things.push({
      id: nextId++,
      x: 1.05,
      kind: kinds[Math.min(2, Math.floor(r * 3))]!,
      done: false,
    });
    [r, seed] = nextRandom(seed);
    spawnIn = 1.6 + r * 0.6 - g.stage * 0.2;
  }
  score = Math.min(RUN_GOAL, score);
  const outcome: Outcome = hearts <= 0 ? "lost" : score >= RUN_GOAL ? "won" : "playing";
  return {
    ...g,
    things,
    seed,
    nextId,
    spawnIn,
    hearts: Math.max(0, hearts),
    score,
    stage: runStage(score),
    outcome,
  };
}
/** The next thing still coming, for the HUD and the test player. */
export const nextBlock = (g: RobotRunGame) =>
  g.things.filter((t) => !t.done && t.x > RUNNER_X).sort((a, b) => a.x - b.x)[0];
