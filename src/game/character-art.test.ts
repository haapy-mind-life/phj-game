import { test } from "node:test";
import assert from "node:assert/strict";
import { characterSvg } from "./character-art.ts";

test("walking and diving retain a complete character in every outfit", () => {
  for (const outfit of ["mint", "peach", "lavender"] as const) {
    for (const motion of ["idle", "walk", "swim"] as const) {
      const svg = characterSvg(outfit, motion, motion === "swim");
      for (const part of ["arm-left", "arm-right", "leg-left", "leg-right", "face"])
        assert.ok(svg.includes(`data-part="${part}"`), `${outfit}/${motion}: ${part}`);
      assert.ok(svg.includes(`data-motion="${motion}"`));
      assert.ok(svg.includes("prefers-reduced-motion"));
      if (motion === "swim") assert.ok(svg.includes('data-part="dive-mask"'));
    }
  }
});

test("reduced motion also disables animation inside embedded SVG images", () => {
  const svg = characterSvg("mint", "swim", true, true);
  assert.ok(svg.includes("*{animation:none!important}"));
  assert.ok(svg.includes('data-part="dive-mask"'));
});
