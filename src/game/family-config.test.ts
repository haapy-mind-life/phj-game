import { test } from "node:test";
import assert from "node:assert/strict";
import { familyConfiguration, parseMembership, familyTopic } from "./family-config.ts";
test("absent config is local; partial or privileged config fails closed", () => {
  assert.deepEqual(familyConfiguration("", ""), { mode: "local" });
  assert.equal(familyConfiguration("https://example.supabase.co", "").mode, "invalid");
  assert.equal(
    familyConfiguration("https://example.supabase.co", "sb_secret_forbidden").mode,
    "invalid",
  );
  const secret =
    "eyJhbGciOiJIUzI1NiJ9." + btoa(JSON.stringify({ role: "service_role" })) + ".secret";
  assert.equal(familyConfiguration("https://example.supabase.co", secret).mode, "invalid");
  assert.equal(familyConfiguration("http://example.com", "sb_publishable_example").mode, "invalid");
  assert.equal(
    familyConfiguration("https://example.supabase.co", "sb_publishable_example").mode,
    "supabase",
  );
});
test("membership and topic require a family UUID, known nickname and normalized code", () => {
  const m = { family_id: "11111111-1111-4111-8111-111111111111", nickname: "아빠" };
  assert.deepEqual(parseMembership(m), { familyId: m.family_id, nickname: "아빠" });
  assert.equal(parseMembership({ ...m, nickname: "외부인" }), null);
  assert.equal(parseMembership({ ...m, family_id: "family:other" }), null);
  assert.equal(familyTopic(m.family_id, "abc234"), "family:" + m.family_id + ":ABC234");
  assert.throws(() => familyTopic(m.family_id, "ABC10O"));
});
