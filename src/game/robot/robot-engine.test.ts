import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BATTLE_RANGE,
  CARD_USES_TO_UNLOCK,
  RESCUE_PATCHES,
  RESCUE_SPOT,
  THIEF_HOME,
  THIEF_LEASH,
  UPGRADE_COST,
  VILLAIN_RESPAWN_MS,
  VILLAIN_SPOT,
  WIN_PARTS,
  MISSION_PARTS,
  WORKSHOP,
  WORKSHOP_RANGE,
  robotById,
} from "./robot-catalog.ts";
import {
  applyCardUse,
  emptyRobots,
  freshVillain,
  hitVillain,
  isWatchCardAvailable,
  meetRobot,
  missionReward,
  normalizeRobots,
  recordFusion,
  resolveStrike,
  teamPower,
  teamWeapon,
  upgradeRobot,
  validFusion,
  villainMaxHp,
  winBattle,
} from "./robot-engine.ts";
import { douseRescue, hitThief, startRescue, startThief, stepThief } from "./robot-missions.ts";
import { isWalkable, PORTALS, SPAWN, stepPlayer } from "../world/adventure.ts";
import { worldDelta, worldDistance } from "../world/world-space.ts";
import { migrateSave, reduceWorld } from "../../lib/world-model.ts";
import { DELIVERY_GARAGE } from "../play/place-play.ts";
import { STATIONS } from "../world/world-events.ts";

test("starter cards are already in the watch; the first summon saves the card once", () => {
  const p = emptyRobots();
  assert.ok(isWatchCardAvailable(p, "rb-police"));
  assert.ok(isWatchCardAvailable(p, "rb-sky"));
  assert.equal(isWatchCardAvailable(p, "rb-thunder-police"), false);
  const met = meetRobot(p, "rb-police");
  assert.deepEqual(met.cards, { "rb-police": { uses: 0, grade: 0 } });
  assert.equal(meetRobot(met, "rb-police"), met);
  // Locked cards can't be written into the watch by summoning.
  assert.equal(meetRobot(p, "rb-thunder-police"), p);
});

test("the 7th valid use powers the robot up and opens the next card, exactly once", () => {
  let p = meetRobot(emptyRobots(), "rb-police");
  for (let i = 1; i < CARD_USES_TO_UNLOCK; i++) {
    const r = applyCardUse(p, "rb-police");
    assert.equal(r.unlocked, null);
    assert.equal(r.poweredUp, false);
    p = r.progress;
  }
  assert.equal(p.cards["rb-police"]?.grade, 0);
  const seventh = applyCardUse(p, "rb-police");
  assert.equal(seventh.poweredUp, true);
  assert.equal(seventh.unlocked, "rb-thunder-police");
  assert.deepEqual(seventh.progress.cards["rb-police"], { uses: 7, grade: 1 });
  assert.ok(teamPower(seventh.progress, ["rb-police"]) > teamPower(p, ["rb-police"]));
  const again = applyCardUse(seventh.progress, "rb-police");
  assert.equal(again.progress, seventh.progress);
  assert.equal(again.unlocked, null);
  assert.equal(again.poweredUp, false);
  assert.equal(applyCardUse(emptyRobots(), "rb-fire").progress.cards["rb-fire"], undefined);
});

test("one strike judgement: too far or cooling down never hits or counts", () => {
  const w = robotById("rb-police").weapon;
  const at = { x: 1000, y: 1000 };
  assert.equal(resolveStrike(w, at, { x: 1000 + w.range - 1, y: 1000 }, 5000, 0), "hit");
  assert.equal(resolveStrike(w, at, { x: 1000 + w.range + 1, y: 1000 }, 5000, 0), "far");
  assert.equal(resolveStrike(w, at, at, 5000, 5000 - w.cooldownMs + 1), "cooldown");
  // Fusions use the arms robot's weapon and reach further.
  assert.equal(teamWeapon(["rb-police", "rb-fire"]).kind, "cannon");
  assert.ok(
    teamWeapon(["rb-police", "rb-fire", "rb-sky"]).range > robotById("rb-fire").weapon.range,
  );
});

test("fusion needs 2-3 different robots from the watch and keeps every card", () => {
  const p = emptyRobots();
  assert.equal(validFusion(p, ["rb-police"]), false);
  assert.equal(validFusion(p, ["rb-police", "rb-police"]), false);
  assert.equal(validFusion(p, ["rb-police", "rb-thunder-police"]), false);
  assert.equal(validFusion(p, ["rb-police", "rb-fire", "rb-sky", "rb-fire"]), false);
  const two = recordFusion(p, ["rb-police", "rb-fire"]);
  assert.equal(two.fusionBest, 2);
  const three = recordFusion(two, ["rb-police", "rb-fire", "rb-sky"]);
  assert.equal(three.fusionBest, 3);
  assert.equal(three.fusionCount, 2);
  assert.equal(recordFusion(three, ["rb-sky", "rb-sky"]), three);
  assert.ok(
    teamPower(three, ["rb-police", "rb-fire", "rb-sky"]) >
      teamPower(three, ["rb-police", "rb-fire"]),
  );
});

test("villain, rescue and thief rewards pay once; workshop upgrades cost parts, never robots", () => {
  let p = meetRobot(emptyRobots(), "rb-fire");
  p = winBattle(p, 1);
  assert.equal(p.parts, WIN_PARTS);
  assert.equal(winBattle(p, 1), p);
  p = missionReward(p, "rescue", 1);
  assert.equal(p.rescues, 1);
  assert.equal(missionReward(p, "rescue", 1), p);
  p = missionReward(p, "thief", 1);
  assert.equal(p.catches, 1);
  assert.equal(p.parts, WIN_PARTS + 2 * MISSION_PARTS);
  const up = upgradeRobot(p, "rb-fire");
  assert.equal(up.cards["rb-fire"]?.grade, 1);
  assert.equal(up.parts, p.parts - UPGRADE_COST);
  assert.equal(upgradeRobot(up, "rb-sky"), up);
  assert.equal(upgradeRobot({ ...up, parts: 0 }, "rb-fire").cards["rb-fire"]?.grade, 1);
});

test("villains get tougher, retreat when switched off, and can't be beaten twice", () => {
  assert.ok(villainMaxHp(5) > villainMaxHp(0));
  assert.equal(villainMaxHp(1000), 30);
  const r = hitVillain(freshVillain(0), 99, 5000);
  assert.equal(r.defeated, true);
  assert.equal(r.villain.back, 5000 + VILLAIN_RESPAWN_MS);
  assert.deepEqual(hitVillain(r.villain, 5, 6000), { villain: r.villain, defeated: false });
});

test("rescue: each valid hit puts out bushes until the friend is safe", () => {
  let r = startRescue();
  assert.equal(r.burning, RESCUE_PATCHES);
  r = douseRescue(r, 1);
  assert.equal(r.phase, "danger");
  r = douseRescue(r, 2);
  assert.equal(r.phase, "safe");
  assert.equal(douseRescue(r, 1), r);
});

test("thief: runs away on walkable ground inside its leash, and a chase catches it", () => {
  let t = startThief();
  let chaser = { x: THIEF_HOME.x + 400, y: THIEF_HOME.y };
  const start = { ...t.pos };
  t = stepThief(t, chaser, 0.1, 0);
  assert.ok(worldDistance(t.pos, chaser) > worldDistance(start, chaser), "flees from the chaser");
  // Chase at walking speed for up to 30 s; the police sword must get in range.
  const sword = robotById("rb-police").weapon;
  let caughtAt = -1;
  let last = -1e9;
  for (let ms = 0; ms < 30000; ms += 100) {
    t = stepThief(t, chaser, 0.1, ms);
    assert.ok(isWalkable(t.pos));
    assert.ok(worldDistance(t.pos, THIEF_HOME) <= THIEF_LEASH + 1);
    const d = worldDelta(chaser, t.pos);
    chaser = stepPlayer(chaser, { x: d.x, y: d.y }, 0.1);
    if (resolveStrike(sword, chaser, t.pos, ms, last) === "hit") {
      last = ms;
      const r = hitThief(t, true, ms);
      t = r.thief;
      if (r.caught) {
        caughtAt = ms;
        break;
      }
    }
  }
  assert.ok(caughtAt >= 0, "caught within 30 s");
  assert.equal(t.phase, "caught");
});

test("only a police robot can arrest the thief; others stop it for a moment", () => {
  let t = startThief();
  for (let i = 0; i < 5; i++) t = hitThief(t, false, i * 2000).thief;
  assert.equal(t.phase, "stunned");
  const arrest = hitThief(t, true, 20000);
  assert.equal(arrest.caught, true);
  assert.equal(hitThief(arrest.thief, true, 21000).caught, false);
});

test("every robot save shape loads; old progress and existing cars and coins are kept", () => {
  const base = {
    version: 3,
    money: 777,
    ownedCars: ["car-001", "car-021"],
    carUpgrades: { "car-021": { engine: true, special: false } },
  };
  const plain = migrateSave(base);
  // main (PR #37): uses only, a full card from before grades existed.
  const main = migrateSave({ ...base, robots: { cards: { "rb-police": { uses: 7 } } } });
  assert.deepEqual(main.robots.cards["rb-police"], { uses: 7, grade: 1 });
  assert.ok(main.robots.cards["rb-thunder-police"]);
  // PR #38: parts, wins, per-card grade.
  const b = migrateSave({
    ...base,
    robots: { cards: { "rb-fire": { uses: 2, grade: 1 } }, parts: 4, wins: 3 },
  });
  assert.deepEqual(b.robots.cards["rb-fire"], { uses: 2, grade: 1 });
  assert.equal(b.robots.parts, 4);
  assert.equal(b.robots.wins, 3);
  // PR #39: materials, one global grade, fusion progress.
  const w = migrateSave({
    ...base,
    robots: {
      cards: { "rb-sky": { uses: 1 } },
      materials: 6,
      grade: 1,
      wins: 2,
      fusionBest: 3,
      fusionCount: 4,
      settled: ["x"],
    },
  });
  assert.equal(w.robots.parts, 6);
  assert.equal(w.robots.cards["rb-sky"]?.grade, 1);
  // That branch's one grade covered every starter robot, not only cards already saved.
  assert.equal(w.robots.cards["rb-police"]?.grade, 1);
  assert.equal(w.robots.cards["rb-fire"]?.grade, 1);
  assert.equal(w.robots.fusionBest, 3);
  assert.equal(w.robots.fusionCount, 4);
  assert.equal(w.robots.wins, 2);
  for (const s of [main, b, w]) {
    assert.equal(s.version, 3);
    assert.equal(s.money, plain.money);
    assert.deepEqual(s.ownedCars, plain.ownedCars);
    assert.deepEqual(s.carUpgrades, plain.carUpgrades);
    // Round trip through JSON keeps robots exactly.
    assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(s))).robots, s.robots);
  }
  assert.deepEqual(normalizeRobots("bad"), emptyRobots());
});

test("robot actions go through the world reducer once", () => {
  let s = migrateSave({ version: 3 });
  s = reduceWorld(s, { type: "robot-meet", id: "rb-police" });
  for (let i = 0; i < 9; i++) s = reduceWorld(s, { type: "robot-card", id: "rb-police" });
  assert.equal(s.robots.cards["rb-police"]?.uses, 7);
  assert.equal(s.robots.cards["rb-police"]?.grade, 1);
  s = reduceWorld(s, { type: "robot-fuse", ids: ["rb-police", "rb-fire"] });
  assert.equal(s.robots.fusionBest, 2);
  assert.equal(reduceWorld(s, { type: "robot-fuse", ids: ["rb-police"] }), s);
  s = reduceWorld(s, { type: "robot-mission", mode: "thief", n: 1 });
  assert.equal(reduceWorld(s, { type: "robot-mission", mode: "thief", n: 1 }), s);
  s = reduceWorld(s, { type: "robot-win", win: 1 });
  s = reduceWorld(s, { type: "robot-upgrade", id: "rb-police" });
  assert.equal(s.robots.cards["rb-police"]?.grade, 2);
});

test("mission places are open ground, apart from each other and from play stations", () => {
  const places = [
    [VILLAIN_SPOT, BATTLE_RANGE],
    [WORKSHOP, WORKSHOP_RANGE],
    [RESCUE_SPOT, 260],
    [THIEF_HOME, THIEF_LEASH],
  ] as const;
  for (const [spot, range] of places) {
    assert.ok(isWalkable(spot));
    assert.ok(worldDistance(spot, SPAWN) < 1400);
    for (const gate of PORTALS)
      assert.ok(worldDistance(gate, spot) > Math.min(range, 260) + 60, gate.id);
    for (const station of [DELIVERY_GARAGE, ...Object.values(STATIONS)])
      assert.ok(worldDistance(station, spot) > 180 + Math.min(range, 260));
  }
  for (let i = 0; i < places.length; i++)
    for (let j = i + 1; j < places.length; j++)
      assert.ok(
        worldDistance(places[i]![0], places[j]![0]) >
          Math.min(places[i]![1], 260) + Math.min(places[j]![1], 260),
        `${i}-${j}`,
      );
});
