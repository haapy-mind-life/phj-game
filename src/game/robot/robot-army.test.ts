import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARMY,
  ARMY_SIZE,
  DRILL_PERIOD,
  PATROL_PERIOD,
  SQUADS,
  SQUAD_SIZE,
  armyNear,
  armyPosition,
  squadOf,
} from "./robot-army.ts";
import { isWalkable, PORTALS, SPAWN } from "../world/adventure.ts";
import { worldDistance } from "../world/world-space.ts";
import { LEGENDS } from "./robot-catalog.ts";
import { RESCUE_SPOT, THIEF_HOME, THIEF_LEASH, VILLAIN_SPOT, WORKSHOP } from "./robot-catalog.ts";
import { DELIVERY_GARAGE } from "../play/place-play.ts";
import { STATIONS } from "../world/world-events.ts";
import { TOWN_BUILDINGS } from "../world/building-interiors.ts";
import { RESTAURANTS } from "../world/world-content.ts";
import { VILLAGES } from "../world/villages.ts";

test("the army is exactly 100 different robots in 20 squads of 5", () => {
  assert.equal(ARMY.length, ARMY_SIZE);
  assert.equal(new Set(ARMY.map((r) => r.instanceId)).size, 100);
  assert.equal(SQUADS.length * SQUAD_SIZE, 100);
  assert.equal(new Set(SQUADS.map((s) => s.id)).size, SQUADS.length);
  for (const s of SQUADS)
    assert.equal(ARMY.filter((r) => r.squadId === s.id).length, SQUAD_SIZE, s.id);
});

test("six legends lead six different squads; the rest are regular robots", () => {
  const legends = ARMY.filter((r) => r.legendary);
  assert.equal(legends.length, 6);
  assert.equal(new Set(legends.map((r) => r.species)).size, 6);
  assert.equal(new Set(legends.map((r) => r.squadId)).size, 6);
  assert.ok(legends.every((r) => r.slot === 0 && r.species.startsWith("lg-")));
  assert.ok(ARMY.filter((r) => !r.legendary).every((r) => r.species.startsWith("rb-")));
  // A squad mixes looks instead of five clones.
  for (const s of SQUADS)
    assert.ok(new Set(ARMY.filter((r) => r.squadId === s.id).map((r) => r.species)).size >= 3);
});

test("squads live all over the world, some near the start, with two behaviours", () => {
  assert.ok(new Set(SQUADS.map((s) => s.region)).size >= 18);
  assert.ok(
    SQUADS.filter((s) => s.region && VILLAGES.slice(0, 10).some((v) => v.id === s.region)).length >=
      6,
  );
  assert.ok(SQUADS.some((s) => worldDistance(s.anchor, SPAWN) < 900));
  assert.ok(SQUADS.some((s) => s.behavior === "patrol"));
  assert.ok(SQUADS.some((s) => s.behavior === "drill"));
  const legendNearStart = ARMY.find(
    (r) => r.legendary && worldDistance(squadOf(r).anchor, SPAWN) < 900,
  );
  assert.ok(legendNearStart, "a legend can be met near the start");
});

test("every robot stays on open ground, away from doors, stations and missions, all day", () => {
  const busy: [{ x: number; y: number }, number][] = [
    ...PORTALS.map((p) => [p, 200] as [typeof p, number]),
    ...RESTAURANTS.map((r) => [r, 200] as [typeof r, number]),
    ...TOWN_BUILDINGS.map((b) => [b.door, 140] as [typeof b.door, number]),
    [DELIVERY_GARAGE, 300],
    ...Object.values(STATIONS).map((s) => [s, 300] as [typeof s, number]),
    [VILLAIN_SPOT, 400],
    [RESCUE_SPOT, 360],
    [THIEF_HOME, THIEF_LEASH + 100],
    [WORKSHOP, 300],
  ];
  for (const robot of ARMY) {
    const period = squadOf(robot).behavior === "patrol" ? PATROL_PERIOD : DRILL_PERIOD;
    for (let t = 0; t < period; t += 0.5) {
      const p = armyPosition(robot, t);
      assert.ok(isWalkable(p), `${robot.instanceId} at ${t}s`);
      for (const [q, r] of busy)
        assert.ok(worldDistance(p, q) > r, `${robot.instanceId} near busy spot`);
    }
  }
});

test("robots never jump: positions change smoothly, also at turns and corners", () => {
  for (const robot of ARMY)
    for (let t = 0; t < 40; t += 0.1) {
      const d = worldDistance(armyPosition(robot, t), armyPosition(robot, t + 0.1));
      assert.ok(d < 8, `${robot.instanceId} jumped ${d.toFixed(1)} at ${t.toFixed(1)}s`);
    }
});

test("robots really move over time, the same way every time", () => {
  for (const robot of ARMY) {
    const a = armyPosition(robot, 3),
      b = armyPosition(robot, 9);
    assert.ok(worldDistance(a, b) > 40, robot.instanceId);
    assert.deepEqual(armyPosition(robot, 3), a);
  }
});

test("only nearby robots are handed to the screen, capped", () => {
  const anchor = SQUADS[1]!.anchor;
  const near = armyNear(anchor, 0, 900, 12);
  assert.ok(near.length > 0 && near.length <= 12);
  assert.ok(near.every((n) => n.d <= 900));
  assert.ok(near.every((n, i) => i === 0 || near[i - 1]!.d <= n.d));
});

test("each legend's hint names its squad's village and points the right way", () => {
  for (const legend of LEGENDS) {
    const robot = ARMY.find((r) => r.species === legend.id)!;
    const { region, anchor } = squadOf(robot);
    const village = VILLAGES.find((v) => v.id === region)!;
    const hint = legend.hint ?? "";
    assert.ok(hint.includes(village.name), `${legend.id} hint should name ${village.name}`);
    if (hint.includes("왼쪽")) assert.ok(anchor.x < village.x, legend.id);
    if (hint.includes("오른쪽")) assert.ok(anchor.x > village.x, legend.id);
    if (/쪽 위|위쪽/.test(hint)) assert.ok(anchor.y < village.y, legend.id);
    if (/쪽 아래|아래쪽/.test(hint)) assert.ok(anchor.y > village.y, legend.id);
  }
});
