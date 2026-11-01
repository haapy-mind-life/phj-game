import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TOWN_BUILDINGS,
  nearTownBuilding,
  BUILDING_ROOM,
  stepBuilding,
  canWalkBuilding,
} from "./building-interiors.ts";
import { isWalkable, stepPlayer } from "./adventure.ts";
import { HOME_LOTS } from "./kid-world.ts";
import { RESTAURANTS } from "./world-content.ts";
import { REGIONS, buildingRegion, restaurantRegion } from "../family/family-room.ts";

test("every town building has an accessible entrance and a distinct family interior", () => {
  assert.equal(TOWN_BUILDINGS.length, 41);
  assert.equal(new Set(TOWN_BUILDINGS.map((b) => b.id)).size, TOWN_BUILDINGS.length);
  for (const b of TOWN_BUILDINGS) {
    assert.ok(isWalkable(b.door), b.id);
    let p = { x: b.door.x, y: b.door.y + 200 };
    for (let i = 0; i < 16; i++) p = stepPlayer(p, { x: 0, y: -1 }, 0.05);
    assert.equal(nearTownBuilding(p)?.id, b.id);
    assert.ok(REGIONS.includes(buildingRegion(b.id)));
    assert.ok(!REGIONS.includes(buildingRegion(`${b.id}-invalid`)));
  }
  for (const r of RESTAURANTS) {
    assert.ok(isWalkable({ x: r.x, y: r.y + 130 }), r.id);
    assert.ok(REGIONS.includes(restaurantRegion(r.id)));
  }
  for (const lot of HOME_LOTS) assert.ok(isWalkable({ x: lot.x, y: lot.y + 45 }), lot.id);
});

test("town interiors allow walking from entry to activity and exit, with solid furniture", () => {
  let p = { ...BUILDING_ROOM.entry };
  assert.ok(canWalkBuilding(p));
  assert.ok(Math.hypot(p.x - BUILDING_ROOM.exit.x, p.y - BUILDING_ROOM.exit.y) > 110);
  for (let i = 0; i < 28; i++) p = stepBuilding(p, { x: 0, y: -1 }, 0.05);
  assert.ok(Math.hypot(p.x - BUILDING_ROOM.activity.x, p.y - BUILDING_ROOM.activity.y) < 230);
  for (let i = 0; i < 100; i++) p = stepBuilding(p, { x: 0, y: -1 }, 0.05);
  assert.ok(p.y >= 450, "counter blocks walking through furniture");
  for (let i = 0; i < 100; i++) p = stepBuilding(p, { x: 0, y: 1 }, 0.05);
  assert.ok(Math.hypot(p.x - BUILDING_ROOM.exit.x, p.y - BUILDING_ROOM.exit.y) < 110);
  assert.ok(canWalkBuilding(p));
  assert.deepEqual(stepBuilding(p, { x: 0, y: 1 }, -1), p);
});
