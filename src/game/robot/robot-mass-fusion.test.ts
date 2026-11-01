import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMY, armyPosition } from "./robot-army.ts";
import {
  ASSEMBLE_MS,
  GATHER_MAX_MS,
  RALLY_SITE,
  SPLIT_MS,
  callArmy,
  canAssemble,
  cancelFusion,
  fusionPosition,
  idleFusion,
  rallySlot,
  splitFusion,
  stepFusion,
  validParticipants,
} from "./robot-mass-fusion.ts";
import {
  BLAST_RADIUS,
  BOSS_ARENA,
  BOSS_DAMAGE,
  BOSS_HP,
  BOSS_SHIELD,
  GIANT_DAMAGE,
  MINION_COUNT,
  freshBoss,
  freshWave,
  hitBoss,
  hitMinion,
  minionPosition,
  stepBoss,
} from "./robot-giant-battle.ts";
import { MAX_FUSION } from "./robot-catalog.ts";
import { armyResult, emptyRobots } from "./robot-engine.ts";
import { isWalkable } from "../world/adventure.ts";
import { worldDistance } from "../world/world-space.ts";
import { migrateSave, reduceWorld } from "../../lib/world-model.ts";

const ids = ARMY.map((r) => r.instanceId);

test("only exactly 100 different real army robots can be called", () => {
  assert.ok(validParticipants(ids));
  assert.equal(validParticipants(ids.slice(0, 99)), false);
  assert.equal(validParticipants([...ids.slice(0, 99), ids[0]!]), false, "duplicate id");
  assert.equal(validParticipants(Array.from({ length: 100 }, () => ids[0]!)), false);
  assert.equal(validParticipants([...ids.slice(0, 99), "army-999"]), false, "unknown robot");
  assert.equal(callArmy(1, ids.slice(0, 99), 0, 0), null);
  // The small 2·3 robot fusion limit is untouched.
  assert.equal(MAX_FUSION, 3);
});

test("99 arrived is not enough; the giant is built once, at 100/100", () => {
  assert.equal(canAssemble(ids, ids.slice(0, 99)), false);
  assert.equal(canAssemble(ids, [...ids.slice(0, 99), ids[5]!]), false, "a repeat isn't the 100th");
  assert.ok(canAssemble(ids, ids));
  let m = callArmy(1, ids, 0, 1000)!;
  assert.equal(m.phase, "gathering");
  // Robots arrive on their own time, some sooner than others.
  const times = Object.values(m.travelMs);
  assert.ok(Math.max(...times) > Math.min(...times));
  assert.ok(Math.max(...times) <= GATHER_MAX_MS);
  const lastArrival = 1000 + Math.max(...times);
  m = stepFusion(m, lastArrival - 1);
  assert.equal(m.phase, "gathering");
  assert.ok(m.arrived.length >= 1 && m.arrived.length < 100);
  m = stepFusion(m, lastArrival);
  assert.equal(m.phase, "assembling");
  assert.equal(new Set(m.arrived).size, 100);
  m = stepFusion(m, lastArrival + ASSEMBLE_MS);
  assert.equal(m.phase, "giant");
  assert.equal(stepFusion(m, lastArrival + ASSEMBLE_MS + 9999).phase, "giant");
});

test("100/100 waits for the player at the square; a called-off rally walks everyone home", () => {
  let m = callArmy(9, ids, 0, 0)!;
  m = stepFusion(m, GATHER_MAX_MS, false);
  assert.equal(m.phase, "gathering");
  assert.equal(new Set(m.arrived).size, 100);
  m = stepFusion(m, GATHER_MAX_MS + 10, true);
  assert.equal(m.phase, "assembling");
  // Calling off part-way: each robot starts home from where it actually is.
  let c = callArmy(10, ids, 0, 0)!;
  const robot = ARMY[7]!;
  const mid = fusionPosition(c, robot.instanceId, armyPosition(robot, 0), 1000)!;
  c = cancelFusion(c, 1000, (id) =>
    fusionPosition(
      c,
      id,
      armyPosition(
        ARMY.find((r) => r.instanceId === id)!,
        0,
      ),
      1000,
    ),
  );
  assert.equal(c.phase, "returning");
  assert.ok(
    worldDistance(fusionPosition(c, robot.instanceId, armyPosition(robot, 0), 1000)!, mid) < 1,
  );
  assert.equal(cancelFusion(idleFusion(), 0, () => null).phase, "idle");
});

test("gathering robots really walk from where they were to their own rally spot", () => {
  const m = callArmy(2, ids, 7, 0)!;
  const robot = ARMY[42]!;
  const start = fusionPosition(m, robot.instanceId, armyPosition(robot, 7), 0)!;
  assert.ok(worldDistance(start, armyPosition(robot, 7)) < 1);
  const end = fusionPosition(
    m,
    robot.instanceId,
    armyPosition(robot, 7),
    m.travelMs[robot.instanceId]!,
  )!;
  assert.ok(worldDistance(end, rallySlot(42)) < 1);
  // Rally spots are all different and around the square.
  const slots = ids.map((_, i) => rallySlot(i));
  assert.equal(new Set(slots.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`)).size, 100);
  assert.ok(slots.every((p) => worldDistance(p, RALLY_SITE) < 700 && isWalkable(p)));
});

test("splitting sends all 100 robots home; they are inside the giant until then", () => {
  let m = callArmy(3, ids, 0, 0)!;
  m = stepFusion(m, GATHER_MAX_MS);
  m = stepFusion(m, GATHER_MAX_MS + ASSEMBLE_MS);
  assert.equal(m.phase, "giant");
  assert.equal(fusionPosition(m, ids[0]!, { x: 0, y: 0 }, 0), null);
  assert.equal(splitFusion(idleFusion(), 0, RALLY_SITE).phase, "idle", "only a giant can split");
  const splitAt = { x: 1000, y: 3300 };
  m = splitFusion(m, 50000, splitAt);
  m = stepFusion(m, 50000 + SPLIT_MS);
  assert.equal(m.phase, "returning");
  // They walk home from where the giant split, not from the rally square.
  const first = fusionPosition(m, ids[0]!, armyPosition(ARMY[0]!, 0), m.since)!;
  assert.ok(worldDistance(first, splitAt) < 1);
  m = stepFusion(m, 50000 + SPLIT_MS + GATHER_MAX_MS);
  assert.equal(m.phase, "idle");
  for (const robot of ARMY)
    assert.deepEqual(
      fusionPosition(m, robot.instanceId, armyPosition(robot, 3), 0),
      armyPosition(robot, 3),
    );
});

test("boss: approaches, warns, and its slam only hits a giant still inside the circle", () => {
  let b = freshBoss();
  const giant = { x: BOSS_ARENA.x + 500, y: BOSS_ARENA.y };
  b = stepBoss(b, giant, 0, 0.05).boss;
  assert.equal(b.phase, "approach");
  b = stepBoss(b, giant, 100, 0.1).boss;
  assert.ok(worldDistance(b.pos, giant) < 500, "walks toward the giant");
  b = stepBoss(b, giant, 3000, 0.1).boss;
  assert.equal(b.phase, "telegraph");
  assert.deepEqual(b.target, giant);
  // Stay: hit. Step out: dodged.
  const stay = stepBoss(b, giant, b.until, 0.1);
  assert.equal(stay.giantDamage, BOSS_DAMAGE);
  const dodged = stepBoss(b, { x: giant.x + BLAST_RADIUS + 20, y: giant.y }, b.until, 0.1);
  assert.equal(dodged.giantDamage, 0);
  assert.equal(dodged.boss.phase, "attack");
});

test("boss: walks again between slams instead of slamming in place, and waits until close", () => {
  let b = freshBoss();
  const far = { x: BOSS_ARENA.x + 700, y: BOSS_ARENA.y };
  b = stepBoss(b, far, 0, 0.05).boss;
  // Long after the walk window, a giant that is still far is followed, not slammed.
  b = stepBoss(b, far, 5000, 0.1).boss;
  assert.equal(b.phase, "approach");
  const near = { x: b.pos.x + 300, y: b.pos.y };
  b = stepBoss(b, near, 5100, 0.1).boss;
  assert.equal(b.phase, "telegraph");
  b = stepBoss(b, near, b.until, 0.1).boss;
  assert.equal(b.phase, "attack");
  b = stepBoss(b, near, b.until, 0.1).boss;
  assert.equal(b.phase, "approach");
  // Right after a slam it walks for a while before the next one.
  const pos = b.pos;
  b = stepBoss(b, { x: near.x + 200, y: near.y }, b.until - 2400, 0.1).boss;
  assert.equal(b.phase, "approach");
  assert.ok(worldDistance(b.pos, pos) > 0, "it moved");
});

test("boss: shield first, then health, stagger on big hits, retreat at 0 and come back", () => {
  let b = freshBoss();
  let r = hitBoss(b, GIANT_DAMAGE, 0);
  assert.equal(r.boss.shield, BOSS_SHIELD - GIANT_DAMAGE);
  assert.equal(r.boss.hp, BOSS_HP);
  b = { ...r.boss, shield: 0 };
  r = hitBoss(b, GIANT_DAMAGE, 0);
  assert.equal(r.boss.hp, BOSS_HP - GIANT_DAMAGE);
  assert.equal(r.boss.phase, "stagger");
  r = hitBoss({ ...b, hp: 5 }, GIANT_DAMAGE, 1000);
  assert.equal(r.defeated, true);
  assert.equal(r.boss.phase, "retreat");
  assert.deepEqual(hitBoss(r.boss, 99, 1100), { boss: r.boss, defeated: false });
  assert.equal(stepBoss(r.boss, null, r.boss.until, 0.1).boss.hp, BOSS_HP);
  // A small robot's hit (power 1-3) barely scratches the shield.
  assert.equal(hitBoss(freshBoss(), 2, 0).boss.hp, BOSS_HP);
});

test("minions: one giant hit each, the wave is cleared once", () => {
  let w = freshWave(1);
  assert.equal(w.minions.length, MINION_COUNT);
  for (let i = 0; i < MINION_COUNT; i++) assert.ok(isWalkable(minionPosition(i, i * 3)));
  let cleared = 0;
  for (const m of w.minions) {
    const r = hitMinion(w, m.id, GIANT_DAMAGE, 500);
    w = r.wave;
    if (r.cleared) cleared++;
  }
  assert.equal(cleared, 1);
  assert.ok(w.minions.every((m) => m.phase === "retreat"));
  assert.equal(hitMinion(w, w.minions[0]!.id, 99, 600).cleared, false);
});

test("army results are paid once and survive a save round trip at version 3", () => {
  let p = armyResult(emptyRobots(), "bossWins", 1);
  assert.equal(p.bossWins, 1);
  assert.equal(armyResult(p, "bossWins", 1), p);
  p = armyResult(p, "minionWaves", 1);
  p = armyResult(p, "massFusions", 1);
  let s = migrateSave({ version: 3, money: 500, ownedCars: ["car-001", "car-021"] });
  s = reduceWorld(s, { type: "robot-discover", id: "lg-shield" });
  assert.equal(reduceWorld(s, { type: "robot-discover", id: "lg-shield" }), s);
  assert.equal(reduceWorld(s, { type: "robot-discover", id: "rb-sky" }), s, "only legends");
  s = reduceWorld(s, { type: "robot-army", kind: "massFusions", n: 1 });
  s = reduceWorld(s, { type: "robot-army", kind: "bossWins", n: 1 });
  assert.equal(reduceWorld(s, { type: "robot-army", kind: "bossWins", n: 1 }), s);
  const back = migrateSave(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(back.robots, s.robots);
  assert.equal(back.robots.cards["lg-shield"]?.uses, 0);
  assert.equal(back.version, 3);
  assert.equal(back.money, 500);
  assert.ok(back.ownedCars.includes("car-021"));
});
