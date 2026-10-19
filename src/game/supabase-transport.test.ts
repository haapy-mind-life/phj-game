import { test } from "node:test";
import assert from "node:assert/strict";
import { presenceIds } from "./supabase-transport.ts";
test("presence deduplicates sessions and rejects invalid peer ids", () => {
  assert.deepEqual(
    presenceIds({
      a: [{ id: "p-1234" }, { id: "p-1234" }],
      b: [{ id: "p-5678" }, { id: "<b>" }, null],
      c: "invalid",
    }),
    ["p-1234", "p-5678"],
  );
  assert.deepEqual(presenceIds(null), []);
});
