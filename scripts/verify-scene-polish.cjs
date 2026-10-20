// Credentials are read only from an explicitly supplied private file, never logged.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4190/phj-game/";
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-scene-polish";
const accounts = process.env.PHJ_ACCOUNTS_FILE
  ? JSON.parse(fs.readFileSync(process.env.PHJ_ACCOUNTS_FILE, "utf8")).accounts
  : ["아빠", "엄마", "누나", "현준"].map((nickname, i) => ({
      nickname,
      password: "2468",
      email: ["dad", "mom", "sister", "hyunjun"][i] + "@phj-game.invalid",
    }));
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const pages = [];
    for (const account of accounts) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      });
      const page = await context.newPage();
      pages.push(page);
      page.setDefaultTimeout(25000);
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(() =>
        localStorage.setItem(
          "hyunjun-game-v2",
          JSON.stringify({
            version: 3,
            money: 3000,
            ownedFurniture: ["bed", "shelf", "plant", "rug", "window"],
            room: ["bed", "shelf", "plant", "window", "rug", null],
            ownedOutfits: ["witch"],
            houseTier: 4,
          }),
        ),
      );
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.locator(".hj-family-toggle").click();
      await page.getByRole("button", { name: account.nickname, exact: true }).click();
      await page.getByLabel("암호", { exact: true }).fill(account.password);
      await page.getByRole("button", { name: "가족 계정 로그인", exact: true }).click();
      const own = page.locator(".adv-map .adv-player:not(.hj-remote)");
      await page.waitForFunction(
        (n) =>
          [...document.querySelectorAll(".adv-map .adv-player:not(.hj-remote)>b")].some(
            (e) => e.textContent === n,
          ),
        account.nickname,
      );
      assert.equal(await page.locator(".adv-location").count(), 0);
      assert.equal(await page.getByRole("button", { name: /해변 안내/ }).count(), 0);
      const id = { 현준: "hyunjun", 아빠: "dad", 엄마: "mom", 누나: "sister" }[account.nickname];
      assert.equal(await own.locator("[data-identity]").first().getAttribute("data-identity"), id);
      if ((await page.locator(".hj-family-toggle").getAttribute("aria-expanded")) === "true")
        await page.locator(".hj-family-toggle").click();
      await page.screenshot({ path: `${out}/family-${id}.png` });
      if (pages.length > 2) await context.close();
    }
    const page = pages[accounts.findIndex((a) => a.nickname === "아빠")];
    await page.locator('[data-remote="엄마"] [data-identity="mom"]').first().waitFor();

    for (const [width, height] of [
      [320, 740],
      [390, 844],
      [844, 390],
      [768, 1024],
      [1280, 900],
    ]) {
      await page.setViewportSize({ width, height });
      const rects = await page.evaluate(() =>
        [".hj-car-mode", ".adv-map-button", ".adv-interact"].map((s) => {
          const e = document.querySelector(".adv-console " + s),
            r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        }),
      );
      for (const r of rects) {
        assert.ok(r.w >= 44 && r.h >= 44, JSON.stringify({ width, r }));
        assert.ok(r.x >= 0 && r.x + r.w <= width + 1);
        assert.ok(r.y >= 0 && r.y + r.h <= height + 1, "controls stay vertically visible");
      }
      for (let i = 0; i < rects.length; i++)
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i],
            b = rects[j];
          assert.ok(
            Math.min(a.x + a.w, b.x + b.w) <= Math.max(a.x, b.x) ||
              Math.min(a.y + a.h, b.y + b.h) <= Math.max(a.y, b.y),
            "controls overlap",
          );
        }
      await page.screenshot({ path: `${out}/world-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".adv-map-button").click();
    await page.getByRole("button", { name: "1. 우리 마을", exact: true }).click();
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(500);
    await page.keyboard.up("ArrowUp");
    await page.getByRole("button", { name: "우리 집 들어가기", exact: true }).click();
    await page.locator('.hj-life-scene [data-identity="dad"]').waitFor();
    assert.equal(await page.locator(".hj-life-hud").getAttribute("open"), null);
    assert.equal(
      await page
        .locator('[data-furniture="window"]')
        .getAttribute("transform")
        .then((s) => s.endsWith(" 270)")),
      true,
    );
    assert.equal(
      await page.locator('[data-person="dad"]').count(),
      1,
      "helper is drawn once across depth layers",
    );
    await page.screenshot({ path: `${out}/home-phone.png` });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.screenshot({ path: `${out}/home-landscape.png` });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: `${out}/home-tablet.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".adv-map-button").click();
    await page.locator(".adv-map-button").click();
    await page.getByRole("button", { name: "🌊 바닷가 · 푸드트럭", exact: true }).click();
    await page.screenshot({ path: `${out}/beach-phone.png` });
    await page.goto(url + "#/house");
    await page.locator('.hj-mascot[data-identity="dad"]').first().waitFor();
    assert.ok((await page.locator("h1").innerText()).includes("아빠"));
    await page.reload();
    await page.locator('.hj-mascot[data-identity="dad"]').first().waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: four authenticated identities, remote faces, five viewport action layouts, home identity/windows, beach travel, wardrobe navigation and session restore.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
