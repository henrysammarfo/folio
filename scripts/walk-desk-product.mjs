import { chromium } from "playwright";
const base = "http://127.0.0.1:4175";
const browser = await chromium.launch({
  headless: false,
  args: ["--start-maximized"],
  env: { ...process.env, DISPLAY: ":1" },
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const paths = [
  "/desk/positions",
  "/desk/credit",
  "/desk/acquire",
  "/desk/activity",
  "/desk/settings",
  "/desk/settings?wall=ops",
];
for (const p of paths) {
  await page.goto(base + p, { waitUntil: "domcontentloaded", timeout: 60000 });
  const btn = page.getByRole("button", { name: /essential only/i });
  if (await btn.count()) await btn.click().catch(() => {});
  await page.waitForTimeout(1400);
}
await page.waitForTimeout(800);
await browser.close();
