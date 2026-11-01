import test from "node:test";
import assert from "node:assert/strict";
import { KART_GAMES, type KartEntry } from "./kart-catalog.ts";

test("kart has 20 large and 20 mini candidates with unique stable identities", () => {
  assert.equal(KART_GAMES.length, 40);
  assert.equal(KART_GAMES.filter((g) => g.kind === "large").length, 20);
  assert.equal(KART_GAMES.filter((g) => g.kind === "mini").length, 20);
  assert.equal(new Set(KART_GAMES.map((g) => g.id)).size, 40);
  assert.equal(new Set(KART_GAMES.map((g) => g.name)).size, 40);
  assert.ok(KART_GAMES.every((g) => g.name.startsWith("박현준 ")));
});

test("only verified existing entry points can launch; planned games cannot navigate", () => {
  const games: readonly KartEntry[] = KART_GAMES;
  assert.deepEqual(
    games.filter((g) => g.status === "playable").map((g) => g.route),
    ["/", "/race", "/greenhouse", "/rooms", "/peanuts"],
  );
  assert.deepEqual(
    games.filter((g) => g.status === "existing").map((g) => g.route),
    ["/house"],
  );
  assert.ok(games.filter((g) => g.status === "planned").every((g) => !("route" in g)));
});
