import { candySpotsForHouse } from "../lib/world-model.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FOOD_MENU,
  canWalkHome,
  LIFE_MAPS,
  LIFE_SPOTS,
  SEA_TREASURES,
  foodById,
  nextFoodOrder,
  nearSpot,
  nearbyTreasure,
  stepLifePlayer,
} from "./life-world.ts";

test("all requested foods and visually giant pizza variants exist", () => {
  for (const name of ["돈까스", "김치", "피자", "콜라", "대왕 피자", "초대형 황금 피자"])
    assert.ok(
      FOOD_MENU.some((food) => food.name === name),
      name,
    );
  assert.equal(new Set(FOOD_MENU.map((food) => food.id)).size, FOOD_MENU.length);
  assert.ok(foodById("giant-pizza")!.size > foodById("pizza")!.size);
  assert.ok(foodById("gold-pizza")!.size > foodById("giant-pizza")!.size);
  assert.equal(foodById("not-food"), undefined);
});
test("valid distinct repeating customer requests and no hidden sale on creation", () => {
  const first = nextFoodOrder(0, "order-1");
  const second = nextFoodOrder(1, "order-2");
  assert.notEqual(first.foodId, second.foodId);
  assert.equal(first.phase, "offered");
  assert.equal(nextFoodOrder(FOOD_MENU.length, "order-3").foodId, first.foodId);
});
test("new world areas have room for a mansion, coast and an extended ocean", () => {
  assert.ok(LIFE_MAPS.coast.width > 3500);
  assert.ok(LIFE_MAPS.mansion.width > 2000);
  assert.ok(LIFE_MAPS["deep-sea"].width > LIFE_MAPS.mansion.width);
  assert.ok(nearSpot(LIFE_SPOTS.foodTruck, LIFE_SPOTS.foodTruck));
  assert.equal(nearSpot(LIFE_SPOTS.foodTruck, LIFE_SPOTS.foodCustomer), false);
});
test("on-foot coast remains on land; submarine remains within deep sea", () => {
  const shore = stepLifePlayer("coast", { x: 3298, y: 1500 }, { x: 1, y: 0 }, 1);
  assert.equal(shore.x, 3300);
  const sea = stepLifePlayer("deep-sea", { x: 4160, y: 1500 }, { x: 1, y: 0 }, 1);
  assert.equal(sea.x, LIFE_MAPS["deep-sea"].width - 45);
  const home = stepLifePlayer("mansion", LIFE_SPOTS.mansionInside, { x: -100, y: -100 }, 100);
  assert.ok(home.x >= 45 && home.y >= 45);
});
test("underwater treasure sites can be discovered individually", () => {
  assert.equal(new Set(SEA_TREASURES.map((site) => site.id)).size, 3);
  for (const site of SEA_TREASURES) assert.equal(nearbyTreasure(site)?.id, site.id);
  assert.equal(nearbyTreasure({ x: 400, y: 970 }), null);
});

test("home entry is in the hallway, away from locked rooms and the exit trigger", () => {
  assert.ok(LIFE_SPOTS.mansionInside.x > 1000 && LIFE_SPOTS.mansionInside.x < 1180);
  assert.ok(!nearSpot(LIFE_SPOTS.mansionInside, LIFE_SPOTS.mansionExit, 180));
});
test("home movement respects exterior walls, room walls and open doorways", () => {
  const left = stepLifePlayer("mansion", { x: 140, y: 450 }, { x: -1, y: 0 }, 0.05);
  assert.equal(left.x, 140);
  const wall = stepLifePlayer("mansion", { x: 400, y: 710 }, { x: 0, y: 1 }, 0.05);
  assert.equal(wall.y, 710);
  const door = stepLifePlayer("mansion", { x: 650, y: 710 }, { x: 0, y: 1 }, 0.05);
  assert.ok(door.y > 710);
});
test("upgrades open rooms without trapping the player in the entrance hall", () => {
  assert.equal(canWalkHome({ x: 1600, y: 450 }, 1), false);
  assert.equal(canWalkHome({ x: 1600, y: 450 }, 2), true);
  assert.equal(canWalkHome({ x: 600, y: 1100 }, 2), false);
  assert.equal(canWalkHome({ x: 600, y: 1100 }, 3), true);
  for (const tier of [1, 2, 3, 4]) {
    assert.ok(canWalkHome(LIFE_SPOTS.mansionInside, tier));
    assert.ok(canWalkHome(LIFE_SPOTS.mansionExit, tier));
  }
});

test("every unlocked room, exit and party candy is reachable from the entry", () => {
  for (const tier of [1, 2, 3, 4]) {
    const seen = new Set<string>();
    const queue = [{ x: 1110, y: 850 }];
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i]!;
      for (const d of [
        { x: 10, y: 0 },
        { x: -10, y: 0 },
        { x: 0, y: 10 },
        { x: 0, y: -10 },
      ]) {
        const next = { x: p.x + d.x, y: p.y + d.y };
        const key = `${next.x},${next.y}`;
        if (!seen.has(key) && canWalkHome(next, tier)) {
          seen.add(key);
          queue.push(next);
        }
      }
    }
    for (const spot of [
      LIFE_SPOTS.mansionExit,
      LIFE_SPOTS.mansionKitchen,
      LIFE_SPOTS.mansionDining,
      ...candySpotsForHouse(tier),
    ]) {
      assert.ok(
        queue.some((p) => nearSpot(p, spot, 50)),
        `tier ${tier}: ${JSON.stringify(spot)}`,
      );
    }
  }
});

test("house walking keeps its speed on slow frames while wall checks remain bounded", () => {
  let smooth = { x: 650, y: 800 },
    slow = { ...smooth };
  for (let i = 0; i < 60; i++)
    smooth = stepLifePlayer("mansion", smooth, { x: 1, y: 0 }, 1 / 60, 4);
  for (let i = 0; i < 10; i++) slow = stepLifePlayer("mansion", slow, { x: 1, y: 0 }, 0.1, 4);
  assert.ok(Math.abs(smooth.x - slow.x) < 0.001);
  assert.ok(canWalkHome(slow, 4));
});
