// Uses isolated fixture saves. Requires an existing playwright-core and Chromium installation.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-child";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    page.setDefaultTimeout(25000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      if (!localStorage.getItem("hyunjun-game-v2"))
        localStorage.setItem(
          "hyunjun-game-v2",
          JSON.stringify({
            version: 3,
            money: 3000,
            ownedCars: ["car-001", "car-021", "car-011", "car-031", "car-101"],
            ownedOutfits: ["witch"],
            outfit: "witch",
            room: ["bed", "shelf", "plant", null, "rug", null],
            ownedFurniture: ["bed", "shelf", "plant", "rug"],
            carUpgrades: {
              "car-011": { special: true },
              "car-031": { special: true },
              "car-101": { special: true },
            },
          }),
        );
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    const btn = (n) => page.getByRole("button", { name: n, exact: true });
    async function pos() {
      return page
        .locator(".adv-player")
        .first()
        .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
    }
    async function move(axis, target) {
      for (let i = 0; i < 220; i++) {
        const p = await pos(),
          gap = target - p[axis];
        if (Math.abs(gap) < 12) return;
        const key =
          axis === "x" ? (gap > 0 ? "ArrowRight" : "ArrowLeft") : gap > 0 ? "ArrowDown" : "ArrowUp";
        await page.keyboard.down(key);
        await page.waitForTimeout(Math.min(150, Math.max(30, Math.abs(gap) * 2)));
        await page.keyboard.up(key);
      }
      throw Error("blocked " + axis + " " + target + " " + JSON.stringify(await pos()));
    }
    async function town(n, name) {
      await btn("지도").click();
      await btn(n + ". " + name).click();
    }
    const action = () => page.locator(".adv-interact").click();
    const money = () =>
      page
        .locator(".hj-wallet strong")
        .innerText()
        .then((s) => Number(s.replaceAll(",", "")));
    assert.equal(await page.locator(".hj-live-board").count(), 0);
    await btn("🚗 자동차 5대").click();
    assert.equal(await page.locator(".kid-car-list article").count(), 5);
    await page
      .locator(".kid-car-list article")
      .first()
      .getByRole("button", { name: "엔진 +15% · 60" })
      .click();
    await btn("이 차 타고 출발!").click();
    assert.equal(await money(), 2940);
    // The base-car delivery begins only at the actual garage and needs three destinations.
    await move("y", 850);
    await move("x", 850);
    await action();
    await btn("🚗 출발!").click();
    await move("y", 1100);
    for (const x of [1350, 2100, 2680]) {
      await move("x", x);
      await action();
    }
    assert.equal(await money(), 2990);
    assert.equal(await page.locator(".kid-mission-hud").count(), 0);
    // Special vehicles are owned, and the physical station starts each job.
    await move("x", 2860);
    await move("y", 850);
    await action();
    await btn("🚗 출발!").click();
    for (const x of [3200, 3600, 4000]) {
      await move("x", x);
      await action();
    }
    assert.equal(await money(), 3040);
    await move("x", 3740);
    await action();
    await btn("🚗 출발!").click();
    for (const x of [4000, 4600, 5200]) {
      await move("x", x);
      await action();
    }
    assert.equal(await money(), 3090);
    await move("x", 4660);
    await action();
    await btn("🚗 출발!").click();
    for (const x of [4260, 5000, 4660]) {
      await move("x", x);
      await action();
    }
    assert.equal(await money(), 3140);
    console.log("PASS physical delivery, police, fire and ambulance objectives/rewards");
    await page.screenshot({ path: out + "/station-tablet.png" });
    // Same saved outfit in world and house; bought furniture is drawn in the walkable scene.
    await page.setViewportSize({ width: 390, height: 844 });
    await town(1, "우리 마을");
    await move("y", 620);
    await action();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.hj-life-scene [data-avatar="witch"]').count(), 1);
    assert.ok(await page.locator('.hj-life-scene [data-furniture="shelf"]').count());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: out + "/home-phone.png" });
    const avatarSize = await page.locator(".hj-life-scene [data-avatar]").boundingBox();
    assert.ok(avatarSize.height >= 56);
    const viewportScroll = await page
      .locator(".adv-viewport")
      .evaluate((e) => ({ x: e.scrollLeft, y: e.scrollTop }));
    assert.deepEqual(
      viewportScroll,
      { x: 0, y: 0 },
      "scene entry must not let browser scroll the camera",
    );
    assert.ok(
      avatarSize.x + avatarSize.width / 2 > 140 && avatarSize.x + avatarSize.width / 2 < 250,
      "phone avatar stays centered",
    );
    await btn("집 밖으로").last().click();
    await page.setViewportSize({ width: 1024, height: 900 });
    // Physical beach customers walk before any shop dialog is opened.
    await btn("지도").click();
    await btn("🌊 바닷가 · 푸드트럭").click();
    await move("y", 1010);
    await move("x", 7140);
    await action();
    await page.getByRole("region", { name: "세로 잠수함 탐험", exact: true }).waitFor();
    const worldBefore = await pos();
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(1000);
    await page.keyboard.up("ArrowDown");
    assert.deepEqual(await pos(), worldBefore);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: out + "/submarine-phone.png" });
    async function divePos() {
      const t = await page.locator('[data-testid="submarine"]').getAttribute("transform");
      const a = t.match(/[-\d.]+/g).map(Number);
      return { x: a[0], y: a[1] };
    }
    async function diveMove(axis, target) {
      for (let i = 0; i < 180; i++) {
        const p = await divePos(),
          gap = target - p[axis];
        if (Math.abs(gap) < 12) return;
        const k =
          axis === "x" ? (gap > 0 ? "ArrowRight" : "ArrowLeft") : gap > 0 ? "ArrowDown" : "ArrowUp";
        await page.keyboard.down(k);
        await page.waitForTimeout(Math.min(150, Math.max(30, Math.abs(gap) * 2)));
        await page.keyboard.up(k);
      }
      throw Error("dive blocked");
    }
    for (const t of [
      { x: 200, y: 730 },
      { x: 490, y: 1690 },
      { x: 240, y: 2860 },
    ]) {
      await diveMove("x", t.x);
      await diveMove("y", t.y);
      if (await btn("💦 먹물 씻기").count()) await btn("💦 먹물 씻기").click();
      await btn("집게 · 보물 회수").click();
    }
    assert.equal(await money(), 3190);
    await page.screenshot({ path: out + "/submarine-treasure-phone.png" });
    await btn("↑ 수면 · 항구로").click();
    assert.deepEqual(await pos(), worldBefore);
    // Cooking requires two correct ingredients, movement to customers and individual handoff.
    await page.setViewportSize({ width: 1024, height: 900 });
    await move("x", 6400);
    await action();
    await page.getByRole("region", { name: "움직이는 푸드트럭 장사", exact: true }).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(4000);
    assert.equal(await page.locator(".kid-truck [data-avatar=witch]").count(), 1);
    await page.screenshot({ path: out + "/truck-phone.png" });
    for (const ingredients of [
      ["빵", "패티"],
      ["도우", "치즈"],
      ["콘", "우유"],
    ]) {
      for (const name of ingredients) await btn(name).click();
      await btn("🍳 요리하기").click();
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(780);
      await page.keyboard.up("ArrowRight");
      await page.keyboard.down("ArrowDown");
      await page.waitForTimeout(420);
      await page.keyboard.up("ArrowDown");
      await btn("음식 전달").click();
      if (ingredients[0] !== "콘") {
        await page.keyboard.down("ArrowLeft");
        await page.waitForTimeout(780);
        await page.keyboard.up("ArrowLeft");
        await page.keyboard.down("ArrowUp");
        await page.waitForTimeout(420);
        await page.keyboard.up("ArrowUp");
      }
    }
    assert.equal(await money(), 3240);
    await btn("장사 마치기").click();
    await page.reload();
    assert.equal(await money(), 3240);
    assert.equal(await page.locator(".hj-live-board").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: garage upgrades, delivery, three services, consistent furnished home, vertical dive with return, three-customer cooking, reward persistence, phone/tablet screenshots.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
