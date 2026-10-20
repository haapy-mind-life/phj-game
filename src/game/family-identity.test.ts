import { test } from "node:test";
import assert from "node:assert/strict";
import { familyIdentity } from "./family-identity.ts";
import { characterSvg } from "./character-art.ts";
test("validated family names select distinct identities and guests have a safe default", () => {
  assert.deepEqual(
    ["현준", "아빠", "엄마", "누나"].map((n) => familyIdentity(n).id),
    ["hyunjun", "dad", "mom", "sister"],
  );
  assert.equal(familyIdentity(null).name, "현준");
  assert.equal(familyIdentity("<script>").id, "hyunjun");
});
test("family faces stay distinct in the same purchased outfit, walking and diving", () => {
  for (const motion of ["idle", "walk", "swim"] as const) {
    const faces = ["현준", "아빠", "엄마", "누나"].map((n) => {
      const identity = familyIdentity(n);
      const svg = characterSvg("witch", motion, motion === "swim", false, identity.id);
      assert.ok(svg.includes(`data-identity="${identity.id}"`));
      assert.ok(svg.includes('data-part="leg-left"'));
      assert.ok(svg.includes('data-part="face"'));
      // Compare the face geometry itself: a changed label or collar is insufficient.
      return svg.slice(svg.indexOf('<g data-part="face">'), svg.lastIndexOf("</g>"));
    });
    assert.equal(new Set(faces).size, 4);
  }
});
