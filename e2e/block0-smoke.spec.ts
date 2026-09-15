import { test, expect } from "@playwright/test";

test.describe("FOLIO Block 0 smoke", () => {
  test("home renders brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/FOLIO/i).first()).toBeVisible();
  });

  test("truth page shows live or unavailable multiplier (never fixture 4.0×)", async ({
    page,
  }) => {
    await page.goto("/truth");
    await expect(page.getByText(/FOLIO|truth|multiplier|Scaled/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/\b4\.0000\s*×/);
    expect(body).not.toMatch(/\b4\.0\s*x\b/i);
  });

  test("acquire stays fail-closed on wash without Bitquery", async ({ page }) => {
    await page.goto("/desk/acquire");
    await expect(page.getByText(/acquire|quote|wash|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });

    // Enter checks step if the first Continue is enabled
    const step1 = page.getByRole("button", { name: /^Continue$/i }).first();
    if (await step1.isEnabled().catch(() => false)) {
      await step1.click();
      await page.getByText(/wash|checks|policy|gate|fail-closed/i).first().waitFor({
        timeout: 30_000,
      });
    }

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/wash|fail|blocked|unavailable|bitquery|quote|check/);
    // Named env on checks — no silent wash fallback
    expect(body).toMatch(/bitquery_api_key/);

    // Under wash fail-closed, advancing to review must be blocked
    const advance = page.getByRole("button", { name: /continue|blocked|fail-closed/i }).first();
    if (await advance.count()) {
      const label = (await advance.innerText()).toLowerCase();
      if (/blocked|fail-closed/.test(label)) {
        expect(label).toMatch(/blocked|fail-closed/);
      } else {
        await expect(advance).toBeDisabled();
      }
    }
    expect(body).not.toMatch(/filled on mainnet|broadcast complete/);
  });

  test("network matrix shows mode badges", async ({ page }) => {
    await page.goto("/network");
    await expect(page.getByText(/network|matrix|mainnet|quote|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/mainnet|quote|read|unavailable|wash|broadcast/);
    expect(body).toMatch(/broadcast paused|broadcast_paused|quote-only/);
    expect(body).toMatch(/nestusd|fail-closed|unverified/);
    expect(body).toMatch(/bitquery.*missing|wash.*fail-closed|fail-closed.*bitquery/);
    expect(body).not.toMatch(/unhackable|nation-state/);
  });

  test("lab routes stay approve-gated", async ({ page }) => {
    await page.goto("/lab/shaders");
    await expect(page.getByText(/awaiting henry|approve/i).first()).toBeVisible();
    await expect(page.getByText(/ink-ledger|ledger-mist|aurora-grid/i).first()).toBeVisible();
    await page.goto("/lab/ui");
    await expect(page.getByText(/awaiting henry|approve/i).first()).toBeVisible();
    await expect(page.getByText(/desk-density-a/i).first()).toBeVisible();
    await expect(page.getByText(/desk-density-b/i).first()).toBeVisible();
    await expect(page.getByText(/gate-chip/i).first()).toBeVisible();
    await expect(page.getByText(/mainnet-read|quote-only|unavailable/i).first()).toBeVisible();

    // Pick is local-only; preview on desk is opt-in and never a production merge
    await page.getByRole("button", { name: /pick candidate desk-density-a/i }).click();
    await expect(page.getByText(/chat reply ready|approve lab ui: desk-density-a/i).first()).toBeVisible();
    await page.getByRole("link", { name: /preview on desk/i }).click();
    await expect(page.getByText(/lab preview \(opt-in/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("[data-lab-ui='desk-density-a']")).toHaveCount(1);
    await page.getByRole("button", { name: /exit preview/i }).click();
    await expect(page.getByText(/lab preview \(opt-in/i)).toHaveCount(0);
  });

  test("settings exposes watch-wallet bind (not Privy auth)", async ({ page }) => {
    await page.goto("/desk/settings");
    await expect(page.getByText(/settings|session|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/watch wallet|watch-wallet/);
    expect(body).toMatch(/not.*privy|not privy|≠ privy|multi-tenant/);
    expect(body).toMatch(/auth fail-closed|keys missing|privy \+ supabase/);
    expect(body).toMatch(/broadcast off|broadcast.*unavailable|broadcast disabled/);
    expect(body).toMatch(
      /watch-wallet secret (set|missing)|secret (ready|missing)|folio_session_secret/,
    );
    expect(body).toMatch(/production readiness|henry actions/);
    expect(body).toMatch(/bitquery_api_key|wash fail-closed|wash tape/);
    expect(body).toMatch(/pyth_api_key|hermes|pyth diverge fail-closed/);
    expect(body).toMatch(/privy|multi-tenant fail-closed/);
    expect(body).toMatch(/supabase|tenants fail-closed/);
    expect(body).not.toMatch(/unhackable|nation-state/);
  });

  test("desk overview supports ephemeral wallet inspect without session secret", async ({
    page,
  }) => {
    const inspect = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    await page.goto(`/desk?inspect=${inspect}`);
    await expect(page.getByText(/prime desk|portfolio|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/inspect|ephemeral|mainnet/);
    expect(body).toMatch(/not.*auth|not multi-tenant|≠.*privy|not.*session/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });

  test("credit page labels capacity source", async ({ page }) => {
    await page.goto("/desk/credit");
    await expect(page.getByText(/credit|collateral|kamino|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/paper|wallet-read|collateral|ltv/);
    expect(body).toMatch(/no borrow broadcast|fork|unavailable|illustrative/);
    expect(body).toMatch(/nestusd/);
    expect(body).toMatch(/unverified|risk|fail-closed|unavailable/);
    // Never paint NestUSD as ready/live without a verified endpoint.
    expect(body).not.toMatch(/nestusd[\s\S]{0,40}ready/);
  });


  test("positions page labels paper vs wallet-read qty", async ({ page }) => {
    await page.goto("/desk/positions");
    await expect(page.getByText(/positions|ownership|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/paper|wallet-read|wallet/);
    expect(body).toMatch(/qty|quantity|multiplier|aapl/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });

  test("public credit shows live Kamino / NestUSD honesty", async ({ page }) => {
    await page.goto("/credit");
    await expect(page.getByText(/credit|liquidity|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/kamino/);
    expect(body).toMatch(/nestusd/);
    expect(body).toMatch(/no broadcast|fork|off|unfunded/);
    expect(body).toMatch(/unverified|risk|fail-closed|hidden|unavailable/);
    expect(body).not.toMatch(/nestusd[\s\S]{0,40}ready/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });

  test("public execution shows wash/quote/broadcast honesty", async ({ page }) => {
    await page.goto("/execution");
    await expect(page.getByText(/execution|gate|quote|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/wash/);
    expect(body).toMatch(/quote/);
    expect(body).toMatch(/broadcast paused|broadcast remains paused|broadcast off/);
    expect(body).toMatch(/bitquery|fail-closed|unavailable|heuristic|keyed/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });


  test("positions supports ephemeral wallet inspect without session secret", async ({
    page,
  }) => {
    const inspect = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    await page.goto(`/desk/positions?inspect=${inspect}`);
    await expect(page.getByText(/positions|ownership|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/inspect|ephemeral|mainnet/);
    expect(body).toMatch(/not.*auth|not multi-tenant|≠.*privy|not.*session/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });


  test("credit supports ephemeral wallet inspect without session secret", async ({
    page,
  }) => {
    const inspect = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    await page.goto(`/desk/credit?inspect=${inspect}`);
    await expect(page.getByText(/credit|collateral|kamino|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/inspect|ephemeral|mainnet/);
    expect(body).toMatch(/not.*auth|not multi-tenant|≠.*privy|not.*session/);
    expect(body).toMatch(/nestusd|kamino|no borrow|fork|unavailable|illustrative/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });


  test("home surfaces lab approve CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /approve desk ui/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /approve shaders/i })).toBeVisible();
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/approve a look|without your approve|lab/);
  });

});
