import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await page.goto("http://127.0.0.1:3000/desk", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector(".netro-density-chart-mark", { timeout: 20000 });
const btn = page.getByRole("button", { name: /Essential only|Accept/i }).first();
if (await btn.isVisible().catch(() => false)) await btn.click();
await page.waitForTimeout(3500);
await page.locator('[data-testid="netro-truth-strip"]').screenshot({
  path: `${out}/folio-tv-light-watermark.png`,
});
await page.screenshot({ path: `${out}/folio-desk-light-chart.png`, fullPage: false });
console.log("theme", await page.locator(".folio-tv-chart").evaluate(() => {
  const iframe = document.querySelector(".tradingview-widget-container iframe");
  return { mark: !!document.querySelector(".netro-density-chart-mark"), bg: getComputedStyle(document.querySelector(".netro-density-chart")).backgroundColor };
}));
await browser.close();
console.log("DONE");
