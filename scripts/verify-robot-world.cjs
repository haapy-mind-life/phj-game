// Isolated preview saves; requires existing playwright-core and headless Chromium.
// Robot world PR-A: meet a roaming robot, ride it, use its card 7 times on the practice
// robot, keep the count after reload, get off, and leave it behind on map travel.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { ROBOTS, PRACTICE_TARGET } = require("../src/game/robot-catalog.ts");
const police = ROBOTS.find((r) => r.id === "rb-police");
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-robot-evidence";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const mobile = viewport.width < 500;
      const name = mobile ? "phone" : "tablet";
      const page = await browser.newPage({ viewport });
      page.on("pageerror", (e) => errors.push(e.message));
      // Seed once so a reload keeps whatever the game saved.
      await page.addInitScript(() => {
        if (!localStorage.getItem("hyunjun-game-v2"))
          localStorage.setItem("hyunjun-game-v2", JSON.stringify({ version: 3, money: 3000 }));
      });
      const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
      await page.goto(url, { waitUntil: "networkidle" });
      const btn = (label) => page.getByRole("button", { name: label, exact: true });
      const action = page.locator(".adv-interact");
      const hint = page.locator(".adv-touch-hint");
      const card = page.locator("[data-robot-card]");
      async function position() {
        return page
          .locator(".adv-map .adv-player:not(.hj-remote)")
          .first()
          .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
      }
      async function move(axis, target) {
        for (let i = 0; i < 60; i++) {
          const p = await position(),
            gap = target - p[axis];
          if (Math.abs(gap) < 14) return;
          const key =
            axis === "x"
              ? gap > 0
                ? "ArrowRight"
                : "ArrowLeft"
              : gap > 0
                ? "ArrowDown"
                : "ArrowUp";
          await page.keyboard.down(key);
          await page.waitForTimeout(Math.min(400, Math.max(35, (Math.abs(gap) / 300) * 1000)));
          await page.keyboard.up(key);
        }
        throw Error(`Blocked ${axis}=${target} at ${JSON.stringify(await position())}`);
      }
      async function goToPolice() {
        await move("y", police.home.y + 60);
        await move("x", police.home.x);
        await page.waitForFunction(() =>
          document.querySelector(".adv-interact")?.textContent?.startsWith("경찰 로봇"),
        );
      }
      async function ride() {
        assert.equal(await action.innerText(), "경찰 로봇 타기");
        await action.click();
        await page.getByRole("img", { name: /가 탄 경찰 로봇$/ }).waitFor();
      }

      await goToPolice();
      assert.equal(await action.innerText(), "경찰 로봇 만나기");
      await action.click();
      assert.ok((await hint.innerText()).includes("카드를 받았어"));
      await ride();
      assert.ok((await card.innerText()).includes("경찰 로봇 카드 0/7"));
      assert.equal(await btn("차 타기").count(), 0);
      console.log(`PASS ${name} meet and ride the police robot`);

      if (mobile) {
        // Drag the on-screen joystick while riding: the robot must move with it.
        const before = await position();
        const stick = page.getByLabel("이동 조이스틱");
        const box = await stick.boundingBox();
        const cx = box.x + box.width / 2,
          cy = box.y + box.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx, cy + 60, { steps: 4 });
        await page.waitForTimeout(500);
        await page.mouse.up();
        const after = await position();
        assert.ok(after.y - before.y > 40, JSON.stringify({ before, after }));
        console.log("PASS phone joystick moves the riding robot");
      }

      await move("x", PRACTICE_TARGET.x - 50);
      await move("y", PRACTICE_TARGET.y - 50);
      for (let i = 0; i < 7; i++) {
        assert.equal(await action.innerText(), `카드 쓰기 (${i}/7)`);
        await action.click();
        await page.waitForTimeout(1600);
      }
      assert.ok((await hint.innerText()).includes("축하해! 새로운 로봇 카드가 열렸어!"));
      assert.ok((await card.innerText()).includes("7/7"));
      await page.screenshot({ path: `${out}/robot-unlock-${name}.png` });
      // Taps faster than the cooldown don't count.
      await action.click();
      assert.ok((await hint.innerText()).includes("다 채웠어"));
      console.log(`PASS ${name} 7 card uses open the thunder police card`);

      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await card.count(), 0);
      await goToPolice();
      await ride();
      assert.ok((await card.innerText()).includes("7/7"));
      assert.equal(await page.locator('[data-robot="rb-thunder-police"]').count(), 1);
      await page.screenshot({ path: `${out}/robot-world-${name}.png` });
      console.log(`PASS ${name} reload keeps the full card and the new robot roams`);

      await btn("내리기").click();
      assert.equal(await card.count(), 0);
      assert.equal(await btn("차 타기").count(), 1);
      await ride();
      await btn("지도").click();
      await btn("💼 아빠 회사").click();
      assert.equal(await card.count(), 0);
      assert.equal(await page.getByRole("img", { name: /가 탄 경찰 로봇$/ }).count(), 0);
      console.log(`PASS ${name} get off, and map travel leaves the robot behind`);
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log("PASS no browser runtime errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
