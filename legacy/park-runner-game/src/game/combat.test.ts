import test from "node:test";
import assert from "node:assert/strict";
import {
  activateMushroom,
  fireProjectile,
  openMysteryBox,
  resolveEnemyContact,
  resolveProjectileHits,
} from "./combat.ts";
import type { Enemy, PlayerCombatState, Projectile } from "./types.ts";

const base: PlayerCombatState = {
  armor: 1,
  bullets: 12,
  arrows: 6,
  bananas: 0,
  disguised: false,
  giantTimer: 0,
};

test("gun shot consumes one bullet and creates a gun projectile", () => {
  const result = fireProjectile(base, "gun", 140, 200);
  assert.equal(result.state.bullets, 11);
  assert.equal(result.projectile?.weapon, "gun");
});

test("gun does not fire with zero bullets", () => {
  const result = fireProjectile({ ...base, bullets: 0 }, "gun", 140, 200);
  assert.equal(result.projectile, null);
  assert.equal(result.state.bullets, 0);
});

test("bow shot consumes one arrow", () => {
  const result = fireProjectile(base, "bow", 140, 200);
  assert.equal(result.state.arrows, 5);
  assert.equal(result.projectile?.weapon, "bow");
});

test("bow does not fire with zero arrows", () => {
  const result = fireProjectile({ ...base, arrows: 0 }, "bow", 140, 200);
  assert.equal(result.projectile, null);
  assert.equal(result.state.arrows, 0);
});

test("gun kill awards 50 points once", () => {
  const enemies: Enemy[] = [{ id: 1, kind: "ground", x: 200, y: 240, w: 30, h: 40, alive: true }];
  const shots: Projectile[] = [
    { id: 1, weapon: "gun", x: 205, y: 250, vx: 12, w: 12, h: 5 },
    { id: 2, weapon: "gun", x: 206, y: 251, vx: 12, w: 12, h: 5 },
  ];
  const result = resolveProjectileHits(enemies, shots);
  assert.equal(result.scoreDelta, 50);
  assert.equal(result.enemies.length, 0);
});

test("bow kill awards 80 points once", () => {
  const enemies: Enemy[] = [{ id: 1, kind: "air", x: 200, y: 120, w: 34, h: 28, alive: true }];
  const shots: Projectile[] = [{ id: 1, weapon: "bow", x: 205, y: 125, vx: 9, w: 22, h: 6 }];
  const result = resolveProjectileHits(enemies, shots);
  assert.equal(result.scoreDelta, 80);
  assert.equal(result.enemies.length, 0);
});

test("giant contact removes enemy without consuming armor", () => {
  const result = resolveEnemyContact({ ...base, giantTimer: 100 });
  assert.equal(result.survives, true);
  assert.equal(result.consumeEnemy, true);
  assert.equal(result.state.armor, 1);
});

test("armor absorbs one enemy contact", () => {
  const result = resolveEnemyContact({ ...base, giantTimer: 0 });
  assert.equal(result.survives, true);
  assert.equal(result.consumeEnemy, true);
  assert.equal(result.state.armor, 0);
});

test("contact without giant or armor is fatal", () => {
  const result = resolveEnemyContact({ ...base, armor: 0, giantTimer: 0 });
  assert.equal(result.survives, false);
  assert.equal(result.consumeEnemy, false);
});

test("mushroom activates giant timer", () => {
  assert.equal(activateMushroom(base).giantTimer, 480);
});

test("banana shot consumes one banana and creates a banana projectile", () => {
  const result = fireProjectile({ ...base, bananas: 5 }, "banana", 140, 200);
  assert.equal(result.state.bananas, 4);
  assert.equal(result.projectile?.weapon, "banana");
});

test("banana does not fire with zero bananas", () => {
  const result = fireProjectile({ ...base, bananas: 0 }, "banana", 140, 200);
  assert.equal(result.projectile, null);
});

test("banana kill awards 100 points", () => {
  const enemies: Enemy[] = [{ id: 7, kind: "ground", x: 200, y: 240, w: 30, h: 40, alive: true }];
  const shots: Projectile[] = [{ id: 9, weapon: "banana", x: 205, y: 250, vx: 11, w: 20, h: 14 }];
  const result = resolveProjectileHits(enemies, shots);
  assert.equal(result.scoreDelta, 100);
  assert.equal(result.enemies.length, 0);
});

test("permanent disguise defeats enemy contact without consuming armor", () => {
  const result = resolveEnemyContact({ ...base, disguised: true });
  assert.equal(result.survives, true);
  assert.equal(result.consumeEnemy, true);
  assert.equal(result.state.armor, 1);
});

test("mystery box permanently enables disguise and adds five bananas", () => {
  const result = openMysteryBox({ ...base, bananas: 2 });
  assert.equal(result.disguised, true);
  assert.equal(result.bananas, 7);
});
