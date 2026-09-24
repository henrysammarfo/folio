import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
const out = "/opt/cursor/artifacts";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

await page.goto(base + "/desk", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector('[data-testid="netro-density-surface"]', { timeout: 20000 });

// Dismiss cookie banner if present
const cookieBtn = page.getByRole("button", { name: /Essential only|Accept/i }).first();
if (await cookieBtn.isVisible().catch(() => false)) {
  await cookieBtn.click();
  await page.waitForTimeout(300);
}

// Wait for FOLIO mark + TradingView
await page.waitForSelector(".netro-density-chart-mark", { timeout: 10000 });
await page.waitForTimeout(2500);

await page.locator('[data-testid="netro-truth-strip"]').screenshot({
  path: `${out}/netro-overview-chart-watermark.png`,
});
console.log("OK chart-watermark");

await page.screenshot({ path: `${out}/netro-overview-desk.png`, fullPage: false });
console.log("OK desk");

// Buy sheet details
await page.getByTestId("netro-buy-sheet").waitFor({ timeout: 10000 });
const toggle = page.getByTestId("netro-buy-sheet-toggle");
if ((await toggle.getAttribute("aria-expanded")) === "false") {
  await toggle.click();
}
await page.waitForTimeout(400);
await page.locator("#netro-right-column").screenshot({
  path: `${out}/netro-overview-buy-sheet.png`,
});
console.log("OK buy-sheet");

// Acquire Buy desk watermark
await page.goto(base + "/desk/acquire", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector(".fx-buy-chart-mark", { timeout: 15000 });
await page.waitForTimeout(2000);
const cookie2 = page.getByRole("button", { name: /Essential only|Accept/i }).first();
if (await cookie2.isVisible().catch(() => false)) {
  await cookie2.click();
}
await page.locator(".fx-buy-chart").screenshot({
  path: `${out}/netro-acquire-chart-watermark.png`,
});
console.log("OK acquire-watermark");

await browser.close();
console.log("DONE");
