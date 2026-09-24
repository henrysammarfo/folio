import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const out = "/opt/cursor/artifacts";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

async function goto(path) {
  await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1800);
}

await goto("/desk/acquire");
await page.getByTestId("acquire-settings").click({ timeout: 15000 });
await page.waitForSelector('[data-testid="acquire-settings-sheet"]', { timeout: 10000 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/netro-depth-buy-settings.png`, fullPage: false });
console.log("OK buy-settings");
await page.getByRole("button", { name: "Done" }).click();
await page.waitForTimeout(300);
await page.locator(".fx-swap-sheet-toggle").click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/netro-depth-buy-details.png`, fullPage: false });
console.log("OK buy-details");

await goto("/desk/markets");
await page.waitForSelector('[data-testid="markets-flow-strip"]', { timeout: 20000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/netro-depth-markets-flow.png`, fullPage: false });
console.log("OK markets-flow");

await goto("/desk");
await page.waitForSelector('[data-testid="netro-density-surface"]', { timeout: 20000 });
await page.waitForTimeout(1200);
const flow = page.getByTestId("netro-markets-flow");
if (await flow.count()) {
  const icons = flow.locator(".netro-density-flow-icon");
  if ((await icons.count()) > 1) {
    await icons.nth(1).click();
    await page.waitForTimeout(900);
  }
}
await page.screenshot({ path: `${out}/netro-depth-overview-flow.png`, fullPage: false });
console.log("OK overview-flow");

const expand = page.getByTestId("netro-ai-expand");
if (await expand.count()) {
  await expand.click();
  await page.waitForSelector('[data-testid="netro-ai-modal"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/netro-depth-ai-modal.png`, fullPage: false });
  console.log("OK ai-modal");
} else {
  console.log("SKIP ai-modal (paper agent expand not mounted)");
}

await browser.close();
console.log("DONE");
