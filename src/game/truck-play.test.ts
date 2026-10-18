import { test } from "node:test";
import assert from "node:assert/strict";
import { newTruck, chooseIngredient, cookTruck, serveTruck, RECIPES } from "./truck-play.ts";
test("wrong ingredients cost nothing and serving requires cooking and proximity", () => {
  let t = newTruck();
  assert.equal(chooseIngredient(t, "fish"), t);
  assert.equal(serveTruck(t, false), t);
  for (const ingredient of RECIPES[0]!.ingredients) t = chooseIngredient(t, ingredient);
  t = cookTruck(t, 1);
  assert.equal(t.ready.length, 1);
  assert.equal(serveTruck(t, false), t);
  t = serveTruck(t, true);
  assert.equal(t.served, 1);
  assert.equal(t.ready.length, 0);
});
test("expanded counter holds two different orders; capacity and settlement stop duplicates", () => {
  let t = newTruck();
  for (let i = 0; i < 2; i++) {
    for (const ingredient of RECIPES[i]!.ingredients) t = chooseIngredient(t, ingredient);
    t = cookTruck(t, 2);
  }
  assert.deepEqual(t.ready, [0, 1]);
  assert.equal(cookTruck(t, 2), t);
  t = serveTruck(t, true);
  assert.equal(t.served, 1);
  t = serveTruck(t, true);
  assert.equal(t.served, 2);
  assert.equal(serveTruck(t, true), t);
});
