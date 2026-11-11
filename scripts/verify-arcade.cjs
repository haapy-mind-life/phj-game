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
  cook: {
    ms: 80,
    win: `(() => { const b = document.querySelector('.cook-board'); if (!b) return;
      document.querySelector('.cook-pantry [data-item="' + b.dataset.next + '"]')?.click(); })()`,
  },
  tidy: {
    ms: 80,
    win: `(() => { const b = document.querySelector('.tidy-board'); if (!b) return;
      document.querySelector('[data-zone="' + b.dataset.answer + '"]')?.click(); })()`,
  },
  box: {
    ms: 80,
    win: `(() => { const b = document.querySelector('.box-board'); if (!b || b.dataset.showing === 'true') return;
      const code = b.dataset.code.split(','), dials = b.dataset.dials.split(',');
      const i = dials.findIndex((d, k) => d !== code[k]);
      if (i >= 0) document.querySelector('[data-dial="' + i + '"]').click();
      else document.querySelector('.box-open').click(); })()`,
  },
  assemble: {
    ms: 80,
    win: `(() => { const b = document.querySelector('.assemble-board'); if (!b) return;
      if (!b.dataset.picked) document.querySelector('.assemble-tray button')?.click();
      else document.querySelector('[data-slot="' + b.dataset.picked + '"]')?.click(); })()`,
  },
  spot: {
    ms: 120,
    win: `(() => { const b = document.querySelector('.spot-board'); if (!b) return;
      document.querySelector('.spot-grid [data-cell="' + b.dataset.odd + '"]')?.click(); })()`,
  },
  hint: {
    ms: 100,
    win: `(() => { const b = document.querySelector('.hint-board'); if (!b) return;
      document.querySelector('.hint-map [data-cell="' + b.dataset.answer + '"]')?.click(); })()`,
  },
  rescue: {
    ms: 60,
    win: `(() => { const tiles = [...document.querySelectorAll('[data-tile]')]; if (!tiles.length) return;
      const m = tiles.map((t) => Number(t.dataset.mask)), S = 4;
      const rot = (x) => ((x << 1) | (x >> 3)) & 15, opp = (d) => rot(rot(d));
      const need = new Map();
      const walk = (x, y, from) => { const i = y * S + x; if (need.has(i)) return false;
        let t = m[i];
        for (let k = 0; k < 4; k++, t = rot(t)) { if (!(t & from)) continue; const out = t & ~from; need.set(i, t);
          if (x === 3 && y === 3 && out === 2) return true;
          const nx = x + (out === 2 ? 1 : out === 8 ? -1 : 0), ny = y + (out === 4 ? 1 : out === 1 ? -1 : 0);
          if (nx >= 0 && ny >= 0 && nx < S && ny < S && walk(nx, ny, opp(out))) return true;
          need.delete(i); }
        return false; };
      if (!walk(0, 0, 8)) return;
      for (const [i, t] of need) if (m[i] !== t) { tiles[i].click(); return; } })()`,
  },
  park: {
    ms: 90,
    win: `(() => { const b = document.querySelector('.park-board'); if (!b) return;
      const C = 5, R = 6, car = Number(b.dataset.car), spot = Number(b.dataset.spot);
      const cones = b.dataset.cones.split(',').filter(Boolean).map(Number);
      const steps = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const prev = new Map([[car, null]]), q = [car];
      while (q.length) { const at = q.shift(); if (at === spot) break;
        for (const [d, [dx, dy]] of Object.entries(steps)) { const x = (at % C) + dx, y = Math.floor(at / C) + dy, n = y * C + x;
          if (x < 0 || y < 0 || x >= C || y >= R || prev.has(n) || cones.includes(n)) continue;
          prev.set(n, [at, d]); q.push(n); } }
      let c = spot, first = null; while (prev.get(c)) { first = prev.get(c)[1]; c = prev.get(c)[0]; }
      if (first) document.querySelector('[data-dir="' + first + '"]').click(); })()`,
  },
  starhop: { ms: 80, win: `document.querySelector('.star-sky [data-star="true"]')?.click()` },
  fishking: {
    ms: 20,
    win: `(() => { const b = document.querySelector('.fish-board'); if (!b || b.dataset.phaseFish !== 'bite') return;
      const n = Number(b.dataset.needle), g = Number(b.dataset.green);
      if (n > g + 0.06 && n < g + 0.14) document.querySelector('.arcade-action').click(); })()`,
  },
  dig: {
    ms: 120,
    win: `(() => { const b = document.querySelector('.dig-board'); if (!b) return;
      const t = b.dataset.treasures.split(',').find((c) => !document.querySelector('[data-cell="' + c + '"]').dataset.clue);
      if (t !== undefined) document.querySelector('.dig-beach [data-cell="' + t + '"]').click(); })()`,
  },
  champion: {
    ms: 40,
    win: `(() => { const f = document.querySelector('.dodge-field[data-stage]'); if (!f) return;
      const lane = Number(f.dataset.lane);
      const items = [...f.querySelectorAll('[data-item-kind]')].map((i) => ({ kind: i.dataset.itemKind,
        lane: Number(i.dataset.itemLane), y: Number(i.dataset.itemY) }));
      const near = (l, k) => items.some((i) => i.kind === k && i.lane === l && i.y > 0.45 && i.y < 0.94);
      const safe = [0, 1, 2].filter((l) => !near(l, 'rock'));
      const want = safe.find((l) => near(l, 'boost')) ?? (safe.includes(lane) ? lane : safe[0]);
      if (want === undefined || want === lane) return;
      const step = want < lane ? -1 : 1;
      if (items.some((i) => i.kind === 'rock' && i.lane === lane + step && i.y > 0.72 && i.y < 0.94)) return;
      const [left, right] = document.querySelectorAll('.dodge-controls button');
      (step < 0 ? left : right).click(); })()`,
  },
  sky: {
    ms: 30,
    win: `(() => { const f = document.querySelector('.sky-field'); if (!f) return;
      const h = Number(f.dataset.height);
      const next = [...f.querySelectorAll('[data-thing]')].map((t) => ({ kind: t.dataset.thing, x: Number(t.dataset.x), h: Number(t.dataset.h) }))
        .filter((t) => t.x > 0.15 && t.kind !== 'updraft').sort((a, b) => a.x - b.x)[0];
      let target = next && next.kind === 'ring' ? next.h : 0.5;
      if (next && next.kind === 'bird') target = next.h > 0.5 ? next.h - 0.25 : next.h + 0.25;
      const b = document.querySelector('.arcade-action');
      b.dispatchEvent(new PointerEvent(h < target ? 'pointerdown' : 'pointerup', { bubbles: true })); })()`,
  },
  sea: {
    ms: 30,
    win: `(() => { const f = document.querySelector('.sea-field'); if (!f) return;
      const depth = f.dataset.depth, air = Number(f.dataset.air);
      const ahead = [...f.querySelectorAll('[data-thing]')].map((t) => ({ kind: t.dataset.thing, depth: t.dataset.depth, x: Number(t.dataset.x) }))
        .filter((t) => t.x > 0.15 && t.x < 0.45);
      const blockTop = ahead.some((t) => t.depth === 'top' && t.kind === 'block');
      const blockDeep = ahead.some((t) => t.depth === 'deep' && t.kind === 'block');
      const pearl = ahead.some((t) => t.depth === 'deep' && t.kind === 'pearl');
      const [up, down] = document.querySelectorAll('.dodge-controls button');
      if (depth === 'deep' && (blockDeep || (air < 1.2 && !blockTop))) up.click();
      else if (depth === 'top' && !blockDeep && ((blockTop && air > 0.6) || (pearl && air > 1.5))) down.click(); })()`,
  },
  robotrun: {
    ms: 60,
    win: `(() => { const f = document.querySelector('.run-field'); if (!f || !f.dataset.next) return;
      const need = { wall: 'robot', gap: 'plane', tunnel: 'car' }[f.dataset.next];
      if (f.dataset.form !== need) document.querySelector('[data-form-button="' + need + '"]').click(); })()`,
  },
  duel: {
    ms: 150,
    win: `(() => { const b = document.querySelector('.duel-board'); if (!b) return;
      const want = { punch: 'dodge', shield: 'charge', open: 'attack' }[b.dataset.signal];
      document.querySelector('[data-answer="' + want + '"]')?.click(); })()`,
  },
  legendfuse: {
    ms: 120,
    win: `(() => { const b = document.querySelector('.fuse-board'); if (!b || b.dataset.showing === 'true') return;
      const part = b.dataset.order.split(',')[Number(b.dataset.step)];
      document.querySelector('.fuse-parts [data-part="' + part + '"]')?.click(); })()`,
  },
  space: {
    ms: 40,
    win: `(() => { const f = document.querySelector('.space-field'); if (!f) return;
      const lane = Number(f.dataset.lane);
      const things = [...f.querySelectorAll('[data-space]')].map((t) => ({ kind: t.dataset.space,
        lane: Number(t.dataset.spaceLane), y: Number(t.dataset.spaceY) }));
      const [left, , shield, right] = document.querySelectorAll('.space-controls button');
      const fireBtn = document.querySelector('[data-fire]');
      const mine = things.filter((t) => t.lane === lane).sort((a, b) => b.y - a.y)[0];
      if (mine && mine.kind === 'drone') { fireBtn.click(); return; }
      if (mine && mine.kind === 'rock' && mine.y > 0.55) {
        const free = [0, 1, 2].find((l) => !things.some((t) => t.lane === l && t.y > 0.5));
        if (free !== undefined) { (free > lane ? right : left).click(); return; }
        if (mine.y > 0.8) { shield.click(); return; }
      }
      const drone = things.filter((t) => t.kind === 'drone').sort((a, b) => b.y - a.y)[0];
      if (drone && drone.lane !== lane && !things.some((t) => t.kind === 'rock' && t.lane === drone.lane && t.y > 0.5))
        (drone.lane > lane ? right : left).click(); })()`,
  },
  crack: {
    ms: 15,
    win: `(() => { const b = document.querySelector('.crack-board'); if (!b) return;
      const bar = Number(b.dataset.bar), from = Number(b.dataset.greenFrom), to = Number(b.dataset.greenTo);
      if (bar > from + 0.02 && bar < to - 0.02) document.querySelector('.arcade-action').click(); })()`,
  },
  earth: {
    ms: 150,
    win: `(() => { const b = document.querySelector('.earth-board'); if (!b) return;
      document.querySelector('[data-continent="' + b.dataset.answer + '"]')?.click(); })()`,
  },
  thai: {
    ms: 120,
    win: `(() => { const b = document.querySelector('.thai-board'); if (!b) return;
      const bought = b.dataset.bought.split(',');
      const want = b.dataset.list.split(',').find((i) => !bought.includes(i));
      if (want !== undefined) document.querySelector('[data-good="' + want + '"]')?.click(); })()`,
  },
  island: {
    ms: 150,
    win: `(() => { const b = document.querySelector('.island-board'); if (!b) return;
      document.querySelector('[data-cell="' + b.dataset.row + '-' + b.dataset.col + '"]')?.click(); })()`,
  },
  goldking: {
    ms: 90,
    win: `(() => { const b = document.querySelector('.gold-board'); if (!b || !b.dataset.arrow) return;
      const a = b.dataset.arrow;
      const d = a.includes('⬆') ? 'up' : a.includes('⬇') ? 'down' : a.includes('⬅') ? 'left' : 'right';
      document.querySelector('.gold-board [data-dir="' + d + '"]').click(); })()`,
  },
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
  cook: async (page) => {
    for (let i = 0; i < 3; i++) {
      const next = await page.locator(".cook-board").getAttribute("data-next");
      await page.locator(`.cook-pantry [data-item]:not([data-item="${next}"])`).first().click();
    }
  },
  tidy: async (page) => {
    for (let i = 0; i < 3; i++) {
      const answer = await page.locator(".tidy-board").getAttribute("data-answer");
      await page.locator(`[data-zone]:not([data-zone="${answer}"])`).first().click();
    }
  },
  box: async (page) => {
    for (let i = 0; i < 3; i++) {
      const board = page.locator('.box-board[data-showing="false"]');
      await board.waitFor();
      const code = (await board.getAttribute("data-code")).split(",");
      const dials = (await board.getAttribute("data-dials")).split(",");
      if (dials.every((d, k) => d === code[k])) await page.locator('[data-dial="0"]').click();
      await page.locator(".box-open").click();
    }
  },
  assemble: async (page) => {
    for (let i = 0; i < 3; i++) {
      const part = await page.locator(".assemble-tray button").first().getAttribute("data-part");
      await page.locator(".assemble-tray button").first().click();
      await page.locator(`.assemble-slot:not(.done):not([data-slot="${part}"])`).first().click();
    }
  },
  spot: async (page) => {
    for (let i = 0; i < 3; i++) {
      const odd = await page.locator(".spot-board").getAttribute("data-odd");
      await page.locator(`.spot-grid [data-cell]:not([data-cell="${odd}"])`).first().click();
    }
  },
  hint: async (page) => {
    for (let i = 0; i < 3; i++) {
      const answer = await page.locator(".hint-board").getAttribute("data-answer");
      await page.locator(`.hint-map [data-cell]:not([data-cell="${answer}"])`).first().click();
    }
  },
  // 친구 구하기 has no mistakes: it is lost only when its 150 s run out.
  rescue: async () => {},
  park: async (page) => {
    // Drive toward the nearest cone; once next to it, every push is a bump.
    for (let n = 0; n < 60; n++) {
      if ((await page.locator(".arcade").getAttribute("data-phase")) !== "playing") return;
      await page.evaluate(() => {
        const b = document.querySelector(".park-board");
        const C = 5,
          R = 6,
          car = Number(b.dataset.car);
        const cones = b.dataset.cones.split(",").filter(Boolean).map(Number);
        const steps = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
        const prev = new Map([[car, null]]),
          q = [car];
        let hit = null;
        while (q.length && hit === null) {
          const at = q.shift();
          for (const [d, [dx, dy]] of Object.entries(steps)) {
            const x = (at % C) + dx,
              y = Math.floor(at / C) + dy,
              c = y * C + x;
            if (x < 0 || y < 0 || x >= C || y >= R || prev.has(c)) continue;
            prev.set(c, [at, d]);
            if (cones.includes(c)) {
              hit = c;
              break;
            }
            if (c !== Number(b.dataset.spot)) q.push(c);
          }
        }
        let c = hit,
          first = null;
        while (prev.get(c)) {
          first = prev.get(c)[1];
          c = prev.get(c)[0];
        }
        if (first) document.querySelector(`[data-dir="${first}"]`).click();
      });
      await page.waitForTimeout(80);
    }
  },
  starhop: async (page) => {
    for (let i = 0; i < 3; i++) await page.locator('.star-sky [data-star="false"]').first().click();
  },
  fishking: async (page) => {
    // Pulling before any bite snaps the line.
    for (let i = 0; i < 3; i++) {
      await page.waitForFunction(
        () => document.querySelector(".fish-board")?.dataset.phaseFish === "waiting",
      );
      await page.locator(".arcade-action").click();
    }
  },
  dig: async (page) => {
    const treasures = (await page.locator(".dig-board").getAttribute("data-treasures")).split(",");
    for (let i = 0; i < 25; i++) {
      if ((await page.locator(".arcade").getAttribute("data-phase")) !== "playing") return;
      if (treasures.includes(String(i))) continue;
      await page.locator(`.dig-beach [data-cell="${i}"]`).click();
    }
  },
  // These large games are lost by leaving the controls alone: the rival wins, the plane sinks,
  // the swimmer bumps into boats, the runner keeps the wrong form.
  champion: async () => {},
  sky: async () => {},
  sea: async () => {},
  robotrun: async () => {},
  // Left alone: the rival's signals run out, the fusion order waits too long, drones reach the
  // ship, and peanuts roll away.
  duel: async () => {},
  legendfuse: async () => {},
  space: async () => {},
  crack: async () => {},
  earth: async () => {},
  thai: async (page) => {
    for (let i = 0; i < 3; i++) {
      const list = (await page.locator(".thai-board").getAttribute("data-list")).split(",");
      const goods = await page
        .locator("[data-good]")
        .evaluateAll((els) => els.map((e) => e.dataset.good));
      await page.locator(`[data-good="${goods.find((g) => !list.includes(g))}"]`).click();
    }
  },
  island: async (page) => {
    for (let i = 0; i < 3; i++) {
      const row = await page.locator(".island-board").getAttribute("data-row");
      const col = Number(await page.locator(".island-board").getAttribute("data-col"));
      await page.locator(`[data-cell="${row}-${(col + 1) % 3}"]`).click();
    }
  },
  goldking: async (page) => {
    // Step once away from the nearest coin, then go back and forth between two squares already
    // stood on (so neither holds a coin) until the 30 steps run out.
    const a = await page.locator(".gold-board").getAttribute("data-arrow");
    const away = a.includes("⬆")
      ? "down"
      : a.includes("⬇")
        ? "up"
        : a.includes("⬅")
          ? "right"
          : "left";
    const back = { up: "down", down: "up", left: "right", right: "left" }[away];
    await page.locator(`.gold-board [data-dir="${away}"]`).click();
    for (let i = 0; i < 40; i++) {
      if ((await page.locator(".arcade").getAttribute("data-phase")) !== "playing") return;
      await page.locator(`.gold-board [data-dir="${i % 2 ? away : back}"]`).click();
    }
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
  await page
    .locator('.arcade[data-phase="lost"]')
    .waitFor({ timeout: key === "rescue" ? 175000 : 60000 });
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
