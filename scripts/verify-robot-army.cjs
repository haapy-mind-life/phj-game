// Isolated preview saves; requires existing playwright-core and headless Chromium.
// Robot army v3 (RA-AT in docs/robot-fusion/2026-11-01-robot-army-v3): 100 real army robots
// on their routes, six legends, the 100-robot rally and giant, the giant villain and minions,
// reload safety, phone layout and frame times. Checks read the engine (data-* attributes,
// the save, and the army's own position function), not only pictures.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const { ARMY, armyPosition } = require("../src/game/robot-army.ts");
const { RALLY_SITE } = require("../src/game/robot-mass-fusion.ts");
const { BOSS_ARENA, MINION_CAMP } = require("../src/game/robot-giant-battle.ts");
const { VILLAGES } = require("../src/game/villages.ts");
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-army-evidence";
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
fs.mkdirSync(out, { recursive: true });
const SEED = {
  version: 3,
  money: 3000,
  ownedCars: ["car-001", "car-021"],
  carUpgrades: { "car-021": { engine: true, special: false } },
  robots: { cards: { "rb-police": { uses: 3, grade: 1 } } },
};
const wrap = (d, size) => ((((d + size / 2) % size) + size) % size) - size / 2;
const results = {};

async function open(browser, viewport, errors) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 500 });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((seed) => {
    if (!localStorage.getItem("hyunjun-game-v2"))
      localStorage.setItem("hyunjun-game-v2", JSON.stringify(seed));
  }, SEED);
  await page.goto(url, { waitUntil: "networkidle" });
  const btn = (name) => page.getByRole("button", { name, exact: true });
  const army = page.locator(".hj-army").first();
  const attr = (loc, name) => loc.first().getAttribute(name);
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
  async function moveTo(target, near = 30, tries = 120) {
    for (let i = 0; i < tries; i++) {
      const p = await position();
      const dx = wrap(target.x - p.x, 20400),
        dy = wrap(target.y - p.y, 10800);
      if (Math.hypot(dx, dy) < near) return;
      const ax = Math.abs(dx) > 14 ? dx : 0,
        ay = Math.abs(dy) > 14 ? dy : 0;
      await step(
        ax,
        ay,
        Math.min(450, Math.max(40, (Math.max(Math.abs(ax), Math.abs(ay)) / 260) * 1000)),
      );
    }
    throw Error(
      `could not reach ${JSON.stringify(target)} from ${JSON.stringify(await position())}`,
    );
  }
  async function travel(label) {
    await btn("지도").click();
    await btn(label).click();
    await page.waitForTimeout(400);
  }
  /** Visible army robots, deduplicated (the world draws twice near the x=0 edge). */
  async function visibleRobots() {
    const list = await page.locator("[data-army-id]").evaluateAll((els) =>
      els.map((e) => ({
        id: e.dataset.armyId,
        x: Number(e.dataset.x),
        y: Number(e.dataset.y),
        behavior: e.dataset.behavior,
        legend: e.dataset.legend || null,
      })),
    );
    return [...new Map(list.map((r) => [r.id, r])).values()];
  }
  /** Every drawn robot must stand where the army's own position function says it is now. */
  async function assertOnRoute(robots) {
    const t = Date.now() / 1000;
    for (const r of robots) {
      const robot = ARMY.find((a) => a.instanceId === r.id);
      assert.ok(robot, r.id);
      const p = armyPosition(robot, t);
      const d = Math.hypot(wrap(p.x - r.x, 20400), wrap(p.y - r.y, 10800));
      assert.ok(d < 40, `${r.id} drawn ${Math.round(d)} away from its route`);
    }
  }
  return {
    page,
    btn,
    army,
    attr,
    saved,
    position,
    step,
    moveTo,
    travel,
    visibleRobots,
    assertOnRoute,
  };
}
/** Frame-time p95 (ms) over `ms` of real animation frames. */
const frameTimes = (page, ms) =>
  page.evaluate(
    (ms) =>
      new Promise((done) => {
        const gaps = [];
        let last = performance.now();
        const end = last + ms;
        const tick = (t) => {
          gaps.push(t - last);
          last = t;
          if (t < end) requestAnimationFrame(tick);
          else {
            gaps.sort((a, b) => a - b);
            done({
              frames: gaps.length,
              p95: Math.round(gaps[Math.floor(gaps.length * 0.95)] * 10) / 10,
              heapMb: performance.memory
                ? Math.round(performance.memory.usedJSHeapSize / 1e5) / 10
                : null,
            });
          }
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );

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
      const full = name === "tablet";
      const g = await open(browser, viewport, errors);
      const { page, btn, army, attr, saved, moveTo, travel, visibleRobots, assertOnRoute } = g;
      const r = (results[name] = {});

      // RA-AT-01: the engine holds exactly 100 different robots.
      assert.equal(await attr(army, "data-army-total"), "100");
      assert.equal(await attr(army, "data-army-unique"), "100");
      console.log(`PASS ${name} RA-AT-01 army registry: 100 robots, 100 unique ids`);

      // RA-AT-02/03/05: robots stand on their own routes in different villages and move.
      const seen = new Set();
      const behaviors = new Set();
      const villages = full ? ["character", "farm", "new-1"] : ["character", "new-1"];
      for (const id of villages) {
        const i = VILLAGES.findIndex((v) => v.id === id);
        await travel(`${i + 1}. ${VILLAGES[i].name}`);
        const a = await visibleRobots();
        assert.ok(a.length >= 3, `${id}: robots in view`);
        assert.ok(a.length <= 14, "only nearby robots are drawn");
        await assertOnRoute(a);
        a.forEach((x) => {
          seen.add(x.id);
          behaviors.add(x.behavior);
        });
        await page.waitForTimeout(3000);
        const b = await visibleRobots();
        await assertOnRoute(b);
        const moved = b.filter((x) => {
          const before = a.find((y) => y.id === x.id);
          return before && Math.hypot(before.x - x.x, before.y - x.y) > 30;
        });
        assert.ok(moved.length >= 3, `${id}: robots moved by themselves`);
        if (id === "character")
          await page.screenshot({ path: `${out}/ra-at01-world-army-${name}.png` });
      }
      assert.ok(seen.size >= 10, `different robots seen: ${seen.size}`);
      assert.ok(behaviors.has("patrol") && behaviors.has("drill"), [...behaviors].join(","));
      // Going far away and coming back finds the same robots on their routes again.
      await travel(
        `${VILLAGES.findIndex((v) => v.id === "character") + 1}. ${VILLAGES.find((v) => v.id === "character").name}`,
      );
      const back = await visibleRobots();
      assert.ok(back.some((x) => seen.has(x.id)));
      await assertOnRoute(back);
      console.log(
        `PASS ${name} RA-AT-02/03/05 ${seen.size} robots seen in ${villages.length} villages, patrol+drill, moving on their routes`,
      );

      // RA-AT-06/07: exactly six legends, found by walking up to one, then summoned.
      const legend = ARMY.find((x) => x.species === "lg-shield");
      await btn("⌚ 시계").click();
      await page.getByRole("tab", { name: "⭐ 전설" }).click();
      const legendCards = page.getByRole("group", { name: "전설 로봇 카드" }).getByRole("button");
      assert.equal(await legendCards.count(), 6);
      const looks = await page
        .getByRole("group", { name: "전설 로봇 카드" })
        .locator("svg[data-legend]")
        .evaluateAll((els) => els.map((e) => e.dataset.legend));
      assert.equal(new Set(looks).size, 6, "six different legend pictures");
      assert.ok(
        await page.getByRole("button", { name: "방패 전설 로봇 카드 (아직 못 찾음)" }).isDisabled(),
      );
      // Every legend still to find has a hint; the panel still fits the screen width.
      assert.equal(await page.locator("[data-legend-hint]").count(), 6);
      assert.match(await page.locator('[data-legend-hint="lg-steel"]').innerText(), /벚꽃 마을/);
      await page.locator("[data-legend-hint]").last().scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (full) await page.screenshot({ path: `${out}/ra-at06-legendary-six-${name}.png` });
      await btn("소환 시계 닫기").click();
      if (full) {
        await moveTo(armyPosition(legend, Date.now() / 1000), 160);
        await page.waitForFunction(
          () => document.querySelector(".adv-touch-hint")?.textContent?.includes("전설 로봇 발견"),
          null,
          { timeout: 8000 },
        );
        assert.ok((await saved()).robots.cards["lg-shield"]);
        await btn("⌚ 시계").click();
        await page.getByRole("tab", { name: "⭐ 전설" }).click();
        // A found legend's hint is gone; the other five remain.
        assert.equal(await page.locator('[data-legend-hint="lg-shield"]').count(), 0);
        assert.equal(await page.locator("[data-legend-hint]").count(), 5);
        await page.getByRole("button", { name: "방패 전설 로봇 카드", exact: true }).click();
        await page.getByRole("button", { name: "✨ 방패 전설 로봇 소환!" }).click();
        await page.locator('[data-robot-actor][data-phase="active"]').first().waitFor();
        assert.equal(await attr(page.locator("[data-robot-actor]"), "data-team"), "lg-shield");
        // Near the y = 0 edge the world is drawn twice, so every copy must be the legend.
        const actorLooks = await page
          .locator("[data-robot-actor] svg[role=img]")
          .evaluateAll((els) => els.map((e) => e.dataset.legend));
        assert.ok(actorLooks.length >= 1 && actorLooks.every((l) => l === "lg-shield"));
        await page.screenshot({ path: `${out}/ra-at07-legend-summoned-${name}.png` });
        console.log(
          "PASS tablet RA-AT-06/07 six legends; walking up finds one; it is summoned and ridden",
        );
      } else console.log("PASS phone RA-AT-06 six different legends in the watch");

      // RA-AT-10/12/13: the rally is only possible at the square; 100 robots really walk in.
      await btn("⌚ 시계").click();
      await page.getByRole("tab", { name: "🤖 군단" }).click();
      assert.ok(await btn("📣 100대 집결!").isDisabled(), "only at the rally square");
      assert.equal(await attr(page.locator(".hj-watch-army"), "data-army-unique"), "100");
      await btn("소환 시계 닫기").click();
      await travel("🤖 군단 집결 광장");
      await btn("⌚ 시계").click();
      await page.getByRole("tab", { name: "🤖 군단" }).click();
      await btn("📣 100대 집결!").click();
      assert.equal(await attr(army, "data-mass-phase"), "gathering");
      assert.equal(await attr(army, "data-mass-participants"), "100");
      const counts = [];
      for (let i = 0; i < 6; i++) {
        await page.waitForTimeout(1500);
        counts.push(Number(await attr(army, "data-mass-arrived")));
        if (i === 1) {
          const walking = await visibleRobots();
          assert.ok(walking.some((x) => x.behavior === "rally" || x.behavior === "arrived"));
          await page.screenshot({ path: `${out}/ra-at10-assembly-progress-${name}.png` });
          // RA-AT-12: walk away from the square and come back; the rally keeps going.
          if (full) {
            await moveTo({ x: RALLY_SITE.x + 650, y: RALLY_SITE.y }, 40);
            await moveTo({ x: RALLY_SITE.x, y: RALLY_SITE.y - 120 }, 40);
          }
        }
      }
      // RA-AT-21: frame times while robots stream in (the busiest the army gets on screen).
      r.gatherDom = (await visibleRobots()).length;
      r.gatherFrames = await frameTimes(page, 2000);
      if (full) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        r.gatherFramesCpu4x = await frameTimes(page, 2000);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      }
      assert.ok(counts[0] < 100, `not instant: ${counts}`);
      assert.ok(
        counts.every((c, i) => i === 0 || c >= counts[i - 1]),
        `arrivals only grow: ${counts}`,
      );
      results[name].arrivals = counts;
      await page.waitForFunction(
        () => document.querySelector(".hj-army")?.dataset.massPhase === "giant",
        null,
        { timeout: 30000 },
      );
      assert.equal(await attr(army, "data-mass-arrived"), "100");
      const giantArt = page.locator(".adv-player svg[data-giant-parts]");
      assert.equal(await attr(giantArt, "data-giant-parts"), "12");
      assert.equal(await attr(giantArt, "data-giant-legends"), "6");
      assert.equal(await page.locator("[data-robot-actor]").count(), 0, "small robot went home");
      assert.equal((await saved()).robots.massFusions, 1);
      await page.screenshot({ path: `${out}/ra-at13-giant-fusion-${name}.png` });
      console.log(`PASS ${name} RA-AT-10/12/13 rally ${counts.join("→")} → 100/100 → one giant`);

      // RA-AT-21: frame times while the army is busy.
      r.giantFrames = await frameTimes(page, 2500);
      r.armyDom = (await visibleRobots()).length;

      // RA-AT-17: minions are beaten with real hits.
      await moveTo({ x: MINION_CAMP.x, y: MINION_CAMP.y - 260 }, 40);
      const minions = page.locator('[data-minion="active"]');
      for (let i = 0; i < 20 && (await minions.count()) > 0; i++) {
        await page.waitForTimeout(950);
        await btn("⚔ 거대 빔").click();
      }
      assert.equal(await minions.count(), 0);
      assert.equal((await saved()).robots.minionWaves, 1);
      await page.screenshot({ path: `${out}/ra-at17-small-enemy-${name}.png` });
      console.log(`PASS ${name} RA-AT-17 five minions beaten with the giant beam, paid once`);

      if (full) {
        // RA-AT-15/16: walk to the boss; out of range does nothing; dodge a slam; win.
        const boss = page.locator("[data-boss-phase]");
        await moveTo({ x: BOSS_ARENA.x + 900, y: BOSS_ARENA.y }, 40);
        await boss.first().waitFor();
        const shield0 = Number(await attr(boss, "data-boss-shield"));
        await page.waitForTimeout(950);
        await btn("⚔ 거대 빔").click();
        assert.ok((await page.locator(".adv-touch-hint").innerText()).includes("너무 멀어"));
        assert.equal(Number(await attr(boss, "data-boss-shield")), shield0);
        await moveTo({ x: BOSS_ARENA.x + 380, y: BOSS_ARENA.y }, 40);
        let dodged = false;
        let slams = 0;
        let hits = 0;
        for (let i = 0; i < 90; i++) {
          const phase = await attr(boss, "data-boss-phase");
          if (phase === "retreat") break;
          if (phase === "telegraph") {
            // Step out of the warning circle before the slam lands.
            const hp0 = Number(await attr(army, "data-giant-hp"));
            if (!dodged) await page.screenshot({ path: `${out}/ra-at16-boss-warning-${name}.png` });
            await g.step(0, slams % 2 ? 1 : -1, 750);
            slams++;
            // Out of the circle the boss is usually still in beam range: fire back.
            await btn("⚔ 거대 빔").click();
            await page.waitForFunction(
              () => document.querySelector("[data-boss-phase]")?.dataset.bossPhase !== "telegraph",
              null,
              { timeout: 5000 },
            );
            await page.waitForTimeout(150);
            if (Number(await attr(army, "data-giant-hp")) === hp0) dodged = true;
            continue;
          }
          const p = await g.position();
          const b = {
            x: Number(await attr(boss, "data-x")),
            y: Number(await attr(boss, "data-y")),
          };
          if (Math.hypot(wrap(b.x - p.x, 20400), wrap(b.y - p.y, 10800)) > 400)
            await moveTo({ x: b.x + 300, y: b.y }, 60, 6);
          // Wait out the beam cooldown while watching for the warning circle.
          let warned = false;
          for (let w = 0; w < 4 && !warned; w++) {
            await page.waitForTimeout(230);
            warned = (await attr(boss, "data-boss-phase")) === "telegraph";
          }
          if (warned) continue;
          const before =
            Number(await attr(boss, "data-boss-hp")) + Number(await attr(boss, "data-boss-shield"));
          await btn("⚔ 거대 빔").click();
          await page.waitForTimeout(80);
          const after =
            Number(await attr(boss, "data-boss-hp")) + Number(await attr(boss, "data-boss-shield"));
          if (after < before) hits++;
          if (hits === 3) await page.screenshot({ path: `${out}/ra-at16-boss-battle-${name}.png` });
        }
        assert.ok(dodged, `stepped out of a warning circle and took no damage (${slams} slams)`);
        assert.equal(
          await attr(boss, "data-boss-phase"),
          "retreat",
          `hits ${hits}, slams ${slams}, boss hp ${await attr(boss, "data-boss-hp")} shield ${await attr(boss, "data-boss-shield")}, giant ${await attr(army, "data-giant-hp")}, hint ${await page.locator(".adv-touch-hint").innerText()}`,
        );
        assert.equal(await attr(boss, "data-boss-hp"), "0");
        assert.ok(hits >= 8, `took ${hits} counted hits (plus hits right after dodging)`);
        const s = (await saved()).robots;
        assert.equal(s.bossWins, 1);
        console.log(
          `PASS tablet RA-AT-15/16 boss walked, warned, was dodged; ${hits} hits; retreat; paid once`,
        );
      }

      // RA-AT-14/18: split; reload keeps progress, pays nothing twice, robots go home.
      const before = (await saved()).robots;
      await btn("초대형 합체 풀기").click();
      await page.waitForFunction(() =>
        ["splitting", "returning"].includes(document.querySelector(".hj-army")?.dataset.massPhase),
      );
      // The robots burst out where the giant stood and walk home from there.
      await page.waitForFunction(
        () => document.querySelector(".hj-army")?.dataset.massPhase === "returning",
      );
      await page.waitForTimeout(300);
      const home = await visibleRobots();
      assert.ok(
        home.filter((x) => x.behavior === "returning").length >= 5,
        "robots walk home from here",
      );
      await page.reload({ waitUntil: "networkidle" });
      const after = await saved();
      assert.deepEqual(after.robots, before);
      assert.equal(after.version, 3);
      assert.equal(after.money, 3000);
      assert.ok(after.ownedCars.includes("car-021"));
      assert.equal(after.carUpgrades["car-021"].engine, true);
      assert.deepEqual(after.robots.cards["rb-police"], { uses: 3, grade: 1 });
      assert.equal(await attr(page.locator(".hj-army"), "data-mass-phase"), "idle");
      assert.equal(await attr(page.locator(".hj-army"), "data-army-unique"), "100");
      console.log(`PASS ${name} RA-AT-14/18 split and reload: progress kept, nothing paid twice`);

      if (full) {
        // Leaving by map in the middle of a rally calls it off: everyone walks home, nothing paid.
        await travel("🤖 군단 집결 광장");
        await btn("⌚ 시계").click();
        await page.getByRole("tab", { name: "🤖 군단" }).click();
        await btn("📣 100대 집결!").click();
        await page.waitForTimeout(1500);
        await travel(
          `${VILLAGES.findIndex((v) => v.id === "farm") + 1}. ${VILLAGES.find((v) => v.id === "farm").name}`,
        );
        await page.waitForTimeout(300);
        assert.equal(await attr(page.locator(".hj-army"), "data-mass-phase"), "returning");
        assert.equal((await saved()).robots.massFusions, before.massFusions);
        console.log("PASS tablet RA-AT-12 a rally left by map travel is called off, nothing paid");
      }

      // RA-AT-19/20: buttons on screen and finger-sized; watch tabs reachable; no text fields.
      await btn("⌚ 시계").click();
      for (const t of ["🃏 소환", "💥 합체", "🚨 출동", "🤖 군단", "⭐ 전설"]) {
        const box = await page.getByRole("tab", { name: t }).boundingBox();
        assert.ok(box && box.x >= 0 && box.x + box.width <= viewport.width && box.height >= 44, t);
      }
      await btn("소환 시계 닫기").click();
      for (const b of [btn("⌚ 시계"), btn("지도"), page.locator(".adv-interact")]) {
        const box = await b.boundingBox();
        assert.ok(box && box.x >= 0 && box.x + box.width <= viewport.width);
        assert.ok(box.y + box.height <= viewport.height && box.height >= 44);
      }
      assert.equal(await page.locator("input, textarea").count(), 0);
      r.walkFrames = await frameTimes(page, 2500);
      await page.screenshot({ path: `${out}/ra-at19-hud-${name}.png` });
      console.log(`PASS ${name} RA-AT-19/20 HUD and watch reachable, no text fields`);
      console.log(`INFO ${name} RA-AT-21 frames ${JSON.stringify(r)}`);
      await page.close();
    }
    fs.writeFileSync(`${out}/army-results.json`, JSON.stringify(results, null, 2));
    assert.deepEqual(errors, []);
    console.log("PASS no browser runtime errors");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
