// Isolated preview saves; requires existing playwright-core and headless Chromium.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { TOWN_BUILDINGS } = require("../src/game/building-interiors.ts");
const { RESTAURANTS, NEW_VILLAGES } = require("../src/game/world-content.ts");
const fixture = { buildings: TOWN_BUILDINGS, restaurants: RESTAURANTS, villages: NEW_VILLAGES };
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-building-evidence";
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
      const page = await browser.newPage({ viewport });
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(() =>
        localStorage.setItem("hyunjun-game-v2", JSON.stringify({ version: 3, money: 3000 })),
      );
      await page.goto(process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/", {
        waitUntil: "networkidle",
      });
      const btn = (name) => page.getByRole("button", { name, exact: true });
      const action = page.locator(".adv-interact");
      async function position() {
        const inside = page.locator("[data-building-player]");
        if (await inside.count())
          return inside.getAttribute("transform").then((t) => {
            const [x, y] = t.match(/-?\d+(?:\.\d+)?/g).map(Number);
            return { x, y };
          });
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
          await page.waitForTimeout(Math.min(400, Math.max(35, (Math.abs(gap) / 245) * 1000)));
          await page.keyboard.up(key);
        }
        throw Error(`Blocked ${axis}=${target} at ${JSON.stringify(await position())}`);
      }
      const mobile = viewport.width < 500;
      const smoke = process.env.PHJ_BUILDING_SMOKE === "1";
      const buildings =
        mobile || smoke
          ? fixture.buildings.filter((b) => ["mart", "dad-office", "new-1-west"].includes(b.id))
          : fixture.buildings;
      for (const b of buildings) {
        await btn("지도").click();
        if (!b.id.startsWith("new-")) await btn(`${b.emoji} ${b.name}`).click();
        else {
          const v = fixture.villages.find((v) => b.id.startsWith(v.id + "-"));
          const index = fixture.villages.indexOf(v) + 11;
          await btn(`${index}. ${v.name}`).click();
          await move("x", b.door.x);
          await move("y", b.door.y);
        }
        await action.waitFor();
        assert.equal(await action.innerText(), b.name + " 들어가기");
        await action.click();
        await page.getByLabel(b.name + " 실내", { exact: true }).waitFor();
        await move("y", 570);
        assert.equal(await action.innerText(), b.action);
        await action.click();
        assert.ok((await page.locator(".adv-touch-hint").innerText()).includes(b.response));
        if (b.id === "dad-office") assert.equal(await page.locator("[data-office-dad]").count(), 1);
        if (["mart", "dad-office", "new-1-west"].includes(b.id))
          await page.screenshot({ path: `${out}/${b.id}-${mobile ? "phone" : "tablet"}.png` });
        await move("y", 930);
        assert.equal(await action.innerText(), "건물 밖으로");
        await action.click();
        await page.getByLabel(b.name + " 실내", { exact: true }).waitFor({ state: "detached" });
        const p = await position();
        assert.ok(Math.hypot(p.x - b.door.x, p.y - b.door.y) < 2);
        // Check the persistent exit control as well as the physical door.
        await action.click();
        await btn("건물 밖으로").first().click();
        await page.getByLabel(b.name + " 실내", { exact: true }).waitFor({ state: "detached" });
        console.log(
          `PASS ${mobile ? "phone" : "tablet"} ${b.id}: enter, walk, activity, both exits, return`,
        );
      }
      // Map travel from indoors must clear the old room and land outdoors.
      for (const destination of [
        "💼 아빠 회사",
        `${11}. ${fixture.villages[0].name}`,
        "🌊 바닷가 · 푸드트럭",
      ]) {
        await btn("지도").click();
        await btn("🛒 별빛 마트").click();
        await action.click();
        await page.getByLabel("별빛 마트 실내", { exact: true }).waitFor();
        await btn("지도 보기").click();
        await btn(destination).click();
        await page.getByLabel("별빛 마트 실내", { exact: true }).waitFor({ state: "detached" });
        await page.locator(".adv-map .adv-player:not(.hj-remote)").first().waitFor();
        assert.equal(await page.locator(".adv-interior").count(), 0);
      }
      console.log(`PASS ${mobile ? "phone" : "tablet"} map travel exits interiors`);
      if (!mobile && !smoke) {
        for (const r of fixture.restaurants) {
          await btn("지도").click();
          const choices = [
            ...fixture.villages.map((v, i) => ({
              label: `${i + 11}. ${v.name}`,
              x: v.x,
              y: v.y + 65,
            })),
            ...fixture.buildings
              .filter((b) => !b.id.startsWith("new-"))
              .map((b) => ({ label: `${b.emoji} ${b.name}`, ...b.door })),
          ];
          if (r.id === "korean") choices.push({ label: "7. 에메랄드 마을", x: 4370, y: 545 });
          choices.sort(
            (a, b) => Math.hypot(a.x - r.x, a.y - r.y) - Math.hypot(b.x - r.x, b.y - r.y),
          );
          await btn(choices[0].label).click();
          await move("y", r.y + 200);
          await move("x", r.x);
          await move("y", r.y + 130);
          assert.equal(await action.innerText(), r.name + " 들어가기");
          await action.click();
          await page.getByLabel(r.name + " 실내", { exact: true }).waitFor();
          await btn("식당 밖으로").first().click();
          await page.getByLabel(r.name + " 실내", { exact: true }).waitFor({ state: "detached" });
          console.log(`PASS restaurant ${r.id}: enter, exit`);
        }
        await btn("지도").click();
        await btn("1. 우리 마을").click();
        await move("y", 620);
        await action.click();
        await page.locator('.hj-life-scene[data-region="mansion"]').waitFor();
        await btn("집 밖으로").first().click();
        console.log("PASS original home: enter, exit");
      }
      await page.close();
    }
    // A dad who follows the player is drawn by People, so the office must not add a second one.
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() =>
      localStorage.setItem(
        "hyunjun-game-v2",
        JSON.stringify({ version: 3, money: 3000, companions: ["dad"] }),
      ),
    );
    await page.goto(process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/", {
      waitUntil: "networkidle",
    });
    await page.getByRole("button", { name: "지도", exact: true }).click();
    await page.getByRole("button", { name: "💼 아빠 회사", exact: true }).click();
    await page.locator(".adv-interact").click();
    await page.getByLabel("아빠 회사 실내", { exact: true }).waitFor();
    // The following dad is drawn (and labelled) by People; the fixed office dad must be absent.
    assert.equal(await page.getByLabel("아빠 회사 실내").getByText("도우미 아빠").count(), 1);
    assert.equal(await page.locator("[data-office-dad]").count(), 0);
    await page.close();
    console.log("PASS following dad is not duplicated in the office");
    assert.deepEqual(errors, []);
    console.log("PASS no browser runtime errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
