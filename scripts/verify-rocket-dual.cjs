// Isolated preview saves; requires existing playwright-core and headless Chromium.
// Rocket dual v1 (docs/robot-fusion/2026-11-08-rocket-dual-v1): Rocket and Rocket X each change
// into a car, fuse in 10 s through four steps into one Dual Rocket, drive as the one dual car,
// split back, and a stopped, travelled or reloaded fusion records nothing. Checks read the
// engine (data-* attributes and the save), not only pictures.
const assert = require("node:assert/strict");
const { enterWorld } = require("./enter-world.cjs");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-rocket-dual-evidence";
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
fs.mkdirSync(out, { recursive: true });
const SEED = {
  version: 3,
  money: 500,
  ownedCars: ["car-001"],
  robots: { cards: { "rb-police": { uses: 3, grade: 1 } }, parts: 4, fusionCount: 2 },
};
const pass = (name, what) => console.log(`PASS ${name} ${what}`);

async function open(browser, viewport, errors, extra = {}) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 900, ...extra });
  const page = await context.newPage();
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
  const actor = page.locator("[data-robot-actor]").first();
  const attr = (name) => actor.getAttribute(name);
  async function openWatch(tab) {
    await btn("⌚ 시계").click();
    await page.getByRole("tab", { name: tab }).click();
  }
  async function summon(name) {
    await openWatch("🃏 소환");
    await btn(`${name} 카드`).click();
    await page.getByRole("button", { name: `✨ ${name} 소환!` }).click();
    await page.locator('[data-robot-actor][data-phase="active"]').first().waitFor();
  }
  async function startDual() {
    await openWatch("💥 합체");
    await btn("합체: 로켓").click();
    await btn("합체: 로켓 X").click();
    await page.locator('.hj-watch-fuse-preview svg[data-roster="dual-rocket"]').waitFor();
    await btn("💥 듀얼 로켓 합체 시작!").click();
    await page.locator('[data-robot-actor][data-phase="dualFusing"]').waitFor();
  }
  return { context, page, btn, saved, actor, attr, openWatch, summon, startDual };
}

/** Rocket alone: robot → car → robot, no weapon while a car. */
async function soloCars(g, name, id) {
  const { page, btn, attr, summon } = g;
  await summon(name);
  assert.equal(await page.locator(`[data-robot-actor] svg[data-roster="${id}"]`).count(), 1);
  await btn("🚗 자동차로 변신").click();
  await page.locator('[data-robot-actor][data-form="car"][data-phase="active"]').waitFor();
  assert.equal(
    await page.locator(`[data-robot-actor] svg[data-roster="${id}"][data-form="car"]`).count(),
    1,
  );
  await page.locator(".hj-weapon-button").click();
  assert.equal(await attr("data-weapon"), "stowed", "no weapon while a car");
  await btn("🤖 로봇으로 변신").click();
  await page.locator('[data-robot-actor][data-form="robot"][data-phase="active"]').waitFor();
  assert.equal(await attr("data-team"), id);
}

async function run(browser, viewport, errors, name) {
  const g = await open(browser, viewport, errors);
  const { page, btn, saved, attr, startDual } = g;
  const shot = (file) => page.screenshot({ path: `${out}/${name}-${file}.png` });

  // RD-AT-04/05: each friend changes into its own car and back.
  await soloCars(g, "로켓 X", "rb-rocket-x");
  await soloCars(g, "로켓", "rb-rocket");
  pass(name, "RD-AT-04/05 Rocket and Rocket X each go robot → car → robot");

  // RD-AT-06: the pair only — other cards rest while a rocket is picked.
  await g.openWatch("💥 합체");
  await btn("합체: 로켓").click();
  assert.equal(await btn("합체: 경찰 로봇").isDisabled(), true);
  assert.equal(await btn("합체: 티라").isDisabled(), true);
  await btn("합체: 로켓").click();
  await btn("소환 시계 닫기").click();

  // RD-AT-07/08/12: four steps on the countdown, one fusion however often start is pressed.
  const before = (await saved()).robots.fusionCount;
  await startDual();
  const steps = new Set();
  const seconds = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const phase = await attr("data-phase");
    if (phase !== "dualFusing") break;
    const stage = page.locator("[data-dual-step]");
    if (await stage.count()) {
      const step = await stage.getAttribute("data-dual-step");
      if (!steps.has(step)) {
        steps.add(step);
        await shot(`step-${step}`);
      }
      seconds.push(Number(await stage.getAttribute("data-dual-seconds")));
    }
    // Starting again mid-fusion must not start a second one or restart the countdown.
    if (steps.size === 2 && !g.retried) {
      g.retried = true;
      const left = Number(await stage.getAttribute("data-dual-seconds"));
      await g.openWatch("💥 합체");
      await btn("합체: 로켓").click();
      await btn("합체: 로켓 X").click();
      await btn("💥 듀얼 로켓 합체 시작!").click();
      const now = Number(await page.locator("[data-dual-step]").getAttribute("data-dual-seconds"));
      assert.ok(now <= left, `countdown restarted: ${left} → ${now}`);
    }
    await page.waitForTimeout(150);
  }
  const took = Date.now() - t0;
  assert.deepEqual([...steps], ["gather", "link", "assemble", "reveal"]);
  assert.ok(took >= 9000 && took < 12500, `fusion took ${took}ms`);
  for (let i = 1; i < seconds.length; i++) assert.ok(seconds[i] <= seconds[i - 1], "countdown");
  assert.equal(await attr("data-phase"), "active");
  assert.equal(await attr("data-team"), "rb-rocket,rb-rocket-x");
  assert.equal(await page.locator('[data-robot-actor] svg[data-roster="dual-rocket"]').count(), 1);
  await page.waitForTimeout(800);
  const afterSave = await saved();
  assert.equal(afterSave.robots.fusionCount, before + 1, "recorded exactly once");
  assert.equal(afterSave.robots.parts, 4, "no parts paid or taken");
  await shot("dual-robot");
  pass(name, `RD-AT-07/08/09/12 four steps in ${took}ms, one Dual Rocket, recorded once`);

  // RD-AT-10: the one dual car and back; no weapon while a car.
  await btn("🚗 자동차로 변신").click();
  await page.locator('[data-robot-actor][data-form="car"][data-phase="active"]').waitFor();
  assert.equal(
    await page
      .locator('[data-robot-actor] svg[data-roster="dual-rocket"][data-form="car"]')
      .count(),
    1,
  );
  assert.equal(await page.locator('[data-robot-actor] svg[data-roster="rb-rocket"]').count(), 0);
  await shot("dual-car");
  await btn("🤖 로봇으로 변신").click();
  await page.locator('[data-robot-actor][data-form="robot"][data-phase="active"]').waitFor();
  pass(name, "RD-AT-10 Dual Rocket ↔ the one dual car");

  // RD-AT-11: split from the dual car; both cards kept.
  await btn("🚗 자동차로 변신").click();
  await page.locator('[data-robot-actor][data-form="car"][data-phase="active"]').waitFor();
  await btn("합체 풀기").click();
  await page.waitForFunction(
    () => document.querySelector("[data-robot-actor]")?.getAttribute("data-phase") === "active",
  );
  assert.equal(await attr("data-team"), "rb-rocket");
  assert.equal(await attr("data-form"), "robot");
  const cards = (await saved()).robots.cards;
  assert.ok(cards["rb-rocket"] && cards["rb-rocket-x"], "both cards kept");
  assert.deepEqual(cards["rb-police"], { uses: 3, grade: 1 });
  pass(name, "RD-AT-11 split from the dual car: Rocket stays, both cards kept");

  // RD-AT-13: stopping at about 3 s records nothing and leaves Rocket.
  const count = (await saved()).robots.fusionCount;
  await startDual();
  await page.waitForTimeout(3000);
  await btn("✋ 합체 멈추기").click();
  assert.equal(await attr("data-phase"), "active");
  assert.equal(await attr("data-team"), "rb-rocket");
  await page.waitForTimeout(8000);
  assert.equal(await attr("data-team"), "rb-rocket", "a stopped fusion never finishes later");
  assert.equal((await saved()).robots.fusionCount, count);
  pass(name, "RD-AT-13 stopped at 3 s: Rocket stays, nothing recorded, no late finish");

  // RD-AT-13: map travel stops it too.
  await startDual();
  await page.waitForTimeout(2500);
  await page.locator(".adv-map-button").click();
  await btn("1. 우리 마을").click();
  await page.waitForTimeout(300);
  assert.equal(await attr("data-phase"), "active");
  assert.equal(await attr("data-team"), "rb-rocket");
  await page.waitForTimeout(8000);
  assert.equal((await saved()).robots.fusionCount, count);
  pass(name, "RD-AT-13 map travel stops the fusion; nothing recorded");

  // RD-AT-14: a reload mid-fusion stands nothing half-fused up and keeps the save.
  await startDual();
  await page.waitForTimeout(6000);
  await page.reload({ waitUntil: "networkidle" });
  await enterWorld(page);
  assert.equal(await page.locator("[data-robot-actor]").count(), 0);
  const reloaded = await saved();
  assert.equal(reloaded.version, 3);
  assert.equal(reloaded.robots.fusionCount, count);
  assert.deepEqual(reloaded.robots.cards["rb-police"], { uses: 3, grade: 1 });
  pass(name, "RD-AT-14 reload at 6 s: no half fusion, save kept");

  // RD-AT-21: controls stay on screen, no sideways scroll.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assert.ok(overflow <= 0, `page is ${overflow}px too wide`);
  await g.context.close();
}

async function reducedMotion(browser, errors) {
  // RD-AT-22: with reduced motion the steps still change on time, nothing shakes.
  const g = await open(browser, { width: 390, height: 844 }, errors, {
    reducedMotion: "reduce",
  });
  const { page } = g;
  await g.summon("로켓");
  await g.startDual();
  await page.waitForTimeout(4600);
  const stage = page.locator("[data-dual-step]");
  assert.equal(await stage.getAttribute("data-dual-step"), "assemble");
  const anim = await page
    .locator(".hj-dual-member.left")
    .evaluate((e) => getComputedStyle(e).animationName);
  assert.equal(anim, "none");
  await page.screenshot({ path: `${out}/reduced-assemble.png` });
  await page.locator('[data-robot-actor][data-phase="active"]').waitFor({ timeout: 8000 });
  pass("390", "RD-AT-22 reduced motion: steps on time, no shaking");
  await g.context.close();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    for (const [name, viewport] of [
      ["360", { width: 360, height: 740 }],
      ["390", { width: 390, height: 844 }],
      ["tablet", { width: 768, height: 1024 }],
    ])
      await run(browser, viewport, errors, name);
    await reducedMotion(browser, errors);
    assert.deepEqual(errors, []);
    pass("all", "no page errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
