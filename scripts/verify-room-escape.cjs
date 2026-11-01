// Synthetic isolated saves. Requires an existing playwright-core and Chromium.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { migrateSave } = require("../src/lib/world-model.ts");
const { ROOM_RUN_REWARD } = require("../src/game/room-escape.ts");
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4175/phj-game/";
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-room-evidence";
const keys = { up: "ArrowUp", left: "ArrowLeft", down: "ArrowDown", right: "ArrowRight" };
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
          runnerBest: 700,
          miniBest: { peanuts: 8, fishing: 5 },
          robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
        }),
      );
      const game = page.locator(".rooms-game");
      const save = () => page.evaluate(() => JSON.parse(localStorage.getItem("hyunjun-game-v2")));
      const phase = (value) =>
        page.waitForFunction(
          (v) => document.querySelector(".rooms-game")?.dataset.phase === v,
          value,
        );
      const press = async (button) => (width < 500 ? button.tap() : button.click());
      const walk = async (...directions) => {
        if (width >= 500) await page.locator(".rooms-board").focus();
        for (const direction of directions) {
          if (width < 500) await page.locator(`[data-dir="${direction}"]`).tap();
          else await page.keyboard.press(keys[direction]);
        }
      };
      const goNext = async () => {
        await phase("room-clear");
        await press(page.getByRole("button", { name: "다음 방으로", exact: true }));
        await phase("playing");
      };
      await page.goto(url + "#/kart", { waitUntil: "networkidle" });
      // Freeze wall-clock drift; only explicit runFor advances the bridge in this test.
      await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 100));
      const before = await save();
      assert.equal(
        await page.locator('[data-game-id="lg-11"]').getAttribute("data-status"),
        "playable",
      );
      await page.locator('[data-game-id="lg-11"] a').click();
      await phase("ready");
      await press(page.getByRole("button", { name: "세 방 모험 시작", exact: true }));
      await phase("playing");
      await page.evaluate(() => window.scrollTo(0, 0));
      for (const button of await page.locator(".rooms-pad button, .rooms-actions button").all()) {
        const box = await button.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44);
        if (await button.getAttribute("data-dir"))
          assert.ok(
            box.y >= 0 && box.y + box.height <= page.viewportSize().height,
            "movement buttons must fit the initial viewport",
          );
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${out}/key-${width}.png`, fullPage: true });
      await walk("up", "right", "right", "right", "right", "down");
      assert.equal(await game.getAttribute("data-phase"), "playing");
      assert.equal(await game.getAttribute("data-key"), "false");
      assert.equal(await game.getAttribute("data-y"), "2");
      await walk("up", "down", "down");
      await phase("room-clear");
      assert.deepEqual(await save(), before);
      await goNext();
      assert.equal(await game.getAttribute("data-room"), "1");
      await walk("up", "up", "right", "right", "right", "right");
      assert.equal(await game.getAttribute("data-phase"), "playing");
      assert.equal(await game.getAttribute("data-crate-x"), "3");
      await press(page.getByRole("button", { name: "이 방 처음부터", exact: true }));
      assert.equal(await game.getAttribute("data-x"), "1");
      await walk("up", "right", "right", "right");
      assert.equal(await game.getAttribute("data-crate-x"), "5");
      await page.screenshot({ path: `${out}/crate-${width}.png`, fullPage: true });
      await walk("up", "right");
      await goNext();
      assert.equal(await game.getAttribute("data-room"), "2");
      await walk("up", "right");
      await walk("right");
      await phase("lost");
      assert.deepEqual(await save(), before);
      await press(page.getByRole("button", { name: "이 방 다시 도전", exact: true }));
      assert.equal(await game.getAttribute("data-room"), "2");
      assert.equal(await game.getAttribute("data-x"), "1");
      await walk("up", "right");
      await press(page.getByRole("button", { name: "잠깐 쉬기", exact: true }));
      const pausedTime = await game.getAttribute("data-time");
      await page.clock.runFor(5000);
      assert.equal(await game.getAttribute("data-time"), pausedTime);
      assert.ok(await page.locator('[data-dir="right"]').isDisabled());
      await press(page.getByRole("button", { name: "이어서 모험", exact: true }));
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      await phase("paused");
      await press(page.getByRole("button", { name: "이어서 모험", exact: true }));
      await page.clock.runFor(3100);
      assert.equal(await game.getAttribute("data-green"), "true");
      await walk("right");
      await page.clock.runFor(4000);
      await phase("lost");
      await press(page.getByRole("button", { name: "이 방 다시 도전", exact: true }));
      await walk("up", "right");
      await page.clock.runFor(3100);
      assert.equal(await game.getAttribute("data-green"), "true");
      await page.screenshot({ path: `${out}/bridge-${width}.png`, fullPage: true });
      await walk("right", "right", "right", "up");
      await phase("won");
      await page.waitForFunction(
        () => JSON.parse(localStorage.getItem("hyunjun-game-v2")).roomEscapeBest === 3,
      );
      const won = await save();
      assert.equal(won.money, before.money + ROOM_RUN_REWARD);
      assert.equal(won.settledActivities.length, before.settledActivities.length + 1);
      for (const key of [
        "version",
        "ownedCars",
        "robots",
        "plots",
        "houseTier",
        "runnerBest",
        "miniBest",
      ])
        assert.deepEqual(won[key], before[key]);
      await page.screenshot({ path: `${out}/won-${width}.png`, fullPage: true });
      await press(page.getByRole("button", { name: "처음부터 한 번 더", exact: true }));
      assert.equal(await game.getAttribute("data-room"), "0");
      await walk("up", "right", "right", "right", "right", "up", "down", "down");
      await goNext();
      await page.reload({ waitUntil: "networkidle" });
      await phase("ready");
      assert.equal(await game.getAttribute("data-room"), "0");
      assert.deepEqual(await save(), won);
      await press(page.getByRole("button", { name: "세 방 모험 시작", exact: true }));
      await walk("up");
      await page.getByRole("link", { name: "카트로 돌아가기", exact: true }).click();
      await page.goBack();
      await phase("ready");
      await page.goForward();
      await page.getByRole("heading", { name: "박현준 카트", exact: true }).waitFor();
      assert.deepEqual(await save(), won);
      await page.setViewportSize({ width: 844, height: 390 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      results.push({
        width,
        result: "PASS",
        threeDistinctRooms: true,
        realMovement: true,
        retryCurrentRoom: true,
        pauseAndBlur: true,
        bridgeTimingAndFailure: true,
        rewardOnce: true,
        cancelAndReload: true,
        oldAssetsPreserved: true,
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
