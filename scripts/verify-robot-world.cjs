// Isolated preview saves; requires existing playwright-core and headless Chromium.
// Robot world PR-A/PR-B: meet a robot, ride and fuse, beat the villain (7th card use opens a
// new card), upgrade at the workshop, keep everything after reload, and break down safely.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const {
  ROBOTS,
  VILLAIN_SPOT,
  WORKSHOP,
  VILLAIN_RESPAWN_MS,
} = require("../src/game/robot-catalog.ts");
const { villainMaxHp } = require("../src/game/robot-engine.ts");
const police = ROBOTS.find((r) => r.id === "rb-police");
const fire = ROBOTS.find((r) => r.id === "rb-fire");
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
      // Seed once so a reload keeps whatever the game saved. The police card starts at 4/7 so
      // the 7th use lands during the second villain fight.
      await page.addInitScript(() => {
        if (!localStorage.getItem("hyunjun-game-v2"))
          localStorage.setItem(
            "hyunjun-game-v2",
            JSON.stringify({
              version: 3,
              money: 3000,
              robots: { cards: { "rb-police": { uses: 4 } } },
            }),
          );
      });
      const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
      await page.goto(url, { waitUntil: "networkidle" });
      const btn = (label) => page.getByRole("button", { name: label, exact: true });
      const action = page.locator(".adv-interact");
      const hint = page.locator(".adv-touch-hint");
      const card = page.locator("[data-robot-card]");
      const rider = page.getByRole("img", { name: /가 탄 / });
      async function position() {
        return page
          .locator(".adv-map .adv-player:not(.hj-remote)")
          .first()
          .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
      }
      async function move(axis, target) {
        for (let i = 0; i < 80; i++) {
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
      const labelStarts = (text) =>
        page.waitForFunction(
          (t) => document.querySelector(".adv-interact")?.textContent?.startsWith(t),
          text,
        );
      async function goToRobot(robot, label) {
        await move("y", robot.home.y + 60);
        await move("x", robot.home.x);
        await labelStarts(label);
      }
      async function ridePolice() {
        await goToRobot(police, "경찰 로봇");
        assert.match(await action.innerText(), /경찰 로봇 타기$/);
        await action.click();
        await rider.waitFor();
      }
      async function goToVillain() {
        await move("x", VILLAIN_SPOT.x);
        await move("y", VILLAIN_SPOT.y - 70);
      }
      async function fightUntilRetreat() {
        await labelStarts("카드 쓰기");
        for (let i = 0; i < 12; i++) {
          if ((await page.locator('[data-villain="retreating"]').count()) > 0) return;
          await action.click();
          await page.waitForTimeout(1600);
        }
        throw Error("villain never retreated");
      }

      // Meet a new robot; the police card is already in the save.
      await goToRobot(fire, "소방 로봇");
      assert.equal(await action.innerText(), "소방 로봇 만나기");
      await action.click();
      assert.ok((await hint.innerText()).includes("카드를 받았어"));
      await ridePolice();
      assert.ok((await card.innerText()).includes("경찰 로봇 카드 4/7"));
      assert.equal(await btn("차 타기").count(), 0);
      assert.equal(await page.locator(".adv-map-button").isVisible(), false);
      console.log(`PASS ${name} meet the fire robot and ride the police robot`);

      if (mobile) {
        // Drag the on-screen joystick while riding: the robot must move with it.
        const before = await position();
        const box = await page.getByLabel("이동 조이스틱").boundingBox();
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

      await btn("2단 합체").click();
      await page.locator('[data-fusion="2"]').waitFor();
      assert.ok((await hint.innerText()).includes("2단 합체! 경찰 로봇 + 소방 로봇"));
      assert.equal(await page.locator('[data-robot="rb-fire"]').count(), 0);
      assert.equal(await btn("합체 풀기").count(), 1);
      await page.screenshot({ path: `${out}/robot-fusion-${name}.png` });
      console.log(`PASS ${name} 2-robot fusion`);

      await goToVillain();
      await fightUntilRetreat();
      assert.ok((await hint.innerText()).includes("물리쳤어!"));
      assert.ok((await card.innerText()).includes("🔩 2"));
      await page.screenshot({ path: `${out}/robot-villain-${name}.png` });
      await page.locator('[data-villain="active"]').waitFor({ timeout: VILLAIN_RESPAWN_MS + 5000 });
      assert.ok((await page.locator(".hj-villain b").innerText()).includes("Lv.2"));
      await fightUntilRetreat();
      assert.ok((await card.innerText()).includes("카드 7/7"));
      assert.ok((await card.innerText()).includes("🔩 4"));
      console.log(`PASS ${name} beat the villain twice, tougher the 2nd time; 7th use counted`);

      await move("x", WORKSHOP.x);
      await move("y", WORKSHOP.y - 60);
      assert.equal(await action.innerText(), "강화하기 (부품 3/3)");
      await action.click();
      assert.ok((await hint.innerText()).includes("강화 경찰 로봇이 됐어"));
      assert.ok((await card.innerText()).includes("🔩 1"));
      assert.equal(await action.innerText(), "정비소 · 최고로 강화됨");
      await page.screenshot({ path: `${out}/robot-upgrade-${name}.png` });
      console.log(`PASS ${name} workshop upgrade`);

      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await card.count(), 0);
      await ridePolice();
      assert.match(await rider.getAttribute("aria-label"), /가 탄 강화 경찰 로봇$/);
      assert.ok((await card.innerText()).includes("7/7"));
      assert.ok((await card.innerText()).includes("🔩 1"));
      assert.equal(await page.locator('[data-robot="rb-thunder-police"]').count(), 1);
      console.log(`PASS ${name} reload keeps the full card, upgrade, parts and the new robot`);

      if (!mobile) {
        // Standing in front of the villain without fighting back breaks the robot down safely.
        await goToVillain();
        // After reload the villain matches the saved two wins, not a fresh game.
        assert.ok((await page.locator(".hj-villain b").innerText()).includes("Lv.3"));
        assert.equal(
          await page.getByRole("meter", { name: "악당 로봇 힘" }).getAttribute("aria-valuemax"),
          String(villainMaxHp(2)),
        );
        await page.waitForFunction(
          () => document.querySelector(".adv-touch-hint")?.textContent?.includes("고장 났어"),
          null,
          { timeout: 30000 },
        );
        assert.equal(await rider.count(), 0);
        assert.equal(await card.count(), 0);
        await page.goto(url, { waitUntil: "networkidle" });
        await ridePolice();
        assert.ok((await card.innerText()).includes("7/7"));
        console.log("PASS tablet breakdown gets off the robot and loses nothing");
      }

      await btn("내리기").click();
      assert.equal(await card.count(), 0);
      assert.equal(await btn("차 타기").count(), 1);
      assert.equal(await page.locator(".adv-map-button").isVisible(), true);
      console.log(`PASS ${name} get off brings back the car and map buttons`);
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
