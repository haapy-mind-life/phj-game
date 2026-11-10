import { nextRandom, type Outcome } from "../arcade.ts";

// mn-14 음식 만들기: a recipe card shows ingredients in order; tap them in that order to make the
// dish. A wrong ingredient is a mistake (the dish keeps its progress). 60 s, 6 dishes, 3 mistakes.
export const COOK_GOAL = 6;
export const COOK_MISSES = 3;
export const COOK_SECONDS = 60;
export const PANTRY = ["🍞", "🧀", "🥬", "🍅", "🥚", "🍖"] as const;
export type Ingredient = 0 | 1 | 2 | 3 | 4 | 5;
export type CookGame = {
  outcome: Outcome;
  score: number;
  misses: number;
  remaining: number;
  recipe: Ingredient[];
  step: number;
  seed: number;
};
function newRecipe(score: number, seed: number): [Ingredient[], number] {
  let r: number;
  const length = 3 + Math.min(2, Math.floor(score / 2));
  const recipe: Ingredient[] = [];
  while (recipe.length < length) {
    [r, seed] = nextRandom(seed);
    const pick = Math.min(5, Math.floor(r * 6)) as Ingredient;
    if (recipe[recipe.length - 1] !== pick) recipe.push(pick);
  }
  return [recipe, seed];
}
export function createCook(seed = 1): CookGame {
  const [recipe, s] = newRecipe(0, seed);
  return {
    outcome: "playing",
    score: 0,
    misses: 0,
    remaining: COOK_SECONDS,
    recipe,
    step: 0,
    seed: s,
  };
}
export function addIngredient(g: CookGame, item: Ingredient): CookGame {
  if (g.outcome !== "playing") return g;
  if (g.recipe[g.step] !== item) {
    const misses = g.misses + 1;
    return { ...g, misses, outcome: misses >= COOK_MISSES ? "lost" : "playing" };
  }
  if (g.step + 1 < g.recipe.length) return { ...g, step: g.step + 1 };
  const score = g.score + 1;
  if (score >= COOK_GOAL) return { ...g, score, step: g.recipe.length, outcome: "won" };
  const [recipe, seed] = newRecipe(score, g.seed);
  return { ...g, score, recipe, step: 0, seed };
}
export function tickCook(g: CookGame, dt: number): CookGame {
  if (g.outcome !== "playing" || !Number.isFinite(dt) || dt <= 0) return g;
  const remaining = Math.max(0, g.remaining - Math.min(dt, 0.25));
  return { ...g, remaining, outcome: remaining === 0 ? "lost" : "playing" };
}
