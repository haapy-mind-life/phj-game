// Isolated preview saves; requires existing playwright-core and headless Chromium.
// Robot watch (AT-01..AT-15 in docs/robot-fusion/2026-11-01-watch-integration): summon from the
// watch, follow/ride, one-body 2- and 3-robot fusion and split, weapon range and cooldown,
// villain, 7th use power-up, friend rescue, thief chase, reload and phone layout. Every check
// reads game state (data-* attributes and the saved game), not just pictures.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { VILLAIN_SPOT, RESCUE_SPOT, THIEF_HOME } = require("../src/game/robot-catalog.ts");
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-robot-evidence";
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
fs.mkdirSync(out, { recursive: true });
const SEED = {
  version: 3,
  money: 3000,
  ownedCars: ["car-001", "car-021"],
  carUpgrades: { "car-021": { engine: true, special: false } },
};

async function open(browser, viewport, save, errors) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 500 });
  page.on("pageerror", (e) => errors.push(e.message));
  // Seed once so a reload keeps whatever the game saved.
  await page.addInitScript((seed) => {
    if (!localStorage.getItem("hyunjun-game-v2"))
      localStorage.setItem("hyunjun-game-v2", JSON.stringify(seed));
  }, save);
  await page.goto(url, { waitUntil: "networkidle" });
  const btn = (name) => page.getByRole("button", { name, exact: true });
  const actor = page.locator("[data-robot-actor]");
  const saved = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("hyunjun-game-v2") || "{}"));
  const position = () =>
    page
      .locator(".adv-map .adv-player:not(.hj-remote)")
      .first()
      .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
  const attr = (loc, name) => loc.first().getAttribute(name);
  async function move(axis, target) {
    for (let i = 0; i < 90; i++) {
      const p = await position(),
        gap = target - p[axis];
      if (Math.abs(gap) < 14) return;
      const key =
        axis === "x" ? (gap > 0 ? "ArrowRight" : "ArrowLeft") : gap > 0 ? "ArrowDown" : "ArrowUp";
      await page.keyboard.down(key);
      await page.waitForTimeout(Math.min(400, Math.max(35, (Math.abs(gap) / 300) * 1000)));
      await page.keyboard.up(key);
    }
    throw Error(`Blocked ${axis}=${target} at ${JSON.stringify(await position())}`);
  }
  // Let a following robot catch up with the player.
  const settle = () => page.waitForTimeout(700);
  async function summon(name) {
    await btn("⌚ 시계").click();
    await page.getByRole("tab", { name: "🃏 소환" }).click();
    await page.getByRole("button", { name: `${name} 카드`, exact: true }).click();
    await page.getByRole("button", { name: `✨ ${name} 소환!` }).click();
    await page.locator('[data-robot-actor][data-phase="active"]').waitFor();
  }
  async function fuse(names) {
    await btn("⌚ 시계").click();
    await page.getByRole("tab", { name: "💥 합체" }).click();
    for (const n of names)
      await page.getByRole("button", { name: `합체: ${n}`, exact: true }).click();
    await page.getByRole("button", { name: `💥 ${names.length}단 합체 시작!` }).click();
    await page.locator('[data-robot-actor][data-fusion-phase="gathering"]').waitFor();
    await page.locator('[data-robot-actor][data-fusion-phase="assembling"]').waitFor();
    await page.locator('[data-robot-actor][data-fusion-phase="fused"]').waitFor();
  }
  async function mission(label) {
    await btn("⌚ 시계").click();
    await page.getByRole("tab", { name: "🚨 출동" }).click();
    await page.getByRole("button", { name: label }).click();
  }
  const weapon = page.locator(".hj-weapon-button");
  async function strike() {
    await page.waitForTimeout(1500); // past every weapon cooldown
    await weapon.click();
  }
  return {
    page,
    btn,
    action: page.locator(".adv-interact"),
    hint: page.locator(".adv-touch-hint"),
    actor,
    villain: page.locator("[data-villain]"),
    saved,
    position,
    attr,
    move,
    settle,
    summon,
    fuse,
    mission,
    weapon,
    strike,
  };
}

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
      const name = viewport.width < 500 ? "phone" : "tablet";
      const g = await open(browser, viewport, SEED, errors);
      const { page, btn, hint, actor, villain, saved, position, attr, move, settle } = g;

      // AT-01: the village is still there.
      for (const b of ["차 타기", "지도", "⌚ 시계"]) assert.equal(await btn(b).count(), 1, b);
      assert.ok((await page.locator("body").innerText()).includes("3,000"));

      // AT-02/03: cards are already in the watch; summoning makes a separate world actor.
      await btn("⌚ 시계").click();
      const cards = page
        .getByRole("group", { name: "시계에 저장된 로봇 카드" })
        .getByRole("button");
      assert.equal(await cards.count(), 6);
      assert.ok(
        await page.getByRole("button", { name: "번개 경찰 로봇 카드 (잠김)" }).isDisabled(),
      );
      await page.getByRole("button", { name: "소방 로봇 카드", exact: true }).click();
      assert.equal(
        await attr(page.locator("[data-watch-preview]"), "data-watch-preview"),
        "rb-fire",
      );
      await page.screenshot({ path: `${out}/at02-watch-${name}.png` });
      await page.getByRole("button", { name: "✨ 소방 로봇 소환!" }).click();
      await page.locator('[data-robot-actor][data-phase="summoning"]').waitFor();
      await page.locator('[data-robot-actor][data-phase="active"]').waitFor();
      assert.equal(await attr(actor, "data-team"), "rb-fire");
      assert.equal(await attr(actor, "data-mode"), "follow");
      const p0 = await position();
      const a0 = Number(await attr(actor, "data-x"));
      assert.ok(Math.abs(a0 - p0.x) > 40, "robot stands apart from the player");
      console.log(`PASS ${name} AT-02/03 watch cards, summon a separate world actor`);

      // AT-04: the robot follows through the world, and can be ridden.
      await move("x", p0.x + 250);
      await settle();
      const a1 = Number(await attr(actor, "data-x"));
      assert.ok(a1 - a0 > 150, `actor followed ${a0} -> ${a1}`);
      await btn("⌚ 시계").click();
      await page.getByRole("button", { name: "🕹 로봇 타기" }).click();
      assert.equal(await attr(actor, "data-mode"), "ride");
      await move("x", p0.x);
      assert.ok(Math.abs(Number(await attr(actor, "data-x")) - p0.x) < 20, "ridden robot moves");
      await btn("⌚ 시계").click();
      await page.getByRole("button", { name: "🚶 따라오게 하기" }).click();
      assert.equal(await attr(actor, "data-mode"), "follow");
      console.log(`PASS ${name} AT-04 follow and ride move the robot in the world`);

      // AT-05/06/07: real one-body fusion, 2 vs 3, and split keeps every card.
      await g.fuse(["경찰 로봇", "소방 로봇"]);
      const body = page.locator("[data-robot-actor] svg[data-fusion]");
      assert.equal(await attr(body, "data-fusion"), "2");
      assert.equal(await attr(body, "data-part-head"), "rb-police");
      assert.equal(await attr(body, "data-part-arms"), "rb-fire");
      assert.equal(await page.locator("[data-robot-actor] svg[role=img]").count(), 1, "one body");
      assert.ok((await hint.innerText()).includes("힘 2"));
      assert.ok((await g.weapon.innerText()).includes("물대포"));
      const headSize = async () =>
        (await body.locator(".hj-fpart-head").first().boundingBox()).height;
      const h2 = await headSize();
      await page.screenshot({ path: `${out}/at05-fusion2-${name}.png` });
      const cardsBefore = JSON.stringify((await saved()).robots.cards);
      await btn("합체 풀기").click();
      await page.locator('[data-robot-actor][data-fusion-phase="splitting"]').waitFor();
      await page.locator('[data-robot-actor][data-fusion-phase="returning"]').waitFor();
      await page.locator('[data-robot-actor][data-fusion-phase="single"]').waitFor();
      assert.equal(await attr(actor, "data-team"), "rb-police");
      assert.equal(JSON.stringify((await saved()).robots.cards), cardsBefore);
      await g.fuse(["경찰 로봇", "소방 로봇", "하늘 로봇"]);
      assert.equal(await attr(body, "data-fusion"), "3");
      assert.equal(await attr(body, "data-part-legs"), "rb-sky");
      // The 3단 body is drawn about 1.25× bigger than 2단.
      const h3 = await headSize();
      assert.ok(h3 > h2 * 1.1, `3단 head ${h3} vs 2단 ${h2}`);
      assert.ok((await hint.innerText()).includes("힘 3"));
      assert.equal((await saved()).robots.fusionBest, 3);
      await page.screenshot({ path: `${out}/at06-fusion3-${name}.png` });
      console.log(`PASS ${name} AT-05/06/07 one-body 2단/3단 fusion, split keeps cards`);

      // AT-08/09: weapon range and cooldown, villain knocked out and paid once.
      await btn("합체 풀기").click();
      await page.locator('[data-robot-actor][data-fusion-phase="single"]').waitFor();
      await g.fuse(["경찰 로봇", "소방 로봇"]);
      await move("x", VILLAIN_SPOT.x);
      await move("y", VILLAIN_SPOT.y - 480);
      await settle();
      const hpFar = Number(await attr(villain, "data-hp"));
      const usesFar = (await saved()).robots.cards["rb-police"].uses;
      await g.strike();
      assert.ok((await hint.innerText()).includes("너무 멀어"));
      assert.equal(await attr(actor, "data-weapon"), "drawn");
      assert.equal(Number(await attr(villain, "data-hp")), hpFar);
      assert.equal((await saved()).robots.cards["rb-police"].uses, usesFar);
      await move("y", VILLAIN_SPOT.y - 200);
      await settle();
      await g.strike();
      assert.equal(Number(await attr(villain, "data-hp")), hpFar - 2);
      await page.screenshot({ path: `${out}/at08-weapon-${name}.png` });
      await g.weapon.click(); // inside the cooldown
      assert.ok((await hint.innerText()).includes("충전 중"));
      assert.equal(Number(await attr(villain, "data-hp")), hpFar - 2);
      await g.strike();
      await page.locator('[data-villain="retreating"]').waitFor();
      assert.ok((await hint.innerText()).includes("물리쳤어"));
      const afterWin = (await saved()).robots;
      assert.equal(afterWin.wins, 1);
      assert.equal(afterWin.parts, 2);
      assert.equal(afterWin.cards["rb-police"].uses, usesFar + 2);
      assert.equal(afterWin.cards["rb-fire"].uses, usesFar + 2);
      console.log(`PASS ${name} AT-08/09 weapon range+cooldown, villain retreats, paid once`);

      // AT-11: rescue the trapped friend in the world.
      await g.mission("🔥 위험한 친구 구하기");
      const rescue = page.locator("[data-rescue]");
      assert.ok((await page.locator("[data-compass]").innerText()).includes("친구 구하기"));
      await move("y", 1000);
      await move("x", RESCUE_SPOT.x);
      await move("y", RESCUE_SPOT.y + 230);
      await settle();
      assert.equal(await attr(rescue, "data-rescue"), "rescuing");
      assert.equal(await attr(rescue, "data-burning"), "3");
      await g.strike();
      assert.equal(await attr(rescue, "data-burning"), "1", "fire arms put out two bushes");
      await g.strike();
      await page.locator('[data-rescue="safe"]').waitFor();
      // Sending the robot home right away must not cancel the reward or the thank-you.
      await btn("⌚ 시계").click();
      await page.getByRole("button", { name: "⌚ 시계로 돌려보내기" }).click();
      assert.equal(await actor.count(), 0);
      assert.equal((await saved()).robots.rescues, 1);
      await page.locator('[data-rescue="thanked"]').waitFor();
      await g.fuse(["경찰 로봇", "소방 로봇"]);
      await page.screenshot({ path: `${out}/at11-rescue-${name}.png` });
      console.log(`PASS ${name} AT-11 friend in danger -> rescued -> thanked, paid once`);

      // AT-12: chase the moving thief; only a police robot can arrest it.
      await g.mission("💰 도둑 잡기");
      const thief = page.locator("[data-thief]");
      await move("y", THIEF_HOME.y);
      await move("x", THIEF_HOME.x + 700);
      await thief.waitFor();
      const at = async () => ({
        x: Number(await attr(thief, "data-x")),
        y: Number(await attr(thief, "data-y")),
      });
      const t0 = await at();
      let caught = false;
      let moved = false;
      for (let i = 0; i < 80 && !caught; i++) {
        const t = await at();
        if (Math.abs(t.x - t0.x) + Math.abs(t.y - t0.y) > 30) moved = true;
        const p = await position();
        // The world wraps around (the thief field touches x = 0), so use the shortest way.
        const wrap = (d, size) => ((((d + size / 2) % size) + size) % size) - size / 2;
        const dx = wrap(t.x - p.x, 20400),
          dy = wrap(t.y - p.y, 10800);
        if (Math.hypot(dx, dy) > 110) {
          const key =
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "ArrowRight"
                : "ArrowLeft"
              : dy > 0
                ? "ArrowDown"
                : "ArrowUp";
          await page.keyboard.down(key);
          await page.waitForTimeout(260);
          await page.keyboard.up(key);
        }
        await g.weapon.click();
        await page.waitForTimeout(150);
        caught = (await attr(thief, "data-thief")) === "caught";
      }
      assert.ok(moved, "the thief ran by itself");
      assert.ok(caught, "the thief was caught");
      await page.screenshot({ path: `${out}/at12-thief-${name}.png` });
      assert.equal((await saved()).robots.catches, 1);
      await page.locator('[data-thief="retreating"]').first().waitFor();
      // A new chase started right away is not ended by the last chase's timers.
      await g.mission("💰 도둑 잡기");
      await page.waitForTimeout(6500);
      assert.ok(["fleeing", "stunned"].includes(await attr(thief, "data-thief")));
      console.log(`PASS ${name} AT-12 thief ran, was chased and arrested by the police robot`);

      // AT-13: reload keeps robots and the old village progress.
      const before = await saved();
      await page.reload({ waitUntil: "networkidle" });
      const after = await saved();
      assert.deepEqual(after.robots, before.robots);
      assert.equal(after.money, 3000);
      assert.deepEqual(after.ownedCars, before.ownedCars);
      assert.equal(after.carUpgrades["car-021"].engine, true);
      assert.equal(after.version, 3);
      await btn("⌚ 시계").click();
      await page.getByRole("tab", { name: "🚨 출동" }).click();
      const stats = await page.locator(".hj-watch-stats").innerText();
      for (const s of ["악당 1", "구조 1", "체포 1", "최고 3단"]) assert.ok(stats.includes(s), s);
      await btn("소환 시계 닫기").click();
      console.log(`PASS ${name} AT-13 reload keeps robot progress, coins and cars`);

      if (name === "phone") {
        // AT-14: everything is reachable with fingers, nothing off screen, no keyboard.
        await g.summon("경찰 로봇");
        for (const b of [btn("⌚ 시계"), btn("💥 합체"), g.weapon, btn("지도"), g.action]) {
          const box = await b.boundingBox();
          assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 390);
          assert.ok(box.y + box.height <= 844 && box.height >= 44, "finger-sized, on screen");
        }
        await btn("⌚ 시계").tap();
        await page.getByRole("tab", { name: "💥 합체" }).tap();
        await page.locator(".hj-watch").evaluate((e) => e.scrollTo(0, e.scrollHeight));
        assert.ok(await btn("소환 시계 닫기").isVisible(), "close stays reachable");
        assert.equal(await page.locator("input, textarea").count(), 0);
        await btn("소환 시계 닫기").tap();
        await page.screenshot({ path: `${out}/at14-hud-${name}.png` });
        console.log("PASS phone AT-14 HUD and watch reachable by touch, no keyboard field");

        // AT-15: map travel takes the robot along; going into a building sends it home.
        await btn("지도").tap();
        await btn("🛒 별빛 마트").tap();
        await page.waitForTimeout(800);
        const p = await position();
        assert.ok(Math.abs(Number(await attr(actor, "data-x")) - p.x) < 200, "robot came along");
        await g.action.tap();
        await page.getByLabel("별빛 마트 실내", { exact: true }).waitFor();
        assert.equal(await actor.count(), 0);
        assert.ok((await hint.innerText()).length > 0);
        await btn("건물 밖으로").first().tap();
        await page.getByLabel("별빛 마트 실내", { exact: true }).waitFor({ state: "detached" });
        assert.equal(await btn("⌚ 시계").count(), 1);
        console.log("PASS phone AT-15 robot travels by map, returns to the watch in a building");
      }
      await page.close();
    }

    // AT-10: the 7th valid use visibly and measurably powers the current robot up.
    {
      const g = await open(
        browser,
        { width: 1280, height: 900 },
        { ...SEED, robots: { cards: { "rb-police": { uses: 6 } } } },
        errors,
      );
      const { page, hint, actor, villain, saved, attr, move, settle } = g;
      await g.summon("경찰 로봇");
      assert.equal(await attr(actor, "data-grade"), "0");
      await move("x", VILLAIN_SPOT.x);
      await move("y", VILLAIN_SPOT.y - 120);
      await settle();
      const hp0 = Number(await attr(villain, "data-hp"));
      await g.strike();
      assert.equal(Number(await attr(villain, "data-hp")), hp0 - 1, "weak robot hits for 1");
      assert.ok((await hint.innerText()).includes("파워 업!"));
      assert.equal(await attr(actor, "data-grade"), "1");
      await page.screenshot({ path: `${out}/at10-powerup-tablet.png` });
      await g.strike();
      assert.equal(Number(await attr(villain, "data-hp")), hp0 - 3, "powered-up robot hits for 2");
      const s = (await saved()).robots;
      assert.equal(s.cards["rb-police"].uses, 7);
      assert.equal(s.cards["rb-police"].grade, 1);
      assert.ok(s.cards["rb-thunder-police"]);
      await page.reload({ waitUntil: "networkidle" });
      await g.btn("⌚ 시계").click();
      await page.getByRole("button", { name: "경찰 로봇 카드", exact: true }).click();
      assert.ok(
        (await page.locator("[data-watch-preview]").innerText()).includes("강화 경찰 로봇"),
      );
      assert.equal(
        await page.getByRole("button", { name: "번개 경찰 로봇 카드", exact: true }).isEnabled(),
        true,
      );
      console.log("PASS tablet AT-10 7th use: grade 0->1, hit 1->2, new card, kept after reload");
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
