import { test } from "node:test";
import assert from "node:assert/strict";
import {
  beginTransform,
  canStrikeInForm,
  canTransform,
  finishTransform,
  interruptTransform,
  standing,
} from "./robot-forms.ts";

test("AC-08 Tira goes robot → egg → robot", () => {
  const egg = beginTransform(["rb-tira"], standing())!;
  assert.deepEqual(egg, { form: "egg", changing: true });
  const settled = finishTransform(egg);
  assert.deepEqual(settled, { form: "egg", changing: false });
  const back = beginTransform(["rb-tira"], settled)!;
  assert.deepEqual(finishTransform(back), { form: "robot", changing: false });
});

test("AC-09 Emblus goes robot → ambulance → robot", () => {
  const car = finishTransform(beginTransform(["rb-emblus"], standing())!);
  assert.equal(car.form, "ambulance");
  assert.equal(finishTransform(beginTransform(["rb-emblus"], car)!).form, "robot");
});

test("other robots, fusions and a change already running can't start a change", () => {
  assert.equal(beginTransform(["rb-police"], standing()), null);
  assert.equal(beginTransform(["rb-emblus", "rb-tira"], standing()), null);
  assert.equal(beginTransform(["rb-tira"], { form: "egg", changing: true }), null);
  assert.equal(canTransform(["rb-fire"]), false);
});

test("only a settled robot can strike, and an interrupted change is a safe robot pose", () => {
  assert.equal(canStrikeInForm(standing()), true);
  assert.equal(canStrikeInForm({ form: "egg", changing: false }), false);
  assert.equal(canStrikeInForm({ form: "robot", changing: true }), false);
  assert.deepEqual(interruptTransform({ form: "ambulance", changing: true }), standing());
  const settled = { form: "egg" as const, changing: false };
  assert.equal(interruptTransform(settled), settled);
});
