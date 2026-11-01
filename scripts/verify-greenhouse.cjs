// Synthetic isolated saves; real touch/keyboard movement with deterministic frame time.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { REWARDS } = require("../src/game/world/world-content.ts");
const { migrateSave, CROPS } = require("../src/lib/world-model.ts");
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4175/phj-game/";
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-greenhouse-evidence";
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
          money: 0,
          harvests: 4,
          ownedCars: ["car-001", "car-021"],
          houseTier: 3,
          roomEscapeBest: 3,
          miniBest: { peanuts: 8, fishing: 5 },
          runnerBest: 700,
          plots: [
            { crop: "carrot", water: 3, gold: true },
            { crop: "radish", water: 1, gold: false },
          ],
          robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
        }),
      );
      const game = page.locator(".greenhouse-game"),
        care = page.locator(".greenhouse-care");
      const save = () => page.evaluate(() => JSON.parse(localStorage.getItem("hyunjun-game-v2")));
      const position = async () => ({
        x: Number(await game.getAttribute("data-x")),
        y: Number(await game.getAttribute("data-y")),
      });
      const idle = async () => {
        await page.clock.runFor(550);
        await page.waitForFunction(
          () => document.querySelector(".greenhouse-game")?.dataset.working === "false",
        );
      };
      const press = async (b) => (width < 500 ? b.tap() : b.click());
      const select = async (i) => {
        await press(page.locator(".greenhouse-bed").nth(i));
        await page.waitForFunction(
          (index) => document.querySelector(".greenhouse-game").dataset.target === String(index),
          i,
        );
      };
      const seed = async (id) => {
        await page.locator("summary").click();
        const name = CROPS.find((c) => c.id === id).name;
        await press(page.getByRole("button", { name: new RegExp(`^${name} 씨앗`) }));
      };
      const cdp = await context.newCDPSession(page);
      async function hold(axis, sign, ms, cancel = false) {
        if (width >= 500) {
          const key =
            axis === "x"
              ? sign > 0
                ? "ArrowRight"
                : "ArrowLeft"
              : sign > 0
                ? "ArrowDown"
                : "ArrowUp";
          await page.keyboard.down(key);
          await page.clock.runFor(ms);
          await page.keyboard.up(key);
          return;
        }
        const stick = page.locator(".adv-joystick");
        await stick.scrollIntoViewIfNeeded();
        const b = await stick.boundingBox();
        const x = b.x + b.width / 2,
          y = b.y + b.height / 2;
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            { x: x + (axis === "x" ? sign * 36 : 0), y: y + (axis === "y" ? sign * 36 : 0) },
          ],
        });
        await page.clock.runFor(ms);
        await cdp.send("Input.dispatchTouchEvent", {
          type: cancel ? "touchCancel" : "touchEnd",
          touchPoints: [],
        });
      }
      async function move(axis, target) {
        for (let i = 0; i < 80; i++) {
          const p = await position(),
            gap = target - p[axis];
          if (Math.abs(gap) < 7) return;
          await hold(
            axis,
            Math.sign(gap),
            Math.min(180, Math.max(35, (Math.abs(gap) / 180) * 1000)),
          );
        }
        throw Error("blocked " + axis + " " + target + " " + JSON.stringify(await position()));
      }
      await page.goto(url + "#/kart", { waitUntil: "networkidle" });
      await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 100));
      const before = await save();
      assert.equal(
        await page.locator('[data-game-id="lg-08"]').getAttribute("data-status"),
        "playable",
      );
      await page.locator('[data-game-id="lg-08"] a').click();
      await game.waitFor();
      await page.screenshot({ path: `${out}/arrival-${width}.png`, fullPage: true });
      for (const el of await page
        .locator(".greenhouse-bed,.greenhouse-care,.greenhouse-actions button,summary")
        .all()) {
        const b = await el.boundingBox();
        assert.ok(b.width >= 44 && b.height >= 44);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await select(0);
      await press(care);
      assert.deepEqual(await save(), before);
      await select(4);
      await press(care);
      assert.deepEqual(await save(), before);
      await move("y", 385);
      assert.equal(
        await game.getAttribute("data-near"),
        "true",
        JSON.stringify(await game.evaluate((e) => ({ ...e.dataset }))),
      );
      await seed("sunflower");
      await press(care);
      assert.deepEqual(await save(), before);
      assert.match(await page.locator(".greenhouse-message").innerText(), /별코인이 부족/);
      await seed("radish");
      await press(care);
      assert.deepEqual((await save()).plots[4], { crop: "radish", water: 0, gold: false });
      await page.keyboard.press("e");
      assert.equal((await save()).plots[4].water, 0);
      await idle();
      await move("y", 440);
      const planted = await save();
      await press(care);
      assert.deepEqual(await save(), planted);
      await move("y", 385);
      await hold("y", -1, 1000);
      assert.ok((await position()).y >= 367);
      await press(care);
      await page.locator(".greenhouse-effect").waitFor();
      await page.screenshot({ path: `${out}/watering-${width}.png`, fullPage: true });
      assert.equal((await save()).plots[4].water, 1);
      await idle();
      await press(care);
      await idle();
      assert.equal((await save()).plots[4].water, 2);
      const preHarvest = await save();
      await press(care);
      await page.keyboard.press("e");
      const harvested = await save();
      assert.equal(harvested.harvests, before.harvests + 1);
      assert.equal(
        harvested.money,
        preHarvest.money +
          Math.ceil(CROPS.find((c) => c.id === "radish").goldSellPrice * REWARDS.harvestMultiplier),
      );
      await idle();
      await move("y", 400);
      await move("x", 200);
      await move("y", 220);
      await move("x", 120);
      await select(0);
      assert.equal(
        await game.getAttribute("data-near"),
        "true",
        JSON.stringify(await game.evaluate((e) => ({ ...e.dataset }))),
      );
      await press(care);
      await idle();
      const golden = await save();
      assert.equal(
        golden.money,
        harvested.money +
          Math.ceil(CROPS.find((c) => c.id === "carrot").goldSellPrice * REWARDS.harvestMultiplier),
      );
      assert.equal(golden.harvests, before.harvests + 2);
      assert.deepEqual(golden.plots[1], before.plots[1]);
      await seed("beet");
      await press(care);
      await idle();
      const paid = await save();
      assert.equal(paid.money, golden.money - 4);
      assert.deepEqual(paid.plots[0], { crop: "beet", water: 0, gold: false });
      for (const key of [
        "version",
        "ownedCars",
        "houseTier",
        "roomEscapeBest",
        "miniBest",
        "robots",
        "runnerBest",
      ])
        assert.deepEqual(paid[key], before[key]);
      // Release/cancel and blur must stop motion without writes.
      await hold("x", 1, 100, true);
      const stopped = await position();
      await page.clock.runFor(1000);
      assert.deepEqual(await position(), stopped);
      await page.keyboard.down("ArrowRight");
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      await page.clock.runFor(1000);
      await page.keyboard.up("ArrowRight");
      assert.deepEqual(await position(), stopped);
      assert.deepEqual(await save(), paid);
      await page.reload({ waitUntil: "networkidle" });
      await game.waitFor();
      assert.deepEqual(await save(), paid);
      assert.ok((await position()).y > 420);
      await press(page.getByRole("button", { name: "온실 밖으로", exact: true }));
      await page.locator(".adv-player").first().waitFor();
      await page.goBack();
      await game.waitFor();
      assert.deepEqual(await save(), paid);
      await page.getByRole("link", { name: "카트로 돌아가기", exact: true }).click();
      await page.goBack();
      await game.waitFor();
      assert.deepEqual(await save(), paid);
      await page.goForward();
      await page.getByRole("heading", { name: "박현준 카트", exact: true }).waitFor();
      await page.setViewportSize({ width: 844, height: 390 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      results.push({
        width,
        result: "PASS",
        movement: width < 500 ? "touch joystick" : "keyboard",
        distanceGates: true,
        collision: true,
        freeAndPaidSeeds: true,
        waterAnimation: true,
        legacyGoldAndFifthHarvest: true,
        oneHarvest: true,
        cancelAndBlurStop: true,
        reloadAndReturn: true,
        assetsPreserved: true,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
