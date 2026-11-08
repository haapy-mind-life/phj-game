// Isolated preview saves; requires existing playwright-core and headless Chromium.
// Roster v1.1 (docs/robot-fusion/2026-11-02-roster-100): Tira and Emblus really summon, change
// form, heal infected army robots with the weapon, fuse into the antidote sword, and old saves
// keep everything. Checks read the engine (data-* attributes and the save), not only pictures.
const assert = require("node:assert/strict");
const { enterWorld } = require("./enter-world.cjs");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { armyPosition, armyRobot } = require("../src/game/robot/robot-army.ts");
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-roster-evidence";
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
fs.mkdirSync(out, { recursive: true });
const OLD_CARDS = {
  "rb-police": { uses: 7, grade: 1 },
  "rb-thunder-police": { uses: 2, grade: 0 },
  "rb-fire": { uses: 3, grade: 0 },
  "lg-steel": { uses: 1, grade: 0 },
};
const SEED = {
  version: 3,
  money: 3000,
  ownedCars: ["car-001", "car-021"],
  carUpgrades: { "car-021": { engine: true, special: false } },
  robots: { cards: OLD_CARDS, parts: 5, wins: 2, massFusions: 1 },
};
const wrap = (d, size) => ((((d + size / 2) % size) + size) % size) - size / 2;
const pass = (name, what) => console.log(`PASS ${name} ${what}`);

async function open(browser, viewport, errors) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 500 });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((seed) => {
    if (!localStorage.getItem("hyunjun-game-v2"))
      localStorage.setItem("hyunjun-game-v2", JSON.stringify(seed));
  }, SEED);
  await page.goto(url, { waitUntil: "networkidle" });
  await enterWorld(page);
  const btn = (name) => page.getByRole("button", { name, exact: true });
  const saved = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("hyunjun-game-v2") || "{}"));
  const position = () =>
    page
      .locator(".adv-map .adv-player:not(.hj-remote)")
      .first()
      .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
  async function step(dx, dy, ms) {
    const keys = [];
    if (dx) keys.push(dx > 0 ? "ArrowRight" : "ArrowLeft");
    if (dy) keys.push(dy > 0 ? "ArrowDown" : "ArrowUp");
    for (const k of keys) await page.keyboard.down(k);
    await page.waitForTimeout(ms);
    for (const k of keys) await page.keyboard.up(k);
  }
  async function moveNear(target, near) {
    for (let i = 0; i < 120; i++) {
      const p = await position();
      const dx = wrap(target().x - p.x, 20400),
        dy = wrap(target().y - p.y, 10800);
      if (Math.hypot(dx, dy) < near) return;
      await step(
        Math.abs(dx) > 14 ? dx : 0,
        Math.abs(dy) > 14 ? dy : 0,
        Math.min(400, Math.max(40, (Math.max(Math.abs(dx), Math.abs(dy)) / 300) * 1000)),
      );
    }
    throw Error(`could not get near ${JSON.stringify(target())}`);
  }
  const actor = page.locator("[data-robot-actor]").first();
  const attr = (name) => actor.getAttribute(name);
  async function openWatch(tab) {
    await btn("⌚ 시계").click();
    await page.getByRole("tab", { name: tab }).click();
  }
  async function summon(name) {
    await openWatch("🃏 소환");
    await page.getByRole("button", { name: `${name} 카드`, exact: true }).click();
    await page.getByRole("button", { name: `✨ ${name} 소환!` }).click();
    await page.locator('[data-robot-actor][data-phase="active"]').first().waitFor();
  }
  /** Read from the army engine, so robots too far away to be drawn still count. */
  const infected = async () => {
    const ids = await page.locator(".hj-army").first().getAttribute("data-infected-ids");
    return (ids || "")
      .split(",")
      .filter(Boolean)
      .map((id) => ({ id, ...armyPosition(armyRobot(id), Date.now() / 1000) }));
  };
  return { page, btn, saved, position, moveNear, actor, attr, openWatch, summon, infected };
}
/** Heals every infected robot by walking up and using the weapon. */
async function cureAll(g, reach) {
  const { page, moveNear, infected } = g;
  for (let round = 0; round < 12; round++) {
    const left = await infected();
    if (!left.length) return;
    const robot = armyRobot(left[0].id);
    await moveNear(() => armyPosition(robot, Date.now() / 1000), reach);
    if (round === 0) await page.screenshot({ path: `${out}/${g.tag}-06b-infected-close.png` });
    await page.locator(".hj-weapon-button").click();
    await page.waitForTimeout(1250);
  }
  throw Error("infected robots left after 12 hits");
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
      { width: 360, height: 740 },
    ]) {
      const name = viewport.width < 500 ? "phone" : "tablet";
      const g = await open(browser, viewport, errors);
      g.tag = name;
      const { page, btn, saved, actor, attr, openWatch, summon, infected, moveNear } = g;
      const shot = (file) => page.screenshot({ path: `${out}/${name}-${file}.png` });

      // AC-03/19: the featured six come first; the other two stay in the watch underneath.
      await openWatch("🃏 소환");
      const main = page.getByRole("group", { name: "시계에 저장된 로봇 카드" });
      assert.deepEqual(
        await main.locator("[data-card]").evaluateAll((els) => els.map((e) => e.dataset.card)),
        ["rb-tira", "rb-emblus", "rb-police", "rb-fire", "rb-sky", "rb-thunder-police"],
      );
      const others = page.getByRole("group", { name: "다른 로봇 카드" });
      assert.deepEqual(
        await others.locator("[data-card]").evaluateAll((els) => els.map((e) => e.dataset.card)),
        ["rb-volcano-fire", "rb-laser-sky", "rb-rocket", "rb-rocket-x"],
      );
      assert.equal(await main.locator("svg[data-roster]").count(), 6, "six own bodies on cards");
      await shot("01-watch-cards");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      assert.ok(overflow <= 0, `page is ${overflow}px too wide`);
      await btn("소환 시계 닫기").click();
      pass(name, "AC-03 featured six first, the other two kept below");

      // AC-22: an old save still holds everything, with no version change.
      let s = await saved();
      assert.equal(s.version, 3);
      assert.deepEqual(s.robots.cards["rb-police"], OLD_CARDS["rb-police"]);
      assert.equal(s.money, 3000);

      // AC-08/10: Tira's card matches the world robot; egg ↔ robot both ways.
      await summon("티라");
      assert.equal(await attr("data-team"), "rb-tira");
      const tira = actor.locator('svg[data-roster="rb-tira"]');
      assert.equal(await tira.count(), 1, "the world robot is Tira's own art");
      assert.equal(await tira.locator('[data-tira-face="closed"]').count(), 1);
      await shot("02-tira");
      const form = page.locator(".hj-form-button");
      assert.equal(await form.innerText(), "🥚 알로 변신");
      await form.click();
      assert.equal(await attr("data-phase"), "transforming");
      await page
        .locator('[data-robot-actor][data-phase="active"][data-form="egg"]')
        .first()
        .waitFor();
      await shot("03-tira-egg");
      await page.locator(".hj-weapon-button").click();
      assert.equal(await actor.locator("svg").first().getAttribute("data-weapon"), "stowed");
      await form.click();
      await page
        .locator('[data-robot-actor][data-phase="active"][data-form="robot"]')
        .first()
        .waitFor();
      pass(name, "AC-08/10 Tira egg ↔ robot both ways; the egg can't swing");

      // AC-23 (form): a reload mid-change leaves a safe game with the cards intact.
      await form.click();
      await page.reload({ waitUntil: "networkidle" });
      await enterWorld(page);
      assert.equal(await page.locator("[data-robot-actor]").count(), 0);
      s = await saved();
      assert.deepEqual(s.robots.cards["rb-police"], OLD_CARDS["rb-police"]);
      assert.ok(s.robots.cards["rb-tira"], "Tira's card was stored by the summon");
      pass(name, "AC-23 reload during a change keeps every card");

      // AC-09/12/13/14: Emblus and the ambulance.
      await summon("엠블러스");
      const em = actor.locator('svg[data-roster="rb-emblus"]');
      assert.equal(await em.locator('[data-emblus-face="one-eye"]').count(), 1);
      assert.equal(await em.locator('[data-weapon-part="clamp"]').count(), 1);
      await shot("04-emblus");
      await page.locator(".hj-form-button").click();
      await page
        .locator('[data-robot-actor][data-phase="active"][data-form="ambulance"]')
        .first()
        .waitFor();
      await shot("05-ambulance");
      await page.locator(".hj-form-button").click();
      await page
        .locator('[data-robot-actor][data-phase="active"][data-form="robot"]')
        .first()
        .waitFor();
      pass(name, "AC-09/13/14 Emblus ambulance ↔ robot; one eye; handled clamp");

      // AC-16/25: with nothing infected the antidote cures and pays nothing.
      const before = (await saved()).robots;
      await page.locator(".hj-weapon-button").click();
      await page.waitForTimeout(200);
      let after = (await saved()).robots;
      assert.equal(after.cures ?? 0, 0);
      assert.equal(after.cards["rb-emblus"].uses, before.cards["rb-emblus"].uses);
      pass(name, "AC-16 no infected robot: no cure, no card use");

      // Only Emblus can start the cure; the mist lands on real army robots.
      await openWatch("🚨 출동");
      await page.getByRole("button", { name: "🟢 미스트 해독" }).click();
      await page.waitForTimeout(250);
      let sick = await infected();
      assert.ok(sick.length >= 1 && sick.length <= 3, `${sick.length} infected`);
      await shot("06-mist");

      // AC-16: too far away: stays infected and pays nothing.
      const startCount = sick.length;
      const far = await g.position();
      const nearest = Math.min(
        ...sick.map((r) => Math.hypot(wrap(r.x - far.x, 20400), wrap(r.y - far.y, 10800))),
      );
      if (nearest > 200) {
        await page.locator(".hj-weapon-button").click();
        await page.waitForTimeout(300);
        assert.equal((await infected()).length, startCount, "a far miss heals nobody");
        assert.equal((await saved()).robots.cures ?? 0, 0);
        await page.waitForTimeout(1200);
        pass(name, "AC-16 far miss: still infected, no reward, try again");
      }

      // AC-15/24: walk up and really hit each one with the handheld weapon.
      await cureAll(g, 170);
      await page.waitForTimeout(200);
      after = (await saved()).robots;
      assert.equal(after.cures, 1, "one finished cure");
      assert.equal(after.parts, before.parts + 2, "paid exactly once");
      assert.equal(
        after.cards["rb-emblus"].uses,
        Math.min(7, before.cards["rb-emblus"].uses + startCount),
        "each real hit is one card use",
      );
      assert.equal((await infected()).length, 0);
      await page.locator(".hj-weapon-button").click();
      await page.waitForTimeout(300);
      assert.equal((await saved()).robots.cures, 1, "extra swings pay nothing");
      await page.waitForTimeout(1200);
      await shot("07-cured");
      pass(name, "AC-15/24 infection → walk → hit → healthy; reward once");

      // AC-17/18: the special fusion, only as a pair.
      const cardsBefore = (await saved()).robots.cards;
      await openWatch("💥 합체");
      await page.getByRole("button", { name: "합체: 티라", exact: true }).click();
      assert.ok(
        await page.getByRole("button", { name: "합체: 경찰 로봇", exact: true }).isDisabled(),
      );
      await page.getByRole("button", { name: "합체: 엠블러스", exact: true }).click();
      await shot("08-fuse-preview");
      await page.getByRole("button", { name: "💥 특수 합체 시작!" }).click();
      await page
        .locator('[data-robot-actor][data-phase="active"]')
        .first()
        .waitFor({ timeout: 6000 });
      assert.equal(await attr("data-team"), "rb-emblus,rb-tira");
      const fused = actor.locator('svg[data-fusion-kind="special"]');
      assert.equal(await fused.getAttribute("data-part-chest"), "rb-tira");
      assert.equal(await fused.getAttribute("data-part-weapon"), "rb-tira");
      assert.equal(await fused.locator('[data-special-part="tira-chest"]').count(), 1);
      assert.equal(await fused.locator('[data-special-part="antidote-sword"]').count(), 1);
      assert.match(await page.locator(".hj-weapon-button").innerText(), /해독 칼/);
      assert.equal(await page.locator(".hj-form-button").count(), 0);
      await shot("09-special-fusion");
      s = (await saved()).robots;
      assert.equal(s.fusionCount, 1);
      for (const [id, card] of Object.entries(cardsBefore)) assert.deepEqual(s.cards[id], card, id);
      pass(name, "AC-17/18 Tira head on the chest, sword in the hand; cards unchanged");

      // Fused, the robot still walks and heals with the sword.
      const p0 = await g.position();
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(350);
      await page.keyboard.up("ArrowRight");
      assert.notDeepEqual(await g.position(), p0, "the fusion walks by itself");
      await openWatch("🚨 출동");
      await page.getByRole("button", { name: "🟢 미스트 해독" }).click();
      await page.waitForTimeout(250);
      assert.ok((await infected()).length >= 1);
      await cureAll(g, 200);
      await page.waitForTimeout(200);
      assert.equal((await saved()).robots.cures, 2);
      pass(name, "AC-17 the fusion moves and cures with the antidote sword");

      // AC-21 (mist part): calling the army lifts the mist; the rally still counts 100.
      await openWatch("🚨 출동");
      await page.getByRole("button", { name: "🟢 미스트 해독" }).click();
      await page.waitForTimeout(250);
      assert.ok((await infected()).length >= 1);
      await btn("지도").click();
      await btn("🤖 군단 집결 광장").click();
      await page.waitForTimeout(500);
      await openWatch("🤖 군단");
      await page.getByRole("button", { name: "📣 100대 집결!" }).click();
      await page.waitForTimeout(400);
      const army = page.locator(".hj-army").first();
      assert.equal(await army.getAttribute("data-mass-phase"), "gathering");
      assert.equal(await army.getAttribute("data-army-unique"), "100");
      assert.equal((await infected()).length, 0, "the mist lifts when the army is called");
      pass(name, "AC-21 rally with mist: 100 called, mist lifted, cures unchanged");
      assert.equal((await saved()).robots.cures, 2);
      await openWatch("🚨 출동");
      await page.getByRole("button", { name: "🟢 미스트 해독" }).click();
      await page.waitForTimeout(250);
      assert.equal((await infected()).length, 0, "no new mist while the army is on the move");
      pass(name, "AC-21 a cure can't start while the army is gathering");

      // AC-06: everything from the old save is still there after all of it.
      s = await saved();
      assert.equal(s.version, 3);
      assert.deepEqual(s.ownedCars, SEED.ownedCars);
      assert.equal(s.robots.massFusions, 1);
      assert.deepEqual(s.robots.cards["rb-police"], OLD_CARDS["rb-police"]);
      assert.deepEqual(s.robots.cards["lg-steel"], OLD_CARDS["lg-steel"]);
      pass(name, "AC-06/22 old save intact after the whole tour");
      await page.close();
    }

    // AC-19/20: Tira and Emblus stand in the world in squad-02, from the army registry.
    const g = await open(browser, { width: 1280, height: 900 }, errors);
    const { page, moveNear } = g;
    g.tag = "tablet";
    await moveNear(() => ({ x: 860, y: 305 }), 200);
    await page.waitForTimeout(500);
    const species = await page
      .locator(".hj-army-robot[data-army-id]")
      .evaluateAll((els) =>
        Object.fromEntries(els.map((e) => [e.dataset.armyId, e.dataset.armySpecies])),
      );
    assert.equal(species["army-008"], "rb-emblus");
    assert.equal(species["army-010"], "rb-tira");
    await page.screenshot({ path: `${out}/tablet-10-squad-02.png` });
    pass("tablet", "AC-19 army-008 is Emblus and army-010 is Tira in the world");
    await page.close();
    assert.deepEqual(errors, [], "no page errors");
    pass("all", "no page errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
