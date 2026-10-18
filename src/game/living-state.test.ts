import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateSave, reduceWorld } from "../lib/world-model.ts";
import { isHalloween } from "./world-content.ts";
test("old saves retain outfits and start vehicle progression; malformed party is sanitized", () => {
  const s = migrateSave({
    money: 400,
    companions: ["dad", "dad", "fake", "robot", "friend-home", "friend-character", "friend-chief"],
    guests: ["dad"],
  });
  assert.equal(s.ownedCars.length, 1);
  assert.ok(s.ownedOutfits.includes("mint"));
  assert.equal(s.companions.length, 4);
  assert.ok(!s.guests.includes("dad"));
});
test("invitations and followers have one role and never silently replace a full party", () => {
  let s = migrateSave(null);
  for (const id of ["dad", "robot", "friend-home", "friend-character"])
    s = reduceWorld(s, { type: "companion", id, mode: "follow" });
  assert.equal(reduceWorld(s, { type: "companion", id: "friend-chief", mode: "follow" }), s);
  s = reduceWorld(s, { type: "companion", id: "dad", mode: "invite" });
  assert.ok(!s.companions.includes("dad"));
  assert.ok(s.guests.includes("dad"));
});
test("purchases and activities are atomic, idempotent and survive migration", () => {
  let s = migrateSave({ money: 500 });
  s = reduceWorld(s, { type: "buy-outfit", id: "witch" });
  assert.equal(s.money, 440);
  assert.equal(reduceWorld(s, { type: "buy-outfit", id: "witch" }), s);
  s = reduceWorld(s, { type: "buy-car", id: "car-021" });
  assert.equal(s.money, 320);
  const next = reduceWorld(s, {
    type: "settle-activity",
    id: "job-1",
    activity: "restaurant",
    completed: true,
  });
  assert.equal(next.money, 365);
  assert.equal(
    reduceWorld(next, {
      type: "settle-activity",
      id: "job-1",
      activity: "restaurant",
      completed: true,
    }),
    next,
  );
  assert.ok(migrateSave(next).ownedOutfits.includes("witch"));
  assert.ok(migrateSave(next).ownedCars.includes("car-021"));
});
test("Halloween uses Korean calendar and outside October cannot award candy", () => {
  assert.equal(isHalloween(new Date("2026-09-30T15:00:00Z")), true);
  assert.equal(isHalloween(new Date("2026-10-31T15:00:00Z")), false);
  const s = migrateSave({ halloween: { active: true, candy: [], completed: false } });
  assert.equal(
    reduceWorld(s, { type: "collect-candy", id: "candy-kitchen", now: "2026-11-01T00:00:00Z" }),
    s,
  );
});

test("reference novice route buys first upgrade after two games and the castle within 45 rounds", () => {
  let s = migrateSave(null),
    first = 0,
    castle = 0;
  for (let round = 1; round <= 45; round++) {
    s = reduceWorld(s, {
      type: "settle-mini",
      game: "treasure",
      score: 6,
      id: `reference-${round}`,
    });
    const next = reduceWorld(s, { type: "upgrade-house" });
    if (next.houseTier > s.houseTier) {
      if (!first) first = round;
      if (next.houseTier === 4) castle = round;
    }
    s = next;
  }
  assert.equal(first, 2);
  assert.ok(castle >= 30 && castle <= 45);
});
