import { portalHasPriority } from "./actors.ts";
import { canWalkHome } from "./life-world.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { newActivity, tickActivity, actActivity } from "./activities.ts";
import { ACTORS, actorScene, patrolPosition } from "./actors.ts";
import { migrateSave } from "../lib/world-model.ts";
import { isWalkable } from "./adventure.ts";
test("one actor has exactly one scene and patrols avoid blocked ground", () => {
  const s = migrateSave({ companions: ["dad"], guests: ["friend-home"] });
  assert.equal(actorScene(ACTORS[0]!, s, "world"), "world");
  assert.equal(
    actorScene(
      ACTORS.find((a) => a.id === "friend-home")!,
      s,
      "world",
    ),
    "home",
  );
  for (const a of ACTORS.filter((a) => a.kind === "friend"))
    for (let t = 0; t < 120; t += 3) assert.ok(isWalkable(patrolPosition(a, t)), a.id);
});
test("companions help at most twice and cannot play without the player", () => {
  let a = newActivity("festival", { x: 1200, y: 5200 }, "a");
  a = tickActivity(a, 9, { x: 1200, y: 5200 }, 4);
  assert.equal(a.score, 0);
  a = actActivity(a, a.items[0]!);
  for (let i = 0; i < 5; i++)
    a = tickActivity(a, 8, a.items.find((x) => !x.found) ?? a.items[0]!, 4);
  assert.ok(a.helped <= 2);
  assert.equal(a.playerScore, 1);
});
test("activities end once and ink can clear without changing rewards", () => {
  let a = newActivity("sea", { x: 7800, y: 1000 }, "sea");
  a = tickActivity(a, 8, { x: 7800, y: 1000 }, 0);
  assert.equal(a.ink, 2);
  for (const item of a.items) a = actActivity(a, item);
  assert.ok(a.done && a.won);
  assert.equal(tickActivity(a, 10, { x: 0, y: 0 }, 0), a);
  assert.equal(actActivity(a, a.items[0]!), a);
});

test("home balls remain reachable even when play starts near any house edge", () => {
  for (const origin of [
    { x: 720, y: 250 },
    { x: 2050, y: 1290 },
    { x: 140, y: 450 },
  ])
    for (const tier of [1, 2, 3, 4]) {
      const a = newActivity("home", origin, "home");
      for (const target of a.items) assert.ok(canWalkHome(target, tier), JSON.stringify(target));
    }
});

test("legacy game entrances take priority over nearby roaming conversations", () => {
  assert.equal(portalHasPriority({ x: 1250, y: 400 }, "world"), true);
  assert.equal(portalHasPriority({ x: 2225, y: 1400 }, "world"), true);
  assert.equal(portalHasPriority({ x: 1200, y: 3065 }, "world"), false);
});

test("activity helpers travel to a target rather than awarding a hidden instant pickup", () => {
  let a = newActivity("festival", { x: 1200, y: 5200 }, "help");
  a = actActivity(a, a.items[0]!);
  const player = { x: a.items[1]!.x - 80, y: a.items[1]!.y };
  a = tickActivity(a, 8, player, 1);
  assert.ok(a.helper !== null);
  assert.equal(a.helped, 0);
  for (let i = 0; i < 20; i++) a = tickActivity(a, 0.1, player, 1);
  assert.equal(a.helped, 1);
});
