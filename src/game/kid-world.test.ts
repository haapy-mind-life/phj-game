import { test } from "node:test";
import assert from "node:assert/strict";
import { isWalkable, stepPlayer } from "./adventure.ts";
import {
  CONSTRUCTION,
  HOME_LOTS,
  ISLANDS,
  LANDMARKS,
  homeLot,
  islandAt,
  isSeaWater,
  nearKidSpot,
} from "./kid-world.ts";
import { canLandPlane, canPlaneDive, canTakeOff, stepPlane, AIRPORT } from "./unified-world.ts";
import { RESTAURANTS } from "./world-content.ts";
import { canWalkHome } from "./life-world.ts";
import { migrateSave, reduceWorld } from "../lib/world-model.ts";

test("islands and countries sit in the sea, are walkable, and are plane landing/takeoff spots", () => {
  assert.ok(["독도", "제주도", "일본", "울릉도"].every((n) => ISLANDS.some((i) => i.name === n)));
  for (const i of ISLANDS) {
    const c: { x: number; y: number } = { x: i.x, y: i.y };
    assert.ok(i.x - i.rx > 7380 && i.x + i.rx < 10200, i.id);
    assert.equal(islandAt(c)?.id, i.id);
    assert.ok(isWalkable(c) && canLandPlane(c) && canTakeOff(c) && !canPlaneDive(c), i.id);
    // Walking off the island edge stops at the shore instead of entering the water.
    let p = c;
    for (let k = 0; k < 200; k++) p = stepPlayer(p, { x: 1, y: 0 }, 0.05);
    assert.ok(islandAt(p), i.id);
  }
  assert.ok(isSeaWater({ x: 7600, y: 900 }) && !canLandPlane({ x: 7600, y: 900 }));
  assert.ok(!canTakeOff({ x: 3000, y: 1600 }) && canTakeOff(AIRPORT));
});

test("plane flies over and under the sea and keeps going past it", () => {
  let p = { x: AIRPORT.x, y: AIRPORT.y };
  let dived = false;
  for (let k = 0; k < 300; k++) {
    p = stepPlane(p, { x: 1, y: 0 }, 0.05);
    if (canPlaneDive(p)) dived = true;
  }
  assert.ok(dived);
  assert.ok(p.x > 10200 && !canPlaneDive(p), "the plane continues east once the sea ends");
});

test("new buildings, lots and burger restaurants keep their doors walkable", () => {
  const doors = [
    ...LANDMARKS.map((l) => ({ x: l.x, y: l.y + 40 })),
    { x: CONSTRUCTION.x, y: CONSTRUCTION.y + 40 },
    ...HOME_LOTS.map((l) => ({ x: l.x, y: l.y + 45 })),
    ...RESTAURANTS.map((r) => ({ x: r.x, y: r.y + 100 })),
  ];
  for (const d of doors) assert.ok(isWalkable(d), JSON.stringify(d));
  for (const l of LANDMARKS) assert.ok(!isWalkable({ x: l.x, y: l.y - 120 }), l.id);
  const big = RESTAURANTS.find((r) => r.id === "mcdonalds")!;
  assert.ok(!isWalkable({ x: big.x + 200, y: big.y - 260 }), "McDonald's is bigger than before");
});

test("town spots: landmarks, construction, and empty lots (never the current home)", () => {
  const office = LANDMARKS.find((l) => l.id === "dad-office")!;
  const spot = nearKidSpot({ x: office.x, y: office.y + 40 }, "original");
  assert.equal(spot?.kind === "landmark" && spot.landmark.name, "아빠 회사");
  assert.equal(
    nearKidSpot({ x: CONSTRUCTION.x, y: CONSTRUCTION.y + 40 }, "original")?.kind,
    "construction",
  );
  const jeju = homeLot("jeju");
  assert.equal(nearKidSpot({ x: jeju.x, y: jeju.y + 45 }, "original")?.kind, "lot");
  assert.equal(nearKidSpot({ x: jeju.x, y: jeju.y + 45 }, "jeju"), null);
  assert.equal(nearKidSpot({ x: 480, y: 610 }, "original"), null);
  assert.equal(nearKidSpot({ x: 480, y: 610 }, "jeju")?.kind, "lot");
});

test("moving house keeps level, money, yard; old saves default to the original lot", () => {
  const old = migrateSave({ version: 3, money: 2000, houseTier: 3, yard: ["lights"] });
  assert.equal(old.homeLot, "original");
  const moved = reduceWorld(old, { type: "move-house", lot: "jeju" });
  assert.equal(moved.homeLot, "jeju");
  assert.equal(moved.money, 2000);
  assert.equal(moved.houseTier, 3);
  assert.deepEqual(moved.yard, ["lights"]);
  assert.equal(reduceWorld(moved, { type: "move-house", lot: "nowhere" }), moved);
  assert.equal(migrateSave(JSON.parse(JSON.stringify(moved))).homeLot, "jeju");
  assert.equal(migrateSave({ homeLot: "mars" }).homeLot, "original");
});

test("house tier 5 costs 1500 and opens the wider palace wing", () => {
  let s = migrateSave({ version: 3, money: 1499, houseTier: 4 });
  assert.equal(reduceWorld(s, { type: "upgrade-house" }).houseTier, 4);
  s = { ...s, money: 1500 };
  s = reduceWorld(s, { type: "upgrade-house" });
  assert.equal(s.houseTier, 5);
  assert.equal(s.money, 0);
  assert.equal(reduceWorld({ ...s, money: 9999 }, { type: "upgrade-house" }).houseTier, 5);
  assert.equal(migrateSave(s).houseTier, 5);
  const pool = { x: 2525, y: 450 },
    door = { x: 2120, y: 1030 };
  assert.ok(!canWalkHome(pool, 4) && !canWalkHome(door, 4));
  assert.ok(canWalkHome(pool, 5) && canWalkHome(door, 5));
  assert.ok(!canWalkHome({ x: 2120, y: 500 }, 5), "the wing is entered only through its door");
});
