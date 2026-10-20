import { test } from "node:test";
import assert from "node:assert/strict";
import { familyAuthPassword } from "./family-pin.ts";
test("four-digit family PINs preserve leading zeroes and become valid server passwords", () => {
  assert.equal(familyAuthPassword("0357"), "family-pin:0357");
  assert.ok(familyAuthPassword("2468").length >= 6);
});
test("existing six-digit accounts remain compatible, malformed PINs are rejected", () => {
  assert.equal(familyAuthPassword("246813"), "246813");
  for (const pin of ["", "357", "12345", "1234567", "ab12", " 2468", "2e34"])
    assert.throws(() => familyAuthPassword(pin));
});
