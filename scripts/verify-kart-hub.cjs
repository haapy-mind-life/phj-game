// Isolated synthetic saves; uses the existing playwright-core / Chromium installation.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { migrateSave } = require("../src/lib/world-model.ts");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4175/phj-game/";
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-kart-evidence";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    headless: true,
    args: ["--no-sandbox"],
  });
  const results = [];
  try {
    for (const width of [360, 390, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: width < 500 ? 844 : 900 },
        hasTouch: width < 500,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(
        (seed) => {
          if (!localStorage.getItem("hyunjun-game-v2"))
            localStorage.setItem("hyunjun-game-v2", JSON.stringify(seed));
        },
        migrateSave({
          version: 3,
          money: 3000,
          ownedCars: ["car-001", "car-021"],
          houseTier: 3,
          runnerBest: 400,
          robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
        }),
      );
      const hub = async () => {
        await page.getByRole("heading", { name: "박현준 카트", exact: true }).waitFor();
        assert.equal(await page.locator("[data-game-id]").count(), 40);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      };
      const save = () => page.evaluate(() => JSON.parse(localStorage.getItem("hyunjun-game-v2")));
      await page.goto(url + "#/kart", { waitUntil: "networkidle" });
      await hub();
      const before = await save();
      for (const [id, route] of [
        ["lg-07", "/house"],
        ["lg-08", "/greenhouse"],
      ]) {
        await page.locator(`[data-game-id="${id}"] a`).click();
        assert.ok(page.url().endsWith("#" + route));
        await page.getByRole("link", { name: "카트 열기", exact: true }).click();
        await hub();
        assert.deepEqual(await save(), before);
      }
      for (const link of await page
        .locator(".kart-start a, .kart-filters button, .kart-list-tools button")
        .all()) {
        const box = await link.boundingBox();
        assert.ok(box && box.width >= 44 && box.height >= 44);
      }
      await page.locator('[data-game-id="lg-05"]').click();
      assert.ok(page.url().endsWith("#/kart"));
      assert.deepEqual(await save(), before);
      assert.equal(await page.locator('[data-status="planned"] a').count(), 0);
      await page.getByRole("button", { name: "미니게임", exact: true }).click();
      assert.equal(await page.locator("[data-game-id]").count(), 20);
      await page.getByRole("button", { name: "뒤쪽 게임 보기" }).click();
      await page.waitForTimeout(450);
      assert.ok(await page.locator(".kart-list").evaluate((e) => e.scrollLeft > 0));
      if (width < 500) {
        await page.locator(".kart-list").evaluate((e) => e.scrollTo({ left: 0 }));
        const box = await page.locator(".kart-list").boundingBox();
        const cdp = await context.newCDPSession(page);
        const y = Math.round(box.y + Math.min(100, box.height / 2));
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: width - 40, y }],
        });
        for (let x = width - 60; x >= 40; x -= 20) {
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x, y }],
          });
        }
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await page.waitForTimeout(400);
        assert.ok(await page.locator(".kart-list").evaluate((e) => e.scrollLeft > 0));
      }
      await page.getByRole("button", { name: "전체", exact: true }).click();
      assert.ok(await page.locator(".kart-list").evaluate((e) => e.scrollLeft <= 2));
      await page.screenshot({ path: `${out}/hub-${width}.png`, fullPage: true });
      await page.getByRole("link", { name: "박현준 게임", exact: false }).first().click();
      await page.locator(".adv-player").first().waitFor();
      const position = () =>
        page
          .locator(".adv-player")
          .first()
          .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
      await page.screenshot({ path: `${out}/world-${width}.png` });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const initial = await position();
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(600);
      await page.keyboard.up("ArrowRight");
      const moved = await position();
      assert.ok(Math.abs(moved.x - initial.x) > 10);
      await page.getByRole("link", { name: "카트 열기", exact: true }).click();
      await hub();
      await page.locator(".kart-world").click();
      await page.locator(".adv-player").first().waitFor();
      const returned = await position();
      assert.ok(Math.abs(returned.x - moved.x) < 5);
      await page.getByRole("link", { name: "카트 열기", exact: true }).click();
      await page.locator(".kart-run").dblclick();
      await page.getByRole("button", { name: "화면을 눌러 점프", exact: true }).waitFor();
      await page.getByRole("button", { name: "폴짝!", exact: true }).click();
      await page.waitForTimeout(2200);
      await page.getByRole("link", { name: "카트 열기", exact: true }).click();
      await hub();
      const settled = await save();
      assert.equal(settled.version, 3);
      for (const key of ["ownedCars", "houseTier", "robots"])
        assert.deepEqual(settled[key], before[key]);
      assert.ok(settled.money >= before.money);
      assert.ok(settled.runnerBest >= before.runnerBest);
      await page.reload({ waitUntil: "networkidle" });
      await hub();
      assert.deepEqual(await save(), settled);
      await page.goBack();
      await page.getByRole("button", { name: "화면을 눌러 점프", exact: true }).waitFor();
      await page.goForward();
      await hub();
      assert.deepEqual(await save(), settled);
      await page.setViewportSize({ width: 844, height: 390 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      results.push({
        width,
        result: "PASS",
        worldMovement: true,
        returnPosition: true,
        savePreserved: true,
        historyAndReload: true,
      });
      await context.close();
    }
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
