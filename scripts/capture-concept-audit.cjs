// Read-only audit of a local preview, using an isolated save and an existing Chrome CDP endpoint.
// PLAYWRIGHT_CORE_PATH, PHJ_CDP_URL, PHJ_PREVIEW_URL and PHJ_EVIDENCE_DIR are configurable.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-concept-audit";
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4173/phj-game/";
const results = { transport: "Chrome DevTools Protocol", url, screens: [], errors: [], checks: [] };
fs.mkdirSync(path.join(out, "images"), { recursive: true });
(async () => {
  const browser = await chromium.connectOverCDP(process.env.PHJ_CDP_URL || "http://127.0.0.1:9222");
  results.browser = browser.version();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (e) => results.errors.push(e.message));
  const cdp = await context.newCDPSession(page);
  const btn = (name) => page.getByRole("button", { name, exact: true });
  const shot = async (id, note) => {
    await page.waitForTimeout(250);
    const data = await page.evaluate(() => {
      const visible = (e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
      };
      return {
        location: location.href,
        viewport: { width: innerWidth, height: innerHeight },
        bodyWidth: document.body.scrollWidth,
        text: document.body.innerText,
        buttons: [...document.querySelectorAll("button, [role=tab]")].filter(visible).map((e) => {
          const r = e.getBoundingClientRect();
          return {
            text: e.getAttribute("aria-label") || e.textContent.trim(),
            disabled: e.disabled,
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          };
        }),
        massPhase: document.querySelector(".hj-army")?.dataset.massPhase,
        robot: document.querySelector("[data-robot-card]")?.textContent,
        save: JSON.parse(localStorage.getItem("hyunjun-game-v2") || "null"),
      };
    });
    const { data: png } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    fs.writeFileSync(path.join(out, "images", id + ".png"), Buffer.from(png, "base64"));
    results.screens.push({ id, note, ...data });
    fs.writeFileSync(path.join(out, "browser-results.json"), JSON.stringify(results, null, 2));
    console.log("CAPTURE " + id);
  };
  const travel = async (label) => {
    await btn("지도").click();
    await btn(label).click();
  };
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await shot("01-first-phone", "Fresh save, default start, portrait phone");
    await btn("지도").click();
    await shot("02-map-phone", "World map, destination list and geography");
    await btn("닫기").click();
    await btn("⌚ 시계").click();
    for (const [tab, id] of [
      ["🃏 소환", "03-watch-summon-phone"],
      ["💥 합체", "04-watch-fuse-phone"],
      ["🚨 출동", "05-watch-mission-phone"],
      ["🤖 군단", "06-watch-army-phone"],
      ["⭐ 전설", "07-watch-legend-phone"],
    ]) {
      await page.getByRole("tab", { name: tab }).click();
      await shot(id, tab);
    }
    await page.getByRole("tab", { name: "🃏 소환" }).click();
    await btn("✨ 경찰 로봇 소환!").click();
    await page.waitForTimeout(1200);
    await shot("08-robot-ride-phone", "Default robot riding and HUD");
    await travel("🤖 군단 집결 광장");
    await btn("⌚ 시계").click();
    await page.getByRole("tab", { name: "🤖 군단" }).click();
    await btn("📣 100대 집결!").click();
    await page.waitForTimeout(2500);
    await shot("09-rally-phone", "Rally with a previously summoned small robot");
    // Wait for real arrival and assembly; do not inject completion state.
    await page.waitForFunction(
      () => document.querySelector(".hj-army")?.dataset.massPhase === "giant",
      null,
      { timeout: 30000 },
    );
    await shot("10-giant-phone", "Giant formation, controls and navigation");
    await page.setViewportSize({ width: 844, height: 390 });
    await shot("11-giant-landscape", "Rotate into short landscape while riding giant");
    await page.setViewportSize({ width: 1280, height: 900 });
    await shot("12-giant-tablet", "Giant on tablet");
    await btn("초대형 합체 풀기").click();
    await page.waitForTimeout(2500);
    await travel("🌊 바닷가 · 푸드트럭");
    await shot("13-coast-tablet", "Coast after leaving giant");
    await travel("✈️ 비행장 · 섬 여행");
    await shot("14-airport-tablet", "Airport destination");
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [route, id] of [
      ["house", "15-legacy-house-phone"],
      ["greenhouse", "16-farm-phone"],
      ["race", "17-runner-phone"],
    ]) {
      await page.goto(url + "#/" + route, { waitUntil: "networkidle" });
      await page
        .locator("h1")
        .filter({
          hasText: route === "house" ? "포근한 집" : route === "greenhouse" ? "농장" : "러너",
        })
        .waitFor();
      await shot(id, "Existing hash route /" + route);
    }
    await page.goto(url, { waitUntil: "networkidle" });
    await page.setViewportSize({ width: 320, height: 568 });
    await shot("18-small-phone", "Small portrait viewport");
    await btn("⌚ 시계").click();
    await shot("19-watch-small-phone", "Watch on small viewport");
    console.log(JSON.stringify({ screens: results.screens.length, errors: results.errors }));
  } finally {
    fs.writeFileSync(path.join(out, "browser-results.json"), JSON.stringify(results, null, 2));
    await context.close();
    // Disconnect from external Chrome; do not close someone else's browser.
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
