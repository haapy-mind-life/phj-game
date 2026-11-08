// Browser checks that open the root now meet the title screen first (every page load
// is a new app run). Press start like a child would and wait for the world.
// On any other route (e.g. #/house) this does nothing.
async function enterWorld(page, timeout = 15000) {
  const { hash, pathname } = new URL(page.url());
  if (hash ? !["#", "#/"].includes(hash) : !/\/(phj-game\/)?$/.test(pathname)) return;
  const entry = page.locator("[data-entry-phase]");
  const world = page.locator(".adv-interact");
  await entry.or(world).first().waitFor({ timeout });
  if ((await world.count()) > 0) return;
  const start = page.getByRole("button", { name: "게임 시작하겠습니다!", exact: true });
  if ((await start.count()) > 0) await start.click();
  await world.first().waitFor({ timeout });
}
module.exports = { enterWorld };
