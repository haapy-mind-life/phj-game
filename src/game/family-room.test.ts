import { TOWN_BUILDINGS, BUILDING_ROOM } from "./building-interiors.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyMessage,
  drawPosition,
  makeRoomCode,
  normalizeRoomCode,
  parsePlayerMessage,
  pruneStale,
  restaurantRegion,
  buildingRegion,
  shouldSend,
  visibleRemotes,
  type PlayerMessage,
} from "./family-room.ts";
import { RESTAURANTS, RESTAURANT_ROOM } from "./world-content.ts";

test("every restaurant interior is a shared family region with room-sized bounds", () => {
  for (const r of RESTAURANTS) {
    const region = restaurantRegion(r.id);
    const inside = parsePlayerMessage(msg({ region, x: 750, y: 860 }));
    assert.equal(inside?.region, region, r.id);
    assert.equal(parsePlayerMessage(msg({ region, x: RESTAURANT_ROOM.width + 1 })), null);
  }
  const mcd = restaurantRegion("mcdonalds");
  const remotes = applyMessage({}, msg({ region: mcd, x: 750, y: 860 }), "me", 0);
  assert.equal(visibleRemotes(remotes, mcd).length, 1);
  assert.equal(visibleRemotes(remotes, restaurantRegion("pizza")).length, 0);
  assert.equal(visibleRemotes(remotes, "village").length, 0);
  assert.equal(
    visibleRemotes(applyMessage({}, msg({ region: "mansion", x: 650, y: 650 }), "me", 0), "mansion")
      .length,
    1,
  );
});

const msg = (over: Partial<PlayerMessage> = {}): PlayerMessage => ({
  id: "abcd-1",
  nick: "아빠",
  region: "village",
  x: 100,
  y: 200,
  facing: 1,
  outfit: "mint",
  moving: true,
  emote: null,
  t: 1000,
  ...over,
});

test("room codes avoid confusing characters and validate input", () => {
  for (let i = 0; i < 200; i++) assert.match(makeRoomCode(), /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(makeRoomCode(() => 0.999999).length, 6);
  assert.equal(normalizeRoomCode(" abc234 "), "ABC234");
  assert.equal(normalizeRoomCode("ABC10O"), null);
  assert.equal(normalizeRoomCode("ABC23"), null);
});

test("messages accept only numbers and listed values", () => {
  assert.deepEqual(parsePlayerMessage(msg()), msg());
  assert.equal(parsePlayerMessage({ ...msg(), nick: "아무개" }), null);
  assert.equal(parsePlayerMessage({ ...msg(), emote: "<b>hi</b>" }), null);
  assert.equal(parsePlayerMessage({ ...msg(), x: 99999 }), null);
  assert.equal(parsePlayerMessage({ ...msg(), x: NaN }), null);
  assert.equal(parsePlayerMessage({ ...msg(), region: "moon" }), null);
  assert.equal(parsePlayerMessage({ ...msg(), id: "<script>" }), null);
  assert.equal(parsePlayerMessage(null), null);
  assert.equal(parsePlayerMessage("x"), null);
  assert.equal(parsePlayerMessage({ ...msg(), emote: "🎃" })?.emote, "🎃");
  const clean = parsePlayerMessage({ ...msg(), extra: "ignored" }) as Record<string, unknown>;
  assert.equal("extra" in clean, false);
});

test("sending is throttled, skips unchanged state briefly, and throttles emotes", () => {
  assert.equal(shouldSend(null, msg(), 0, 0), true);
  assert.equal(shouldSend(msg(), msg({ x: 120 }), 100, 0), false);
  assert.equal(shouldSend(msg(), msg({ x: 120 }), 250, 0), true);
  assert.equal(shouldSend(msg(), msg(), 500, 0), false);
  assert.equal(shouldSend(msg(), msg({ emote: "👋" }), 10, 0), false);
  assert.equal(shouldSend(msg({ emote: "👋" }), msg({ emote: "👋" }), 10, 0), false);
});

test("remote players ignore self and stale packets, cap the room, and expire", () => {
  let r = applyMessage({}, msg(), "me", 0);
  assert.equal(Object.keys(r).length, 1);
  assert.equal(applyMessage(r, msg({ id: "me-1" }), "me-1", 0), r);
  assert.equal(applyMessage(r, msg({ t: 500, x: 1 }), "me", 10), r);
  r = applyMessage(r, msg({ t: 1200, x: 300 }), "me", 100);
  assert.deepEqual(r["abcd-1"]!.from, { x: 100, y: 200 });
  r = applyMessage(r, msg({ id: "bbbb-2", nick: "엄마" }), "me", 100);
  r = applyMessage(r, msg({ id: "cccc-3", nick: "누나" }), "me", 100);
  assert.equal(applyMessage(r, msg({ id: "dddd-4", nick: "현준" }), "me", 100), r);
  assert.equal(Object.keys(pruneStale(r, 15050)).length, 3);
  assert.equal(Object.keys(pruneStale(r, 15200)).length, 0);
});

test("remote draw position glides over one interval and filters by region", () => {
  let r = applyMessage({}, msg({ x: 0, y: 0, region: "mansion" }), "me", 0);
  r = applyMessage(r, msg({ t: 1100, x: 100, y: 50, region: "mansion" }), "me", 1000);
  const p = drawPosition(r["abcd-1"]!, 1100);
  assert.deepEqual(p, { x: 50, y: 25 });
  assert.deepEqual(drawPosition(r["abcd-1"]!, 5000), { x: 100, y: 50 });
  assert.equal(visibleRemotes(r, "village").length, 0);
  assert.equal(visibleRemotes(r, "mansion").length, 1);
});

test("expanded world and purchased outfits are valid; inherited property names never crash", () => {
  assert.ok(parsePlayerMessage(msg({ x: 17000, y: 9600, outfit: "witch" })));
  for (const id of ["constructor", "toString"]) {
    const parsed = parsePlayerMessage(msg({ id }));
    assert.ok(parsed);
    assert.doesNotThrow(() => applyMessage({}, parsed, "self", 0));
  }
});
test("idle heartbeat, nickname and clearing emotes are sent with the same throttle", () => {
  assert.equal(shouldSend(msg(), msg({ t: 4000 }), 4000, 1000), true);
  assert.equal(shouldSend(msg(), msg({ nick: "엄마" }), 300, 0), true);
  assert.equal(shouldSend(msg(), msg({ emote: "👋" }), 10, 0), false);
  assert.equal(shouldSend(msg({ emote: "👋" }), msg(), 300, 0), true);
});
test("inactive scenes hide avatars, duplicate packets do not rewind, torus interpolation takes shortest route", () => {
  let r = applyMessage({}, msg({ x: 20380, y: 10780 }), "self", 0);
  const next = msg({ x: 20, y: 20, t: 1100 });
  r = applyMessage(r, next, "self", 1000);
  const drawn = drawPosition(r["abcd-1"]!, 1100);
  assert.ok(drawn.x < 30 || drawn.x > 20370);
  assert.ok(drawn.y < 30 || drawn.y > 10770);
  assert.equal(applyMessage(r, next, "self", 2000), r);
  r = applyMessage(r, msg({ active: false, t: 1200 }), "self", 2200);
  assert.equal(visibleRemotes(r, "village").length, 0);
  assert.equal(shouldSend(msg(), msg({ active: false }), 300, 0), true);
});

test("town interiors bound family positions and hide members in other buildings", () => {
  for (const b of TOWN_BUILDINGS) {
    const region = buildingRegion(b.id);
    const packet = msg({ region, ...BUILDING_ROOM.entry });
    assert.ok(parsePlayerMessage(packet), b.id);
    assert.equal(parsePlayerMessage(msg({ region, x: BUILDING_ROOM.width + 1 })), null);
    const remotes = applyMessage({}, packet, "me", 0);
    assert.equal(visibleRemotes(remotes, region).length, 1);
    assert.equal(visibleRemotes(remotes, "village").length, 0);
    assert.equal(visibleRemotes(remotes, restaurantRegion("pizza")).length, 0);
    const other = TOWN_BUILDINGS.find((o) => o.id !== b.id)!;
    assert.equal(visibleRemotes(remotes, buildingRegion(other.id)).length, 0);
  }
  assert.equal(parsePlayerMessage(msg({ region: buildingRegion("unknown") })), null);
});
