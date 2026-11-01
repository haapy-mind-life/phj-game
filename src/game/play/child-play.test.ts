import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateSave, reduceWorld } from "../../lib/world-model.ts";
import { CARS } from "../economy/cars.ts";

test("new game owns only starter; v2 purchases refunded once without losing home or clothes", () => {
  const fresh = migrateSave(null);
  assert.equal(fresh.version, 3);
  assert.deepEqual(fresh.ownedCars, ["car-001"]);
  const old = migrateSave({
    version: 2,
    money: 100,
    houseTier: 3,
    outfit: "witch",
    ownedOutfits: ["witch"],
    ownedCars: ["car-001", "car-121", "car-121", "car-126"],
  });
  assert.equal(old.money, 400);
  assert.equal(old.houseTier, 3);
  assert.equal(old.outfit, "witch");
  assert.deepEqual(migrateSave(old), old);
});
test("five cars enforce purchase order, funds, one-time upgrades and persistence", () => {
  assert.equal(CARS.length, 5);
  let s = migrateSave({ version: 3, money: 1000 });
  assert.equal(reduceWorld(s, { type: "buy-car", id: "car-011" }), s);
  s = reduceWorld(s, { type: "buy-car", id: "car-021" });
  assert.equal(s.money, 880);
  assert.equal(reduceWorld(s, { type: "buy-car", id: "car-021" }), s);
  s = reduceWorld(s, { type: "upgrade-car", id: "car-021", upgrade: "engine" });
  assert.equal(s.money, 820);
  assert.equal(reduceWorld(s, { type: "upgrade-car", id: "car-021", upgrade: "engine" }), s);
  assert.equal(reduceWorld(s, { type: "upgrade-car", id: "car-011", upgrade: "special" }), s);
  assert.deepEqual(migrateSave(s).carUpgrades, s.carUpgrades);
});
test("play rewards settle once, with bounded bonus and a functional delivery upgrade", () => {
  let s = migrateSave({ version: 3, money: 500 });
  s = reduceWorld(s, { type: "upgrade-car", id: "car-001", upgrade: "special" });
  const next = reduceWorld(s, {
    type: "settle-play",
    id: "delivery-1",
    activity: "delivery",
    bonus: true,
  });
  assert.equal(next.money - s.money, 58);
  assert.equal(
    reduceWorld(next, { type: "settle-play", id: "delivery-1", activity: "delivery", bonus: true }),
    next,
  );
  assert.equal(reduceWorld(s, { type: "settle-play", id: "", activity: "sea", bonus: true }), s);
});

test("starter furniture occupies accessible room slots and keeps entrance/doors clear", async () => {
  const { homeFurniturePlacements, canWalkHome } = await import("../world/life-world.ts");
  const s = migrateSave(null),
    placed = homeFurniturePlacements(s.room, 1);
  assert.equal(placed.length, 3);
  for (const item of placed) assert.ok(canWalkHome({ x: item.x, y: item.y }, 1));
  assert.ok(placed.some((p) => p.id === "bed" && p.y < 738));
  assert.ok(homeFurniturePlacements(s.room, 3).some((p) => p.id === "bed" && p.y > 865));
});

test("engine always adds fifteen percent at 30fps and lower without unbounded frame jumps", async () => {
  const { stepPlayer } = await import("../world/adventure.ts");
  const p = { x: 3000, y: 850 },
    d = { x: 1, y: 0 };
  for (const dt of [1 / 60, 1 / 30, 1 / 20, 1]) {
    const base = stepPlayer(p, d, dt, 1.48),
      engine = stepPlayer(p, d, dt, 1.48 * 1.15);
    assert.ok(Math.abs((engine.x - p.x) / (base.x - p.x) - 1.15) < 1e-8);
    assert.ok(engine.x - p.x <= 245 * 0.05 * 1.48 * 1.15 + 0.001);
  }
});
