import { chromium } from "playwright";
const base = "http://127.0.0.1:4174";
const out = "/opt/cursor/artifacts";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

async function shot(path, name) {
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  const file = `${out}/desk-product-${name}.png`;
  await page.screenshot({ path: file, fullPage: false });
  const body = (await page.locator("body").innerText()).toLowerCase();
  console.log(`OK ${name}`);
  return body;
}

const positions = await shot("/desk/positions", "positions");
const credit = await shot("/desk/credit", "credit");
await shot("/desk/acquire", "acquire");
try {
  await page.getByTestId("acquire-continue").click({ timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${out}/desk-product-acquire-review.png`, fullPage: false });
  console.log("OK acquire-review");
} catch (e) {
  console.log("acquire-review skip", e.message);
}
const activity = await shot("/desk/activity", "activity");
const settings = await shot("/desk/settings", "settings");
const ops = await shot("/desk/settings?ops=1", "settings-ops");

console.log(JSON.stringify({
  positionsOk: /holdings|estimated|wallet|aapl|on-chain/.test(positions),
  creditOk: /borrow|ltv|nestusd|nest\.credit|paused|coming soon/.test(credit),
  settingsNoOps: !/bitquery_api_key|production readiness|run paper agent/.test(settings),
  settingsWallet: /wallet|account|sign in|corporate-action/.test(settings),
  opsKeys: /production readiness|bitquery|paper agent|folio_session_secret/.test(ops),
  activityOk: /activity|share count|on-chain|corporate-action|buy quote/.test(activity),
}, null, 2));
await browser.close();
