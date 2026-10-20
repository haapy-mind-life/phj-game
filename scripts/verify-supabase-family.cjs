// Contract integration test: real supabase-js client, local fake HTTP/Phoenix service.
// This does not certify an actual Supabase project's configuration or network availability.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const url = process.env.PHJ_PREVIEW_URL || "http://127.0.0.1:4183/phj-game/";
const fixture = process.env.PHJ_FIXTURE_URL || "http://127.0.0.1:4194";
const out = process.env.PHJ_EVIDENCE_DIR || "/tmp/phj-supabase-evidence";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    headless: true,
    args: ["--no-sandbox"],
  });
  const pages = [],
    errors = [];
  try {
    async function pageFor(name, mobile = false) {
      const context = await browser.newContext({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1024, height: 900 },
        hasTouch: mobile,
      });
      const page = await context.newPage();
      pages.push(page);
      page.setDefaultTimeout(25000);
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(() =>
        localStorage.setItem(
          "hyunjun-game-v2",
          JSON.stringify({ version: 3, money: 50, ownedOutfits: ["witch"], outfit: "witch" }),
        ),
      );
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.locator(".hj-family-toggle").click();
      await page.getByRole("form", { name: "부모님 가족 계정 로그인" }).waitFor();
      if (mobile) await page.screenshot({ path: out + "/login-phone.png" });
      const nickname = { dad: "아빠", mom: "엄마", sister: "누나", hyunjun: "현준" }[name];
      if (!nickname) {
        // Inject another server-side identity to verify the membership boundary independently of the picker.
        await page.route("**/auth/v1/token?grant_type=password", (route) => {
          const body = route.request().postDataJSON();
          return route.continue({
            postData: JSON.stringify({ ...body, email: name + "@phj-game.invalid" }),
          });
        });
      }
      await page.getByRole("button", { name: nickname || "현준", exact: true }).click();
      assert.equal(await page.locator('.family-login input[type="email"]').count(), 0);
      await page.getByLabel("암호", { exact: true }).fill("246813");
      await page.getByRole("button", { name: "가족 계정 로그인", exact: true }).click();
      if (name !== "unlisted") {
        await page.waitForFunction(() => {
          const toggle = document.querySelector(".hj-family-toggle");
          return (
            /가족 \d+명/.test(toggle.textContent) &&
            toggle.getAttribute("aria-expanded") === "false"
          );
        });
        assert.equal(
          await page.locator(".hj-family-toggle").getAttribute("aria-expanded"),
          "false",
        );
        await page.locator(".hj-family-toggle").click();
        assert.equal(await page.getByRole("button", { name: "방 만들기", exact: true }).count(), 0);
        assert.equal(await page.getByLabel("방 코드", { exact: true }).count(), 0);
      }
      return { page, context };
    }
    const dad = await pageFor("dad");
    await dad.page.getByText("가족과 연결됐어요", { exact: true }).waitFor();
    await dad.page.waitForTimeout(6500);
    const mom = await pageFor("mom", true);
    await mom.page.getByText("가족과 연결됐어요", { exact: true }).waitFor();
    const logout = mom.page.getByRole("button", { name: "이 기기 로그아웃", exact: true });
    await logout.scrollIntoViewIfNeeded();
    assert.ok(
      await logout.evaluate((e) => {
        const r = e.getBoundingClientRect();
        return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      }),
      "phone family controls are above gameplay controls",
    );
    await dad.page.locator('[data-remote="엄마"]').first().waitFor();
    await mom.page.locator('[data-remote="아빠"]').first().waitFor();
    assert.equal(
      await dad.page
        .locator('[data-remote="엄마"] [data-avatar]')
        .first()
        .getAttribute("data-avatar"),
      "witch",
    );
    await mom.page.getByRole("button", { name: "가족방 닫기", exact: true }).click();
    const start = await dad.page
      .locator('[data-remote="엄마"]')
      .first()
      .evaluate((e) => parseFloat(e.style.left));
    await mom.page.keyboard.down("ArrowRight");
    await mom.page.waitForTimeout(900);
    await mom.page.keyboard.up("ArrowRight");
    await dad.page.waitForTimeout(600);
    const end = await dad.page
      .locator('[data-remote="엄마"]')
      .first()
      .evaluate((e) => parseFloat(e.style.left));
    assert.ok(end > start + 80, "movement crosses independent browser contexts");
    await mom.page.waitForTimeout(6500);
    assert.equal(
      await dad.page.locator('[data-remote="엄마"]').count(),
      1,
      "stationary heartbeat keeps the peer visible",
    );
    await mom.page.locator(".hj-family-toggle").click();
    for (let i = 0; i < 2; i++) {
      await mom.page.getByRole("button", { name: "인사 👋", exact: true }).click();
      await dad.page.locator('[data-remote="엄마"] .hj-remote-emote').first().waitFor();
      await dad.page.waitForTimeout(2400);
      assert.equal(await dad.page.locator('[data-remote="엄마"] .hj-remote-emote').count(), 0);
    }
    await mom.page.screenshot({ path: out + "/connected-phone.png" });
    await dad.page.screenshot({ path: out + "/connected-tablet.png" });
    console.log(
      "PASS automatic private family space, no room controls, late join, independent contexts, purchased outfit, idle heartbeat and repeated emote",
    );
    await mom.page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })),
    );
    await dad.page.locator('[data-remote="엄마"]').first().waitFor({ state: "detached" });
    await mom.page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })),
    );
    await mom.page.getByText("가족과 연결됐어요", { exact: true }).waitFor();
    await dad.page.locator('[data-remote="엄마"]').first().waitFor();
    console.log(
      "PASS page navigation leaves explicitly and back-cache restoration reconnects automatically",
    );
    await fetch(fixture + "/__fixture/disconnect", { method: "POST" });
    await mom.page.waitForTimeout(5000);
    await mom.page.getByText("가족과 연결됐어요", { exact: true }).waitFor();
    await dad.page.getByText("가족과 연결됐어요", { exact: true }).waitFor();
    await dad.page.locator('[data-remote="엄마"]').first().waitFor();
    console.log("PASS reconnect restores room and stationary avatars");
    await mom.page.getByRole("button", { name: "가족방 닫기", exact: true }).click();
    await mom.page.getByRole("button", { name: "지도", exact: true }).click();
    await mom.page.getByRole("button", { name: "1. 우리 마을", exact: true }).click();
    await mom.page.keyboard.down("ArrowUp");
    await mom.page.waitForTimeout(500);
    await mom.page.keyboard.up("ArrowUp");
    await mom.page.getByRole("button", { name: "우리 집 들어가기", exact: true }).click();
    await dad.page.waitForTimeout(800);
    assert.equal(
      await dad.page.locator('[data-remote="엄마"]').count(),
      0,
      "interiors do not leak avatars into the ground world",
    );
    await mom.page.getByRole("button", { name: "집 밖으로", exact: true }).click();
    await dad.page.locator('[data-remote="엄마"]').first().waitFor();
    await mom.context.close();
    await dad.page.waitForTimeout(1000);
    assert.equal(await dad.page.locator('[data-remote="엄마"]').count(), 0);
    const other = await pageFor("other");
    await other.page.getByText("가족과 연결됐어요", { exact: true }).waitFor();
    await other.page.waitForTimeout(3000);
    assert.equal(await other.page.locator("[data-remote]").count(), 0);
    assert.equal(await dad.page.locator("[data-remote]").count(), 0);
    await other.context.close();
    const unlisted = await pageFor("unlisted");
    await unlisted.page
      .getByText("부모님이 이 계정을 가족으로 등록해 주세요.", { exact: true })
      .waitFor();
    assert.equal(
      await unlisted.page.getByRole("button", { name: "방 만들기", exact: true }).count(),
      0,
    );
    await unlisted.context.close();
    console.log(
      "PASS interior visibility, immediate presence leave, automatic-space family separation and unenrolled-account denial",
    );
    await dad.page.reload();
    await dad.page.locator(".hj-family-toggle").click();
    await dad.page.getByText("가족과 연결됐어요", { exact: true }).waitFor();
    assert.equal(
      await dad.page.locator(".family-login").count(),
      0,
      "saved auth session survives reload",
    );
    await dad.page.getByRole("button", { name: "이 기기 로그아웃", exact: true }).click();
    await dad.page.locator(".family-login").waitFor();
    assert.equal(await dad.page.locator(".hj-wallet strong").innerText(), "50");
    const stats = await fetch(fixture + "/__fixture/stats").then((r) => r.json());
    assert.ok(stats.broadcasts > 10);
    assert.ok(stats.tracks < 30, "positions must not update presence at movement frequency");
    assert.deepEqual(errors, []);
    console.log(
      "PASS session restoration, local logout, unchanged game coins, no browser errors",
      JSON.stringify(stats),
    );
  } catch (e) {
    for (let i = 0; i < pages.length; i++)
      if (!pages[i].isClosed())
        await pages[i].screenshot({ path: out + "/failure-" + i + ".png" }).catch(() => {});
    throw e;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
