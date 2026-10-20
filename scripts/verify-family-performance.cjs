// Two independent browsers against the local Auth/Realtime fixture; no real credentials required.
// Set PHJ_CPU_RATE/PHJ_MIN_FPS for a normal or CPU-throttled regression budget.
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    args: ["--no-sandbox"],
  });
  try {
    const pages = [];
    for (const nickname of ["아빠", "현준"]) {
      const c = await b.newContext({ viewport: { width: 390, height: 844 } });
      const p = await c.newPage();
      p.setDefaultTimeout(20000);
      await p.goto(process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4192/phj-game/", {
        waitUntil: "domcontentloaded",
      });
      await p.locator(".hj-family-toggle").click();
      await p.getByRole("button", { name: nickname, exact: true }).click();
      await p.getByLabel("암호", { exact: true }).fill(process.env.PHJ_TEST_PIN || "2468");
      await p.getByRole("button", { name: "가족 계정 로그인", exact: true }).click();
      await p.waitForFunction(() =>
        /가족 \d+명/.test(document.querySelector(".hj-family-toggle")?.textContent || ""),
      );
      if ((await p.locator(".hj-family-toggle").getAttribute("aria-expanded")) === "true")
        await p.locator(".hj-family-toggle").click();
      pages.push(p);
    }
    const p = pages[0];
    await p.locator('[data-remote="현준"]').first().waitFor();
    const cdp = await p.context().newCDPSession(p);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: Number(process.env.PHJ_CPU_RATE || 4),
    });
    const results = {};
    for (const mode of ["idle", "moving"]) {
      const before = await cdp.send("Performance.getMetrics");
      const start = await p
        .locator(".adv-player:not(.hj-remote)")
        .first()
        .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
      if (mode === "moving") await p.keyboard.down("ArrowDown");
      const sample = await p.evaluate(
        () =>
          new Promise((resolve) => {
            let begin = performance.now(),
              last = begin;
            const frames = [],
              long = [];
            const obs = new PerformanceObserver((l) =>
              long.push(...l.getEntries().map((e) => e.duration)),
            );
            obs.observe({ type: "longtask", buffered: false });
            function frame(t) {
              frames.push(t - last);
              last = t;
              if (t - begin < 3500) requestAnimationFrame(frame);
              else {
                obs.disconnect();
                frames.sort((a, b) => a - b);
                resolve({
                  fps: (frames.length * 1000) / (t - begin),
                  p95: frames[Math.floor(frames.length * 0.95)],
                  max: Math.max(...frames),
                  longTasks: long.length,
                  longMs: long.reduce((a, b) => a + b, 0),
                  nodes: document.querySelectorAll("*").length,
                  avatars: document.querySelectorAll("[data-avatar]").length,
                });
              }
            }
            requestAnimationFrame(frame);
          }),
      );
      if (mode === "moving") await p.keyboard.up("ArrowDown");
      const end = await p
        .locator(".adv-player:not(.hj-remote)")
        .first()
        .evaluate((e) => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
      const after = await cdp.send("Performance.getMetrics");
      const get = (m, n) => m.metrics.find((x) => x.name === n)?.value || 0;
      results[mode] = {
        ...sample,
        moved: Math.hypot(end.x - start.x, end.y - start.y),
        scriptMs: (get(after, "ScriptDuration") - get(before, "ScriptDuration")) * 1000,
        taskMs: (get(after, "TaskDuration") - get(before, "TaskDuration")) * 1000,
      };
    }
    console.log(JSON.stringify(results, null, 2));
    if (process.env.PHJ_PERF_OUTPUT)
      fs.writeFileSync(process.env.PHJ_PERF_OUTPUT, JSON.stringify(results, null, 2));
    // Stress profile: minimum 15fps at 4x CPU throttle; normal-speed runs use a higher explicit budget.
    if (results.moving.fps < Number(process.env.PHJ_MIN_FPS || 15))
      throw new Error(
        "Family movement must sustain the configured minimum FPS at the configured CPU throttle",
      );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
