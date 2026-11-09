// Isolated preview saves; requires existing playwright-core and headless Chromium.
// Kart arcade minigames (/mini/$game, src/game/play/arcade.ts): every game opens from the kart,
// plays to a win by touch, pays once, can be lost, pauses with the clock, pays nothing when left
// mid-run, and fits a phone. A small in-page player taps what a child would tap, reading the
// game state from data-* attributes.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { ARCADE, arcadeReward } = require("../src/game/play/arcade.ts");
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-arcade-evidence";
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
const only = process.env.PHJ_ARCADE ? process.env.PHJ_ARCADE.split(",") : null;
fs.mkdirSync(out, { recursive: true });
const SEED = { version: 3, money: 100, ownedCars: ["car-001"] };
const pass = (name, what) => console.log(`PASS ${name} ${what}`);

/** In-page players: one tap decision every `ms`, the way a child would play. */
const PLAYERS = {
  balloons: { ms: 60, win: `document.querySelector('[data-in-ring="true"]')?.click()` },
  coins: { ms: 60, win: `document.querySelector('[data-kind="coin"]')?.click()` },
  jump: { ms: 120, win: `document.querySelector('[data-lit="true"]')?.click()` },
  dodge: {
    ms: 40,
    win: `(() => {
      const f = document.querySelector('.dodge-field'); if (!f) return;
      const lane = Number(f.dataset.lane);
      const rocks = [...f.querySelectorAll('[data-rock]')].map((r) => ({
        lane: Number(r.dataset.rockLane), y: Number(r.dataset.rockY) }));
      const near = (l) => rocks.some((r) => r.lane === l && r.y > 0.45 && r.y < 1);
      if (!near(lane)) return;
      const free = [0, 1, 2].filter((l) => !near(l)).sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane))[0];
      if (free === undefined) return;
      const [left, right] = document.querySelectorAll('.dodge-controls button');
      (free < lane ? left : right).click();
    })()`,
  },
  cloud: {
    ms: 20,
    win: `(() => { const f = document.querySelector('.cloud-field');
      if (f && f.dataset.under === 'true' && Math.abs(Number(f.dataset.cloudX) - 0.5) < 0.06)
        document.querySelector('.arcade-action').click(); })()`,
  },
  surf: {
    ms: 50,
    win: `(() => { const f = document.querySelector('.surf-field'); if (!f) return;
      const n = Number(f.dataset.needle); const [l, r] = document.querySelectorAll('.dodge-controls button');
      const up = (b) => b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
      const down = (b) => b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      up(l); up(r); if (n > 0.08) down(l); else if (n < -0.08) down(r); })()`,
  },
  water: {
    ms: 90,
    win: `(() => { const f = document.querySelector('.water-field'); if (!f) return;
      const aim = Number(f.dataset.aim);
      const dry = [...f.querySelectorAll('[data-plot]')].findIndex((p) => p.dataset.wet === 'false');
      const [l, pour, r] = document.querySelectorAll('.water-controls button');
      (dry === aim ? pour : dry > aim ? r : l).click(); })()`,
  },
  range: { ms: 60, win: `document.querySelector('.range-pop[data-kind="target"]')?.click()` },
};
/** How to lose each game quickly. */
const LOSE = {
  balloons: async (page) => {
    for (let i = 0; i < 5; i++) {
      const low = page.locator('[data-in-ring="false"]').first();
      await low.waitFor();
      await low.click({ force: true });
    }
  },
  coins: async (page) => {
    for (let i = 0; i < 3; i++) {
      const cloud = page.locator('[data-kind="cloud"]').first();
      await cloud.waitFor({ timeout: 20000 });
      await cloud.click({ force: true });
    }
  },
  jump: async (page) => {
    for (let i = 0; i < 3; i++) await page.locator('[data-lit="false"]').first().click();
  },
  dodge: async () => {},
  cloud: async (page) => {
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(
        () => document.querySelector(".cloud-field")?.dataset.under === "false",
      );
      await page.locator(".arcade-action").click();
    }
  },
  surf: async () => {},
  water: async (page) => {
    for (let i = 0; i < 12; i++) await page.getByRole("button", { name: "💧 물 주기" }).click();
  },
  range: async (page) => {
    for (let i = 0; i < 3; i++) {
      const friend = page.locator('.range-pop[data-kind="friend"]').first();
      await friend.waitFor({ timeout: 20000 });
      await friend.click({ force: true });
    }
  },
};

async function open(browser, viewport, errors) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 900 });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((seed) => {
    if (!localStorage.getItem("hyunjun-game-v2"))
      localStorage.setItem("hyunjun-game-v2", JSON.stringify(seed));
  }, SEED);
  const saved = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("hyunjun-game-v2") || "{}"));
  const phase = () => page.locator(".arcade").getAttribute("data-phase");
  return { context, page, saved, phase };
}
async function play(page, key, timeout = 90000) {
  const { ms, win } = PLAYERS[key];
  await page.evaluate(
    ({ ms, win }) => {
      window.__arcadeBot = setInterval(() => new Function(win)(), ms);
    },
    { ms, win },
  );
  await page.locator('.arcade[data-phase="won"]').waitFor({ timeout });
  await page.evaluate(() => clearInterval(window.__arcadeBot));
}

async function runGame(browser, viewport, name, game, errors) {
  const { key, goal } = game;
  const g = await open(browser, viewport, errors);
  const { page, saved, phase } = g;
  const shot = (f) => page.screenshot({ path: `${out}/${name}-${key}-${f}.png` });

  // Opens from the kart list, like a child would.
  await page.goto(`${url}#/kart`, { waitUntil: "networkidle" });
  await page.locator(`[data-game-id="${game.catalogId}"] a`).click();
  await page.locator(`.arcade[data-game="${key}"][data-phase="ready"]`).waitFor();
  await shot("ready");

  // Win by touch: the first tap is a real touch, the rest come from the in-page player.
  const before = (await saved()).money;
  await page.getByRole("button", { name: "시작하기" }).tap();
  assert.equal(await phase(), "playing");
  await page.waitForTimeout(700);
  await shot("playing");
  await play(page, key);
  assert.equal(Number(await page.locator(".arcade").getAttribute("data-score")), goal);
  await page.waitForTimeout(300);
  const won = await saved();
  assert.equal(won.money, before + arcadeReward(key, goal), "paid once for a win");
  assert.equal(won.arcadeBest[key], goal);
  assert.equal(won.version, 3);
  await shot("won");
  pass(name, `${key}: won ${goal} by touch, paid ${arcadeReward(key, goal)} once`);

  // Pause stops the clock and the field.
  await page.getByRole("button", { name: "한 번 더 도전" }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "잠깐 쉬기" }).click();
  assert.equal(await phase(), "paused");
  const hud = await page.locator(".arcade-hud").innerText();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator(".arcade-hud").innerText(), hud, "nothing moves while paused");
  await page.getByRole("button", { name: "이어서 하기" }).click();
  assert.equal(await phase(), "playing");

  // Lose.
  const beforeLoss = (await saved()).money;
  await LOSE[key](page);
  await page.locator('.arcade[data-phase="lost"]').waitFor({ timeout: 60000 });
  const lostScore = Number(await page.locator(".arcade").getAttribute("data-score"));
  await page.waitForTimeout(300);
  assert.equal((await saved()).money, beforeLoss + arcadeReward(key, lostScore));
  pass(name, `${key}: pause holds the clock; a loss pays only its score (${lostScore})`);

  // Leaving mid-run pays nothing.
  await page.getByRole("button", { name: "한 번 더 도전" }).click();
  await page.waitForTimeout(1500);
  const mid = (await saved()).money;
  await page.getByRole("link", { name: "카트로 돌아가기" }).first().click();
  await page.locator("[data-game-id]").first().waitFor();
  await page.waitForTimeout(300);
  assert.equal((await saved()).money, mid, "no reward for leaving mid-run");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assert.ok(overflow <= 0, `page is ${overflow}px too wide`);
  pass(name, `${key}: leaving mid-run pays nothing; no sideways scroll`);
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
    ])
      for (const game of ARCADE)
        if (!only || only.includes(game.key)) await runGame(browser, viewport, name, game, errors);
    // An unknown game shows a way back, not a crash.
    const g = await open(browser, { width: 390, height: 844 }, errors);
    await g.page.goto(`${url}#/mini/nope`, { waitUntil: "networkidle" });
    assert.equal(await g.phase(), "missing");
    await g.context.close();
    assert.deepEqual(errors, []);
    pass("all", "unknown game handled; no page errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
