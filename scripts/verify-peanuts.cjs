// Uses isolated synthetic saves and the existing browser installation.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { migrateSave, reduceWorld } = require("../src/lib/world-model.ts");
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4175/phj-game/";
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-peanut-evidence";
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
      await page.clock.install();
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
          miniBest: { fishing: 5 },
          robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
        }),
      );
      const game = page.locator(".peanut-game");
      const save = () => page.evaluate(() => JSON.parse(localStorage.getItem("hyunjun-game-v2")));
      const phase = async (value) =>
        page.waitForFunction(
          (v) => document.querySelector(".peanut-game")?.dataset.phase === v,
          value,
        );
      const start = async () => {
        await page.getByRole("button", { name: "땅콩 놀이 시작", exact: true }).click();
        await phase("playing");
      };
      const crack = async () => {
        const order = (await game.getAttribute("data-order")).split(",");
        for (const spot of order) {
          const button = page.locator(`[data-spot="${spot}"]`);
          if (width < 500) await button.tap();
          else await button.click();
        }
      };
      await page.goto(url + "#/kart", { waitUntil: "networkidle" });
      const before = await save();
      await page.getByRole("button", { name: "미니게임", exact: true }).click();
      assert.equal(
        await page.locator('[data-game-id="mn-08"]').getAttribute("data-status"),
        "playable",
      );
      await page.locator('[data-game-id="mn-08"] a').click();
      await phase("ready");
      await page.screenshot({ path: `${out}/intro-${width}.png`, fullPage: true });
      await start();
      for (const button of await page.locator(".peanut-shell button").all()) {
        const box = await button.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const timeBefore = Number(await game.getAttribute("data-remaining"));
      await page.clock.runFor(2000);
      const timeAfter = Number(await game.getAttribute("data-remaining"));
      assert.ok(timeBefore - timeAfter >= 1.9 && timeBefore - timeAfter < 3);
      await crack();
      assert.equal(await game.getAttribute("data-score"), "1");
      await page.getByRole("button", { name: "잠깐 쉬기", exact: true }).click();
      const paused = await game.getAttribute("data-remaining");
      await page.clock.runFor(5000);
      assert.equal(await game.getAttribute("data-remaining"), paused);
      await page.getByRole("button", { name: "이어서 깨기", exact: true }).click();
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      await phase("paused");
      await page.getByRole("button", { name: "이어서 깨기", exact: true }).click();
      await page.screenshot({ path: `${out}/playing-${width}.png`, fullPage: true });
      for (let i = 1; i < 8; i++) await crack();
      await phase("won");
      await page.waitForFunction(
        () => JSON.parse(localStorage.getItem("hyunjun-game-v2")).miniBest.peanuts === 8,
      );
      const won = await save();
      const expected = reduceWorld(before, {
        type: "settle-mini",
        game: "peanuts",
        id: "expected",
        score: 8,
      });
      assert.equal(won.money, expected.money);
      assert.equal(won.settledMinis.length, before.settledMinis.length + 1);
      for (const key of ["ownedCars", "robots", "plots", "houseTier", "runnerBest"])
        assert.deepEqual(won[key], before[key]);
      await page.screenshot({ path: `${out}/won-${width}.png`, fullPage: true });
      await page.getByRole("link", { name: "카트로 돌아가기", exact: true }).click();
      await page.goBack();
      await phase("ready");
      assert.deepEqual(await save(), won);
      await start();
      await crack();
      // The second nut starts on the right: three wrong middle taps must end it.
      for (let i = 0; i < 3; i++) await page.locator('[data-spot="1"]').click();
      await phase("lost");
      await page.waitForFunction(
        (money) => JSON.parse(localStorage.getItem("hyunjun-game-v2")).money === money,
        won.money + 4,
      );
      const lost = await save();
      assert.equal(lost.miniBest.peanuts, 8);
      await page.getByRole("button", { name: "한 번 더 도전", exact: true }).click();
      await phase("playing");
      await crack();
      await page.getByRole("link", { name: "카트로 돌아가기", exact: true }).click();
      assert.deepEqual(await save(), lost);
      await page.goBack();
      await phase("ready");
      await start();
      await crack();
      await page.reload({ waitUntil: "networkidle" });
      await phase("ready");
      assert.deepEqual(await save(), lost);
      await start();
      await page.clock.runFor(500);
      await page.waitForFunction(
        () => Number(document.querySelector(".peanut-game").dataset.remaining) < 60,
      );
      await page.clock.fastForward(61000);
      await page.clock.runFor(100);
      await phase("lost");
      assert.equal(await game.getAttribute("data-score"), "0");
      assert.equal((await save()).money, lost.money);
      await page.setViewportSize({ width: 844, height: 390 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      results.push({
        width,
        result: "PASS",
        winAndRetry: true,
        mistakesAndTimeout: true,
        pauseAndBlur: true,
        rewardsOnce: true,
        cancellationAndReload: true,
        assetsPreserved: true,
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
