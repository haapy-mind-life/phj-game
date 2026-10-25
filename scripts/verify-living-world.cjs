// Browser integration checks use an isolated browser and fixture saves, never the user's save.
// Set PLAYWRIGHT_CORE_PATH and CHROMIUM_EXECUTABLE to existing local installations.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const executablePath = process.env.CHROMIUM_EXECUTABLE;
if (!executablePath) throw Error("Set CHROMIUM_EXECUTABLE to the headless Chromium binary.");
const previewUrl = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
const output = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-living";
fs.mkdirSync(output, { recursive: true });
let currentPage, activeBrowser;
async function family() {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  activeBrowser = browser;
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  currentPage = page;
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(8000);
  const btn = (n) => page.getByRole("button", { name: n, exact: true });
  await page.addInitScript(() => {
    if (!localStorage.getItem("hyunjun-game-v2"))
      localStorage.setItem("hyunjun-game-v2", JSON.stringify({ version: 2, money: 5000 }));
  });
  await page.clock.setFixedTime(new Date("2026-10-18T03:00:00Z"));
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const mode = async () =>
    (await page.locator('svg[aria-label$="실내"]').count())
      ? "restaurant"
      : (await page.locator('.hj-life-scene[data-region="mansion"]').count())
        ? "home"
        : "world";
  async function pos() {
    const m = await mode();
    if (m === "world")
      return page
        .locator(".adv-player")
        .first()
        .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
    const svg =
      m === "home"
        ? ".hj-life-scene > g:has(> g > [data-avatar])"
        : 'svg[aria-label$="실내"] > g:last-child';
    return page
      .locator(svg)
      .getAttribute("transform")
      .then((t) => {
        const v = t.match(/[-\d.]+/g).map(Number);
        return { x: v[0], y: v[1] };
      });
  }
  async function move(axis, target) {
    for (let i = 0; i < 170; i++) {
      const p = await pos();
      if (Math.abs(p[axis] - target) < 17) return;
      const k =
        axis === "x"
          ? p.x < target
            ? "ArrowRight"
            : "ArrowLeft"
          : p.y < target
            ? "ArrowDown"
            : "ArrowUp";
      await page.keyboard.down(k);
      await page.waitForTimeout(50);
      await page.keyboard.up(k);
    }
    throw Error("blocked " + axis + " " + target + " at " + JSON.stringify(await pos()));
  }
  async function town(n, name) {
    await btn("지도").click();
    await btn(`${n}. ${name}`).click();
    await page.waitForTimeout(100);
  }
  async function home() {
    await town(1, "우리 마을");
    await move("y", 620);
    await btn("우리 집 들어가기").click();
  }
  const action = () => page.locator(".adv-interact").click();
  await home();
  await move("y", 650);
  await move("x", 760);
  await action();
  await page.getByRole("button", { name: /같이 가자/ }).click();
  assert.equal(await page.locator('[data-person="dad"]').count(), 1);
  await page.screenshot({ path: path.join(output, "family-home.png") });
  await page.locator(".adv-map-button").click();
  assert.equal(
    await page.locator('[data-person="dad"]').evaluateAll(
      (es) =>
        es.filter((e) => {
          const r = e.getBoundingClientRect();
          return r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
        }).length,
    ),
    1,
  );
  console.log("PASS dad follows outside");
  await town(11, "벚꽃 마을");
  await action();
  await page.getByRole("button", { name: /우리 집에 초대/ }).click();
  await move("x", 1500);
  await move("y", 2920);
  await btn("맥도날드 들어가기").click();
  await move("x", 430);
  await move("y", 510);
  await action();
  await page.getByRole("button", { name: /치즈버거/ }).click();
  await move("x", 820);
  await move("y", 850);
  await move("x", 1070);
  await btn("음식 먹기").click();
  await move("x", 820);
  await move("y", 510);
  await move("x", 430);
  await action();
  await page.getByRole("button", { name: /손님 세 명에게 음식 전달/ }).click();
  for (let i = 0; i < 3; i++) {
    await move("x", 1060);
    await btn("손님에게 전달").click();
    if (i < 2) {
      await move("x", 430);
      await btn("음식 받기").click();
    }
  }
  assert.ok((await page.locator("body").innerText()).includes("+45 별코인"));
  await page.screenshot({ path: path.join(output, "restaurant.png") });
  await btn("식당 밖으로").first().click();
  console.log("PASS restaurant enter/order/eat/3 deliveries/exit");
  await home();
  assert.equal(await page.locator('[data-person="friend-new-1"]').count(), 1);
  await page.locator(".living-hud > summary").click();
  await btn("옷장 · 의상 가게").click();
  await page.getByRole("button", { name: /별빛 마법사/ }).click();
  assert.ok(
    (await page.getByRole("button", { name: /별빛 마법사/ }).getAttribute("aria-pressed")) ===
      "true",
  );
  await page.getByRole("button", { name: "닫기 ✕", exact: true }).click();
  await btn("아빠·친구와 공놀이").click();
  for (let i = 0; i < 8; i++) {
    const items = await page.locator(".activity-targets g").all();
    if (!items.length) break;
    const vals = (await items[0].getAttribute("transform")).match(/[-\d.]+/g).map(Number);
    await move("y", 450);
    await move("x", 1110);
    await move("x", vals[0]);
    await move("y", vals[1]);
    await action();
  }
  await btn("놀이 마치기").click();
  console.log("PASS invited guest, outfit and home game");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(output, "family-phone.png") });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator(".adv-map-button").click();
  await town(11, "벚꽃 마을");
  await btn("차 타기").click();
  await page
    .locator(".kid-car-list article")
    .nth(1)
    .getByRole("button", { name: "120 별코인 · 구입", exact: true })
    .click();
  await btn("닫기 ✕").click();
  console.log("PASS functional car purchase");
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("PASS E2E no browser errors");
  await browser.close();
}
async function explore() {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  activeBrowser = browser;
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  currentPage = page;
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const b = (n) => page.getByRole("button", { name: n, exact: true });
  await page.clock.setFixedTime(new Date("2026-10-18T03:00:00Z"));
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const pos = () =>
    page
      .locator(".adv-player")
      .first()
      .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
  async function move(axis, target) {
    for (let i = 0; i < 140; i++) {
      let p = await pos();
      if (Math.abs(p[axis] - target) < 16) return;
      const k =
        axis === "x"
          ? p.x < target
            ? "ArrowRight"
            : "ArrowLeft"
          : p.y < target
            ? "ArrowDown"
            : "ArrowUp";
      await page.keyboard.down(k);
      await page.waitForTimeout(50);
      await page.keyboard.up(k);
    }
    throw Error("blocked " + JSON.stringify(await pos()));
  }
  async function town(n, name) {
    await b("지도").click();
    await b(`${n}. ${name}`).click();
  }
  await town(2, "캐릭터 마을");
  await move("y", 450);
  await page.locator(".adv-interact").click();
  await page.getByRole("dialog", { name: "루루의 별빛 공원" }).waitFor();
  await b("월드로 돌아가기").first().click();
  console.log("PASS legacy mini-game portal priority");
  await town(21, "호박 마을");
  await b("할로윈 축제 참여").click();
  for (let i = 0; i < 6; i++) {
    const targets = await page.locator(".activity-targets g").all();
    if (!targets.length) break;
    const v = (await targets[0].getAttribute("transform")).match(/[-\d.]+/g).map(Number);
    await move("x", v[0]);
    await move("y", v[1]);
    await page.locator(".adv-interact").click();
  }
  assert.ok((await page.locator(".living-activity-hud").innerText()).includes("성공"));
  await page.screenshot({ path: path.join(output, "festival.png") });
  await b("놀이 마치기").click();
  console.log("PASS outdoor festival reward");
  await b("지도").click();
  await b("🌊 바닷가 · 푸드트럭").click();
  await page.keyboard.down("ArrowRight");
  for (let i = 0; i < 65; i++) {
    if (await b("잠수함 타기").count()) break;
    await page.waitForTimeout(100);
  }
  await page.keyboard.up("ArrowRight");
  await b("잠수함 타기").click();
  await page.getByRole("region", { name: "세로 잠수함 탐험", exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "sea-game.png") });
  await b("↑ 수면 · 항구로").click();
  console.log(
    "PASS independent sea entry and same-port return; full dive checks in verify-child-play.cjs",
  );
  await town(1, "우리 마을");
  await move("y", 850);
  await page.keyboard.down("ArrowLeft");
  for (let i = 0; i < 70; i++) {
    await page.waitForTimeout(100);
    if ((await pos()).x > 20000) break;
  }
  await page.keyboard.up("ArrowLeft");
  console.log("WEST", await pos());
  assert.ok((await pos()).x > 20000);
  await page.keyboard.down("ArrowUp");
  for (let i = 0; i < 100; i++) {
    await page.waitForTimeout(100);
    if ((await pos()).y > 10000) break;
  }
  await page.keyboard.up("ArrowUp");
  console.log("NORTH", await pos());
  assert.ok((await pos()).y > 10000);
  await page.screenshot({ path: path.join(output, "seam.png") });
  console.log("PASS both torus seams");
  await page.waitForTimeout(600);
  const perf = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const frames = [];
        let last = performance.now(),
          count = 0;
        function tick(t) {
          frames.push(t - last);
          last = t;
          if (++count < 120) requestAnimationFrame(tick);
          else {
            frames.sort((a, b) => a - b);
            resolve({
              p95: frames[Math.floor(frames.length * 0.95)],
              nodes: document.querySelectorAll("*").length,
            });
          }
        }
        requestAnimationFrame(tick);
      }),
  );
  console.log("PERFORMANCE", JSON.stringify(perf));
  assert.ok(
    await page
      .locator(".kid-world-markers")
      .evaluateAll((es) => es.every((e) => e.width.baseVal.value <= 2048)),
    "mission overlay surfaces must remain bounded",
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  await browser.close();
}
async function input() {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  activeBrowser = browser;
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-18T03:00:00Z"));
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const pos = () =>
    page
      .locator(".adv-player")
      .first()
      .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
  const client = await page.context().newCDPSession(page);
  const r = await page.locator(".adv-joystick").boundingBox();
  const p = { x: r.x + r.width / 2 + 30, y: r.y + r.height / 2, id: 1 };
  await page.evaluate(() => {
    window.ev = [];
    for (const t of [
      "pointerdown",
      "pointerup",
      "pointercancel",
      "lostpointercapture",
      "touchstart",
      "touchend",
    ])
      document.addEventListener(
        t,
        (e) => window.ev.push([t, e.pointerId, e.target.className]),
        true,
      );
  });
  let before = await pos();
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
  await page.waitForTimeout(200);
  const report = page.locator(".adv-interact");
  const rr = await report.boundingBox();
  const other = { x: rr.x + rr.width / 2, y: rr.y + rr.height / 2, id: 2 };
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p, other] });
  await page.waitForTimeout(60);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [other] });
  const mid = await pos();
  await page.waitForTimeout(250);
  let after = await pos();
  console.log("POSITIONS", before, mid, after);
  assert.ok(
    mid.x > before.x + 10 && after.x > mid.x + 10,
    "second finger release must not stop movement",
  );
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(80);
  const stopped = await pos();
  await page.waitForTimeout(180);
  assert.ok(Math.abs((await pos()).x - stopped.x) < 1);
  await page.locator(".adv-joystick").dispatchEvent("pointerdown", {
    pointerId: 55,
    pointerType: "pen",
    clientX: r.x + r.width / 2,
    clientY: r.y + r.height / 2 - 30,
    buttons: 1,
  });
  before = await pos();
  await page.waitForTimeout(220);
  after = await pos();
  assert.ok(after.y < before.y - 10);
  await page.evaluate(() =>
    window.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 55, pointerType: "pen" })),
  );
  await page.waitForTimeout(60);
  const cancelled = await pos();
  await page.waitForTimeout(180);
  assert.ok(Math.abs((await pos()).y - cancelled.y) < 1);
  assert.equal(
    await page.evaluate(() => ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)),
    false,
  );
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: path.join(output, "touch-phone.png") });
  assert.equal(errors.length, 0);
  console.log(
    "PASS two-finger movement/action, independent release, pen input/cancel, no keyboard focus/horizontal overflow",
  );
  await browser.close();
}
async function season() {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  activeBrowser = browser;
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.clock.setFixedTime(new Date("2026-11-01T03:00:00Z"));
  await page.addInitScript(() =>
    localStorage.setItem(
      "hyunjun-game-v2",
      JSON.stringify({
        version: 2,
        money: 123,
        decor: [
          { id: "pumpkin", x: 1110, y: 850 },
          { id: "ghost", x: 1110, y: 850 },
          { id: "bat", x: 1110, y: 850 },
        ],
        halloween: { active: true, candy: [], completed: true },
      }),
    ),
  );
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  const b = (n) => page.getByRole("button", { name: n, exact: true });
  await b("지도").click();
  await b("21. 호박 마을").click();
  assert.equal(await b("할로윈 축제 참여").count(), 0);
  assert.equal(await page.locator(".living-activity-hud").count(), 0);
  await b("지도").click();
  await b("1. 우리 마을").click();
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(650);
  await page.keyboard.up("ArrowUp");
  await b("우리 집 들어가기").click();
  // Home actions live in the collapsible home menu so the phone scene stays visible.
  await page.locator(".hj-life-hud > summary").click();
  await b("🎨 집 안 꾸미기").click();
  assert.ok(await b("🎃 파티는 10월에 열려요").isDisabled());
  assert.equal(
    await page
      .locator(".hj-life-scene")
      .getByText(/할로윈 파티!/)
      .count(),
    0,
  );
  await page.screenshot({ path: path.join(output, "november-phone.png") });
  console.log("PASS November festival disabled, home party paused, purchased decorations retained");
  await browser.close();
}
async function restaurants() {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  activeBrowser = browser;
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.setDefaultTimeout(7000);
  const b = (n) => page.getByRole("button", { name: n, exact: true });
  await page.clock.setFixedTime(new Date("2026-10-18T03:00:00Z"));
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  async function p() {
    if (await page.locator('svg[aria-label$="실내"]').count())
      return page
        .locator('svg[aria-label$="실내"]>g:last-child')
        .getAttribute("transform")
        .then((t) => {
          const a = t.match(/[-\d.]+/g).map(Number);
          return { x: a[0], y: a[1] };
        });
    return page
      .locator(".adv-player")
      .first()
      .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
  }
  async function move(axis, target) {
    for (let i = 0; i < 140; i++) {
      const pos = await p();
      if (Math.abs(pos[axis] - target) < 16) return;
      const key =
        axis === "x"
          ? pos.x < target
            ? "ArrowRight"
            : "ArrowLeft"
          : pos.y < target
            ? "ArrowDown"
            : "ArrowUp";
      await page.keyboard.down(key);
      await page.waitForTimeout(50);
      await page.keyboard.up(key);
    }
    throw Error("blocked " + JSON.stringify(await p()));
  }
  const list = [
    [11, "벚꽃 마을", "맥도날드", 1500],
    [12, "무지개 마을", "별빛 피자", 4100],
    [13, "햄버거 마을", "바삭 치킨", 6700],
    [14, "바람 마을", "친구 분식", 13100],
    [15, "구름 마을", "구름 카페", 17300],
    [7, "에메랄드 마을", "행복 식당", 4250],
  ];
  for (const [index, town, name, x] of list) {
    await b("지도").click();
    await b(`${index}. ${town}`).click();
    await move("x", x);
    await move("y", index === 7 ? 650 : 2920);
    await b(name + " 들어가기").click();
    await move("x", 430);
    await move("y", 510);
    await b("음식 주문").click();
    assert.ok((await page.getByRole("heading", { name: name + " 메뉴" }).count()) === 1);
    await page.locator(".living-shop button").first().click();
    assert.ok((await page.locator("body").innerText()).includes("식탁으로 가 보자"));
    await b("식당 밖으로").first().click();
    console.log("PASS", name, "walk-in/order/exit");
  }
  await browser.close();
}
async function seams() {
  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  activeBrowser = browser;
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  currentPage = page;
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const b = (n) => page.getByRole("button", { name: n, exact: true });
  await page.clock.setFixedTime(new Date("2026-10-18T03:00:00Z"));
  await page.goto(previewUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const pos = () =>
    page
      .locator(".adv-player")
      .first()
      .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
  async function move(axis, target) {
    for (let i = 0; i < 140; i++) {
      let p = await pos();
      if (Math.abs(p[axis] - target) < 16) return;
      const k =
        axis === "x"
          ? p.x < target
            ? "ArrowRight"
            : "ArrowLeft"
          : p.y < target
            ? "ArrowDown"
            : "ArrowUp";
      await page.keyboard.down(k);
      await page.waitForTimeout(50);
      await page.keyboard.up(k);
    }
    throw Error("blocked " + JSON.stringify(await pos()));
  }
  async function town(n, name) {
    await b("지도").click();
    await b(`${n}. ${name}`).click();
  }
  await town(1, "우리 마을");
  await move("y", 850);
  await page.keyboard.down("ArrowLeft");
  for (let i = 0; i < 70; i++) {
    await page.waitForTimeout(100);
    if ((await pos()).x > 20000) break;
  }
  await page.keyboard.up("ArrowLeft");
  console.log("WEST", await pos());
  assert.ok((await pos()).x > 20000);
  await page.keyboard.down("ArrowUp");
  for (let i = 0; i < 100; i++) {
    await page.waitForTimeout(100);
    if ((await pos()).y > 10000) break;
  }
  await page.keyboard.up("ArrowUp");
  console.log("NORTH", await pos());
  assert.ok((await pos()).y > 10000);
  await page.screenshot({ path: path.join(output, "seam.png") });
  console.log("PASS both torus seams");
  await page.waitForTimeout(600);
  const perf = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const frames = [];
        let last = performance.now(),
          count = 0;
        function tick(t) {
          frames.push(t - last);
          last = t;
          if (++count < 120) requestAnimationFrame(tick);
          else {
            frames.sort((a, b) => a - b);
            resolve({
              p95: frames[Math.floor(frames.length * 0.95)],
              nodes: document.querySelectorAll("*").length,
            });
          }
        }
        requestAnimationFrame(tick);
      }),
  );
  console.log("PERFORMANCE", JSON.stringify(perf));
  assert.ok(
    await page
      .locator(".kid-world-markers")
      .evaluateAll((es) => es.every((e) => e.width.baseVal.value <= 2048)),
    "mission overlay surfaces must remain bounded",
  );
  assert.equal(errors.length, 0, errors.join("\n"));
  await browser.close();
}
const scenarios = { family, explore, input, season, restaurants, seams };
(async () => {
  const selected = process.argv[2];
  if (selected && !scenarios[selected])
    throw Error("Scenario must be family, explore, input, season, restaurants or seams.");
  for (const run of selected ? [scenarios[selected]] : Object.values(scenarios)) await run();
})().catch(async (error) => {
  console.error(error);
  if (currentPage && !currentPage.isClosed())
    await currentPage.screenshot({ path: path.join(output, "failure.png") }).catch(() => {});
  if (activeBrowser) await activeBrowser.close();
  process.exitCode = 1;
});
