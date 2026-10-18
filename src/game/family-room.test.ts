import test from "node:test";
import assert from "node:assert/strict";
import {
  applyMessage,
  drawPosition,
  makeRoomCode,
  normalizeRoomCode,
  parsePlayerMessage,
  pruneStale,
  shouldSend,
  visibleRemotes,
  type PlayerMessage,
} from "./family-room.ts";

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

test("sending is throttled, skips unchanged state, and always sends a new emote", () => {
  assert.equal(shouldSend(null, msg(), 0, 0), true);
  assert.equal(shouldSend(msg(), msg({ x: 120 }), 100, 0), false);
  assert.equal(shouldSend(msg(), msg({ x: 120 }), 250, 0), true);
  assert.equal(shouldSend(msg(), msg(), 5000, 0), false);
  assert.equal(shouldSend(msg(), msg({ emote: "👋" }), 10, 0), true);
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
  assert.equal(Object.keys(pruneStale(r, 5050)).length, 3);
  assert.equal(Object.keys(pruneStale(r, 5200)).length, 0);
});

test("remote draw position glides over one interval and filters by region", () => {
  let r = applyMessage({}, msg({ x: 0, y: 0 }), "me", 0);
  r = applyMessage(r, msg({ t: 1100, x: 100, y: 50, region: "mansion" }), "me", 1000);
  const p = drawPosition(r["abcd-1"]!, 1100);
  assert.deepEqual(p, { x: 50, y: 25 });
  assert.deepEqual(drawPosition(r["abcd-1"]!, 5000), { x: 100, y: 50 });
  assert.equal(visibleRemotes(r, "village").length, 0);
  assert.equal(visibleRemotes(r, "mansion").length, 1);
});

test("presence admits only the first four people by join time", async () => {
  const { admittedByPresence } = await import("./family-room.ts");
  const m = [1, 2, 3, 4, 5].map((n) => ({ id: `p-${n}`, joinedAt: n * 10 }));
  assert.equal(admittedByPresence(m, "p-4"), true);
  assert.equal(admittedByPresence(m, "p-5"), false);
  assert.equal(admittedByPresence(m.slice(0, 3), "p-3"), true);
  assert.equal(admittedByPresence(m, "ghost"), false);
});
