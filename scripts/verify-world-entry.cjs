// Title → loading → world entry, on the built Pages app under /phj-game/.
// Isolated synthetic save; uses the existing playwright-core / Chromium installation.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { migrateSave } = require("../src/lib/world-model.ts");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4175/phj-game/";
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-world-entry-evidence";
fs.mkdirSync(out, { recursive: true });

const SEED = migrateSave({
  version: 3,
  money: 1234,
  ownedCars: ["car-001", "car-021"],
  houseTier: 2,
  runnerBest: 321,
  robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
});

async function openPage(browser, viewport, errors) {
  const touch = viewport.width < 900;
  const context = await browser.newContext({ viewport, hasTouch: touch });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const villageRequests = [];
  page.on("request", (r) => {
    if (/\/assets\/Village-[^/]+\.js$/.test(r.url())) villageRequests.push(r.url());
  });
  await page.addInitScript((seed) => {
    if (!localStorage.getItem("hyunjun-game-v2"))
      localStorage.setItem("hyunjun-game-v2", JSON.stringify(seed));
    // Record every title appearance, also brief ones between two checks.
    window.__titleSeen = 0;
    new MutationObserver(() => {
      const shown = !!document.querySelector('[data-entry-phase="title"]');
      if (shown && !window.__titleShown) window.__titleSeen++;
      window.__titleShown = shown;
    }).observe(document, { subtree: true, childList: true, attributes: true });
  }, SEED);
  return { context, page, villageRequests };
}

const save = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("hyunjun-game-v2")));
const phase = (page) =>
  page.evaluate(() => document.querySelector("[data-entry-phase]")?.dataset.entryPhase ?? null);
const position = (page) =>
  page
    .locator(".adv-player")
    .first()
    .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
const noSideScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

async function walk(page, axis, target) {
  for (let i = 0; i < 260; i++) {
    const p = await position(page),
      gap = target - p[axis];
    if (Math.abs(gap) < 14) return;
    const key =
      axis === "x" ? (gap > 0 ? "ArrowRight" : "ArrowLeft") : gap > 0 ? "ArrowDown" : "ArrowUp";
    await page.keyboard.down(key);
    await page.waitForTimeout(Math.min(160, Math.max(30, Math.abs(gap) * 2)));
    await page.keyboard.up(key);
  }
  throw Error(`blocked ${axis}→${target} at ${JSON.stringify(await position(page))}`);
}

async function touchJoystick(page, context, dx, dy, ms) {
  const cdp = await context.newCDPSession(page);
  const b = await page.locator(".adv-joystick").boundingBox();
  const x = b.x + b.width / 2,
    y = b.y + b.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + dx, y: y + dy }],
  });
  await page.waitForTimeout(ms);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function startFromTitle(page, width) {
  await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(await phase(page), "title", "root opens on the title");
  const start = page.getByRole("button", { name: "게임 시작하겠습니다!", exact: true });
  const box = await start.boundingBox();
  assert.ok(box && box.width >= 44 && box.height >= 44, "start button is finger sized");
  assert.ok(await noSideScroll(page), "title has no sideways scroll");
  await page.screenshot({ path: path.join(out, `title-${width}.png`) });
  // A quick double tap: the second tap must not start a second load.
  await start.evaluate((b) => {
    b.click();
    b.click();
  });
  await page.getByRole("status").waitFor();
  assert.equal(await phase(page), "loading");
  assert.match(await page.getByRole("status").innerText(), /박현준 월드로 가는 중/);
  await page.screenshot({ path: path.join(out, `loading-${width}.png`) });
  await page.locator(".adv-interact").waitFor({ timeout: 15000 });
  assert.equal(await page.locator(".adv-interact").count(), 1, "one world, mounted once");
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    headless: true,
    args: ["--no-sandbox"],
  });
  const results = [];
  try {
    for (const viewport of [
      { width: 360, height: 780 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
      { width: 1280, height: 900 },
    ]) {
      const errors = [];
      const { context, page, villageRequests } = await openPage(browser, viewport, errors);
      const w = viewport.width;
      const r = { viewport: `${w}x${viewport.height}` };
      await startFromTitle(page, w);
      r.villageRequests = villageRequests.length;
      assert.equal(villageRequests.length, 1, "the world code is fetched once");
      const before = await save(page);
      assert.equal(before.money, SEED.money, "save kept through the entry");
      assert.equal(before.runnerBest, SEED.runnerBest);
      assert.deepEqual(before.ownedCars, SEED.ownedCars);
      assert.equal(before.version, 3);
      await page.screenshot({ path: path.join(out, `world-${w}.png`) });

      // Moving: touch joystick on touch screens, keyboard on the desktop.
      const p0 = await position(page);
      if (w < 900) await touchJoystick(page, context, 36, 0, 600);
      else {
        await page.keyboard.down("ArrowRight");
        await page.waitForTimeout(600);
        await page.keyboard.up("ArrowRight");
      }
      const p1 = await position(page);
      assert.ok(p1.x > p0.x + 40, `player moved right ${JSON.stringify([p0, p1])}`);
      r.movement = w < 900 ? "touch joystick" : "keyboard";

      if (w !== 844) {
        // A planned place: says it is being made, changes neither the URL nor the save.
        await walk(page, "y", 1440);
        await walk(page, "x", 1860);
        const action = page.locator(".adv-interact");
        assert.match(await action.innerText(), /개구리 코인별 · 준비 중/);
        const urlBefore = page.url(),
          saveBefore = await save(page);
        await action.click();
        await page.getByText("아직 준비 중이야").first().waitFor();
        await page.screenshot({ path: path.join(out, `planned-${w}.png`) });
        await page.waitForTimeout(300);
        assert.equal(page.url(), urlBefore);
        assert.deepEqual(await save(page), saveBefore);
        assert.equal(await page.locator(".we-screen").count(), 0);
        r.plannedGate = "message only, URL and save unchanged";

        // Runner round trip: back in the world without the title.
        await walk(page, "x", 1350); // around the lake
        await walk(page, "y", 560);
        await walk(page, "x", 2380);
        await walk(page, "y", 530);
        assert.match(await action.innerText(), /박현준 러너 · 시작/);
        await action.click();
        await page.waitForURL(/#\/race$/);
        await page.getByRole("link", { name: "🏡 마을로 돌아가기" }).click();
        await page.locator(".adv-interact").waitFor();
        assert.equal(await page.evaluate(() => window.__titleSeen), 1, "title only at the start");
        assert.equal(villageRequests.length, 1, "returning reuses the loaded world");
        r.runnerRoundTrip = "world → #/race → world, no title";

        // Browser back from the world goes to the runner, forward comes back to the world.
        await page.goBack();
        await page.waitForURL(/#\/race$/);
        await page.goForward();
        await page.locator(".adv-interact").waitFor();
        assert.equal(await page.evaluate(() => window.__titleSeen), 1);
        r.history = "back/forward keep routes, no title";
      }
      assert.ok(await noSideScroll(page));

      // Reload at the root starts a new run: the title comes back (not saved anywhere).
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await phase(page), "title");
      r.reload = "title again";
      assert.deepEqual(errors, []);
      r.errors = errors.length;
      results.push(r);
      await context.close();
    }

    // Direct entry to #/race: the runner opens at once; walking back skips the title.
    {
      const errors = [];
      const { context, page, villageRequests } = await openPage(
        browser,
        { width: 390, height: 844 },
        errors,
      );
      await page.goto(url + "#/race", { waitUntil: "networkidle" });
      assert.equal(await page.locator("[data-entry-phase]").count(), 0);
      assert.equal(villageRequests.length, 0, "the runner does not wait for the world");
      await page.getByRole("link", { name: "🏡 마을로 돌아가기" }).click();
      await page.locator(".adv-interact").waitFor({ timeout: 15000 });
      assert.equal(await page.evaluate(() => window.__titleSeen), 0);
      assert.deepEqual(errors, []);
      results.push({ directRace: "runner first, world after without title" });
      await context.close();
    }

    // The world code cannot be fetched: a retry button, then a real second try.
    {
      const errors = [];
      const { context, page } = await openPage(browser, { width: 390, height: 844 }, errors);
      let block = true;
      await page.route(/\/assets\/Village-[^/]+\.js$/, (route) =>
        block ? route.abort() : route.continue(),
      );
      await page.goto(url, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "게임 시작하겠습니다!", exact: true }).click();
      await page.getByRole("alert").waitFor({ timeout: 15000 });
      assert.equal(await phase(page), "failed");
      await page.screenshot({ path: path.join(out, "failed-390.png") });
      block = false;
      // The retry reloads the page and resumes at loading, without a second start tap.
      await Promise.all([
        page.waitForEvent("load"),
        page.getByRole("button", { name: "다시 가기", exact: true }).click(),
      ]);
      await page.locator(".adv-interact").waitFor({ timeout: 15000 });
      assert.equal(await page.evaluate(() => sessionStorage.length), 0, "retry flag is one-shot");
      assert.deepEqual(await save(page), JSON.parse(JSON.stringify(SEED)));
      // A later reload is a new run again and shows the title.
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await phase(page), "title");
      // The blocked fetch is a page error by design; nothing else may fail.
      assert.ok(
        errors.every((m) => /Village|dynamically imported module|import/i.test(m)),
        errors.join(),
      );
      results.push({
        failure: "failed → 다시 가기 (reload) → loading → world",
        pageErrors: errors,
      });
      await context.close();
    }
    fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    console.log("PASS verify-world-entry");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
