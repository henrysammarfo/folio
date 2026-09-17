import { test, expect } from "@playwright/test";

test.describe("FOLIO Block 0 smoke", () => {
  test("home renders brand stencil plane (not fixture 4×)", async ({ page }) => {
    await page.goto("/");
    // Topbar brand is visible; SVG stencil text is mask-only (aria-hidden)
    await expect(page.locator(".home-brand-hero").getByText("FOLIO")).toBeVisible();
    await expect(page.getByText(/own the economic truth/i).first()).toBeVisible();
    const body = (await page.locator("body").innerText()).toLowerCase();
    // Live multiplier woven into hero copy — never fixture 4× theater
    expect(body).toMatch(/aapl|live|solana|broadcast/);
    expect(body).not.toMatch(/\b4\.0000\s*×|\bfixture 4× theater only\b/);
    expect(body).toMatch(/not fixture|never fixture/);
    // Brand plane: stencil SVG present (Aionis pattern)
    await expect(page.locator(".folio-stencil, .folio-stencil-svg").first()).toBeVisible();
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
    expect(body).toMatch(/pending corporate action|corporate-action pending|no pending|none/i);
  });

  test("acquire stays fail-closed on wash without Bitquery", async ({ page }) => {
    await page.goto("/desk/acquire", { waitUntil: "networkidle" });
    await expect(page.getByText(/acquire|quote|wash|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });

    // Enter checks step — wait for named BITQUERY env (not the step-1 Wash badge)
    const step1 = page.getByTestId("acquire-continue");
    await expect(step1).toBeEnabled({ timeout: 15_000 });
    await step1.click();
    await expect(page.getByText(/Policy checks/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/BITQUERY_API_KEY/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/canReview/i).first()).toBeVisible();
    await expect(page.getByTestId("acquire-scaled-ui-gate")).toBeVisible();
    await expect(page.getByTestId("acquire-scaled-ui-gate")).toContainText(/On-chain Scaled UI/i);
    await expect(page.getByTestId("acquire-scaled-ui-gate")).toContainText(
      /match|mismatch|off/i,
    );

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/wash|fail|blocked|unavailable|bitquery|quote|check/);
    expect(body).toMatch(/bitquery_api_key/);
    expect(body).toMatch(/fail-closed|canreview|blocked/);
    expect(body).toMatch(/on-chain scaled ui/);
    expect(body).toMatch(/truth \(api\)/);

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
    expect(body).toMatch(/nest\.credit|vault awareness|not nestusd borrow/i);
    expect(body).toMatch(/bitquery.*missing|wash.*fail-closed|fail-closed.*bitquery/);
    expect(body).toMatch(/raydium|pool awareness|not a route guarantee/);
    expect(body).not.toMatch(/unhackable|nation-state/);
  });

  test("lab routes stay approve-gated", async ({ page }) => {
    await page.goto("/lab/shaders");
    await expect(page.getByText(/awaiting henry|approve|production ·/i).first()).toBeVisible();
    await expect(page.getByText(/ink-ledger|ledger-mist|aurora-grid/i).first()).toBeVisible();
    await page.goto("/lab/ui");
    // netro-density may already be production-approved via FOLIO_APPROVED_LAB_UI
    await expect(
      page.getByText(/awaiting henry|approve|production · netro-density|production chrome live/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/netro-density/i).first()).toBeVisible();
    await expect(page.getByText(/aionis-brand-plane/i).first()).toBeVisible();
    await expect(page.getByText(/cinematic-landing-21st/i).first()).toBeVisible();
    await expect(page.getByText(/trade-journal-21st/i).first()).toBeVisible();
    await expect(page.getByText(/21st|netrobnb|aionis/i).first()).toBeVisible();

    // Pick is local-only; preview on desk is opt-in and never a production merge
    const pickNetro = page.getByRole("button", {
      name: /pick candidate netro-density/i,
    });
    await pickNetro.scrollIntoViewIfNeeded();
    await pickNetro.click();
    await expect(pickNetro).toHaveAttribute("aria-pressed", "true", {
      timeout: 10_000,
    });
    await expect(page.getByText(/Chat reply ready:/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("link", { name: /preview on desk/i }).click();
    await expect(page.getByText(/lab preview \(opt-in/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("[data-lab-ui='netro-density']")).toHaveCount(1);
    // Netro extract paints grey canvas + mounts live 12-col density on desk
    await expect(page.locator(".desk-layout[data-lab-ui='netro-density']")).toBeVisible();
    await expect(page.locator("[data-testid='desk-lab-netro'] .netro-density-grid")).toBeVisible();
    await expect(page.locator("[data-testid='desk-lab-netro'] #netro-left-column")).toBeVisible();
    await expect(page.locator("[data-testid='desk-lab-netro'] #netro-right-column")).toBeVisible();
    // Netro IS the desk overview surface — no stacked overview heading/panels under it
    await expect(page.locator(".desk-content > .desk-heading")).toHaveCount(0);
    await expect(page.locator(".desk-content > .panel")).toHaveCount(0);
    await expect(page.locator(".netro-density-ticker")).toBeVisible();
    await expect(page.locator("[data-netro-surface='1']")).toHaveCount(1);
    // Live Empire gates must still paint on Netro surface (not static theater only)
    await expect(page.getByTestId("netro-live-gates")).toBeVisible();
    await expect(page.getByTestId("netro-empire-strip")).toBeVisible();
    // Decorative strip must not claim live candles; live Scaled UI status is labeled
    await expect(page.getByTestId("netro-truth-strip")).toContainText(
      /illustrative strip|not live candles/i,
    );
    await expect(page.getByTestId("netro-scaled-ui-strip")).toContainText(
      /API↔chain|Scaled UI|match|mismatch|pending|off/i,
    );
    // Empire keys readiness — multi-tenant / wash / Pyth fail-closed until paste
    await expect(page.getByTestId("netro-keys-readiness")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("netro-keys-readiness")).toContainText(
      /bitquery|pyth|privy|supabase|multi-tenant|fail-closed|broadcast/i,
    );
    await expect(
      page.getByTestId("netro-keys-readiness").getByRole("link", {
        name: /settings|paste/i,
      }),
    ).toHaveAttribute("href", /\/desk\/settings.*empire-readiness|\/desk\/settings#empire-readiness/);
    const gateText = (
      await page.getByTestId("netro-live-gates").innerText()
    ).toLowerCase();
    expect(gateText).toMatch(/wash/);
    expect(gateText).toMatch(/fail-closed|live/);
    expect(gateText).toMatch(/nestusd/);
    const strip = (
      await page.getByTestId("netro-empire-strip").innerText()
    ).toLowerCase();
    expect(strip).toMatch(/pyth/);
    expect(strip).toMatch(/scaled ui/);
    expect(strip).toMatch(/multi-tenant/);
    expect(strip).toMatch(/raydium|nest\.credit|kamino/);
    // Live Kamino maxLTV from credit bundle (not hardcoded theater alone)
    await expect(page.getByText(/Kamino 0\.\d{2} maxLTV/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator("[data-testid='desk-lab-netro']").getByText(/paper × LTV · no broadcast/i),
    ).toBeVisible();
    // Live Jupiter ≤$1 quote-only out amount (never a fill)
    await expect(page.getByTestId("netro-live-quote")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("netro-live-quote")).toContainText(/AAPLx/i);
    await expect(
      page.getByTestId("netro-live-quote").getByText(/\d+\.\d+ AAPLx|Unavailable|Quote pending/i),
    ).toBeVisible();
    await expect(
      page.locator("[data-testid='desk-lab-netro']").getByRole("link", { name: /inspect quote/i }),
    ).toHaveAttribute("href", "/desk/acquire");
    // Paper agent rail — live spine · never fills
    const agentRail = page.getByTestId("netro-paper-agent");
    await expect(agentRail).toBeVisible();
    await agentRail.getByRole("button", { name: /truth pass/i }).click();
    await expect(agentRail).toContainText(/broadcast=false|nl=/i, {
      timeout: 60_000,
    });
    await expect(agentRail).not.toContainText(/filled on mainnet|unhackable/i);
    // Netro inspect wallet restores overview ownership with ?inspect=
    const inspectForm = page.getByTestId("netro-inspect-wallet");
    await expect(inspectForm).toBeVisible();
    const inspectPk = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    await inspectForm.getByLabel(/inspect wallet pubkey/i).fill(inspectPk);
    await inspectForm.getByRole("button", { name: /inspect qty/i }).click();
    await expect(page).toHaveURL(new RegExp(`/desk\\?inspect=${inspectPk}`), {
      timeout: 15_000,
    });
    await expect(page.getByTestId("desk-lab-netro")).toBeVisible();
    await expect(page.getByTestId("netro-ownership")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId("netro-ownership")).toContainText(
      /inspect|paper qty|wallet-read|economic/i,
    );
    await expect(
      page.getByRole("link", { name: /open positions ledger/i }),
    ).toHaveAttribute("href", `/desk/positions?inspect=${inspectPk}`);
    // Positions stays the ledger — Netro must not replace other desk routes
    await page.goto("/desk/positions");
    await expect(page.getByText(/lab preview \(opt-in/i).first()).toBeVisible();
    await expect(page.locator("[data-testid='desk-lab-netro']")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /positions/i }).first()).toBeVisible();
    await page.goto("/desk");
    await expect(page.locator("[data-testid='desk-lab-netro']")).toBeVisible();
    await page.getByRole("button", { name: /exit preview/i }).click();
    await expect(page.getByText(/lab preview \(opt-in/i)).toHaveCount(0);

    // Aionis brand-plane preview path
    await page.goto("/lab/ui");
    const pickAionis = page.getByRole("button", {
      name: /pick candidate aionis-brand-plane/i,
    });
    await pickAionis.scrollIntoViewIfNeeded();
    await pickAionis.click();
    await expect(pickAionis).toHaveAttribute("aria-pressed", "true", {
      timeout: 10_000,
    });
    await page.getByRole("link", { name: /preview on desk/i }).click();
    await expect(page.getByText(/lab preview \(opt-in/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("[data-lab-ui='aionis-brand-plane']")).toHaveCount(1);
    await page.getByRole("button", { name: /exit preview/i }).click();

    // Lab surfaces Netro/Aionis extract + 21st MCP honesty
    await page.goto("/lab/ui");
    await expect(page.getByText(/netrobnb desk density|make analysis easy|share truth desk/i).first()).toBeVisible();
    await expect(page.locator(".lab-aionis-stage, .folio-stencil").first()).toBeVisible();
    await expect(page.getByText(/21st|api_key_21st|mcp|truth journal/i).first()).toBeVisible();

    await page.goto("/lab/shaders");
    await expect(page.getByText(/webgl|21st|shaders/i).first()).toBeVisible();
    await expect(page.locator(".lab-swatch-live, canvas.lab-swatch-canvas").first()).toBeVisible({
      timeout: 15_000,
    });
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
    expect(body).toMatch(/broadcast paused|broadcast off|broadcast.*unavailable|broadcast disabled/);
    expect(body).toMatch(
      /watch-wallet secret (set|missing)|secret (ready|missing)|folio_session_secret/,
    );
    expect(body).toMatch(/production readiness|henry actions/);
    expect(body).toMatch(/bitquery_api_key|wash fail-closed|wash tape/);
    expect(body).toMatch(/pyth_api_key|hermes|pyth diverge fail-closed/);
    expect(body).toMatch(/agentrouter|live spine only|nl optional/);
    expect(body).toMatch(/privy|multi-tenant fail-closed/);
    expect(body).toMatch(/supabase|tenants fail-closed/);
    expect(body).toMatch(/supabase_jwt_secret|user-jwt|service-role labeled|rls/);
    expect(body).toMatch(/api_key_21st|21st.*lab|lab mcp/);
    expect(body).toMatch(/shaders_api_key|shaders.*lab|clerk may still gate/);
    expect(body).toMatch(/folio_approved_lab_ui|production desk stays default|henry chat approve|desk chrome netro-density/);
    expect(body).toMatch(/folio_approved_lab_shader/);
    expect(body).toMatch(/jupiter_api_key|public quote\/price|ttl cache/);
    expect(body).toMatch(/solana_rpc_url|public fallback|dedicated/);
    expect(body).toMatch(/smoke:keys|keys_landing|npm run keys/);
    expect(body).toMatch(/active tenant/);
    expect(body).toMatch(/rls|service-role|jwt sub/);
    expect(body).toMatch(/strict fail-closed/);
    expect(body).toMatch(/wash gates|acquire wash|live spine/);
    expect(body).toMatch(/bind wallet|watch |session /i);
    expect(body).toMatch(/mint blocked|keys missing|mint httpOnly session|privy \+ supabase/);
    expect(body).not.toMatch(/7vf…2ka|7vf\.\.\.2ka/i);
    expect(body).not.toMatch(/unhackable|nation-state/);
  });

  test("activity labels corporate-action preference honestly", async ({ page }) => {
    await page.goto("/desk/activity");
    await expect(page.getByText(/activity|events|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/nest\.credit|vault awareness|not nestusd/);
    expect(body).toMatch(/corporate-action alerts/);
    expect(body).toMatch(/on-chain scaled ui/);
    expect(body).toMatch(
      /corporate action|pending multiplier|no pending|no session prefs|multiplier/,
    );
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });

  test("acquire surfaces strict prefs scope without inventing a session", async ({
    page,
  }) => {
    await page.goto("/desk/acquire", { waitUntil: "networkidle" });
    await expect(page.getByText(/acquire|quote|wash|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const step1 = page.getByTestId("acquire-continue");
    await expect(step1).toBeEnabled({ timeout: 15_000 });
    await step1.click();
    await expect(page.getByText(/Policy checks/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/strict prefs · no session|strict fail-closed|no session/);
    expect(body).toMatch(/bitquery_api_key/);
    expect(body).toMatch(/no pending ca|pending \d|verified live|corporate-action/);
    expect(body).toMatch(/raydium|pool|awareness only|not a route guarantee/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });

  test("desk overview supports ephemeral wallet inspect without session secret", async ({
    page,
  }) => {
    const inspect = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    await page.goto(`/desk?inspect=${inspect}`);
    await expect(page.getByText(/prime desk|portfolio|FOLIO|share truth desk/i).first()).toBeVisible({
      timeout: 30_000,
    });
    // Production Netro overview replaces classic panels — inspect lives on the Netro strip
    // or deep-links to Positions. Classic overview assertions only when Netro is off.
    const netro = page.getByTestId("desk-lab-netro");
    if ((await netro.count()) > 0) {
      await expect(page.getByTestId("netro-inspect-wallet")).toBeVisible();
      await expect(page.getByTestId("netro-ownership")).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByTestId("netro-ownership")).toContainText(
        /inspect|paper qty|wallet-read|economic/i,
      );
      await expect(page.locator("body")).toContainText(/ephemeral mainnet-read|not auth|no cookie/i);
      await expect(page.locator("body")).not.toContainText(/unhackable|filled on mainnet/i);
      return;
    }
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/inspect|ephemeral|mainnet/);
    expect(body).toMatch(/not.*auth|not multi-tenant|≠.*privy|not.*session/);
    expect(body).toMatch(/live · no pending|pending \d|corporate actions/);
    expect(body).toMatch(/nest\.credit|not nestusd/);
    expect(body).toMatch(/nestusd borrow|fail-closed/);
    expect(body).toMatch(/quote-only|broadcast off|no broadcast/);
    expect(body).toMatch(/wallet-verified|live marks · paper|paper qty → review/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });

  test("credit page labels capacity source", async ({ page }) => {
    await page.goto("/desk/credit");
    await expect(page.getByText(/credit|collateral|kamino|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/paper|wallet-read|collateral|ltv/);
    expect(body).toMatch(/no borrow broadcast|unavailable|illustrative|unfunded/);
    expect(body).toMatch(/nestusd/);
    expect(body).toMatch(/nest\.credit|vault|oft|not nestusd/i);
    expect(body).toMatch(/unverified|risk|fail-closed|unavailable/);
    // Never paint NestUSD as ready/live without a verified endpoint.
    expect(body).not.toMatch(/nestusd[\s\S]{0,40}ready/);
    expect(body).not.toMatch(/7vf…2ka/i);
  });


  test("positions page labels paper vs wallet-read qty", async ({ page }) => {
    await page.goto("/desk/positions");
    await expect(page.getByText(/positions|ownership|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/paper|wallet-read|wallet/);
    expect(body).toMatch(/qty|quantity|multiplier|aapl/);
    // API ↔ on-chain Scaled UI must be visible on the list (not API-only).
    await expect(page.getByTestId("positions-scaled-ui-AAPLx")).toBeVisible();
    await expect(page.getByTestId("positions-scaled-ui-AAPLx")).toContainText(
      /chain match|chain mismatch|chain off/i,
    );
    expect(body).toMatch(/chain match|chain mismatch|chain off/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet/);
  });

  test("prime desk surfaces live Empire gates from network matrix", async ({ page }) => {
    await page.goto("/desk/");
    // Production Netro paints live gates; classic overview only when Netro not approved
    const netro = page.getByTestId("netro-live-gates");
    const classic = page.getByText(/live empire gates/i);
    await expect(netro.or(classic).first()).toBeVisible({ timeout: 30_000 });
    if (await netro.count()) {
      await expect(netro).toContainText(/wash|multiplier/i);
      // SSR seed: not stuck on defaults forever
      await expect(netro).toContainText(/live|fail-closed|≤\$1|inspect/i);
    }
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/wash/);
    expect(body).toMatch(/nestusd/);
    expect(body).toMatch(/broadcast/);
    expect(body).toMatch(/fail-closed|unavailable|quote-only|mainnet-read|paused/);
    expect(body).not.toMatch(/unhackable|filled on mainnet/);
  });

  test("position detail surfaces pending CA honestly", async ({ page }) => {
    await page.goto("/desk/positions/AAPLx");
    await expect(page.getByText(/AAPLx|position|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/pending corporate action/);
    expect(body).toMatch(/none on live feed|pending|\d+\.\d+×/);
    expect(body).toMatch(/api multiplier|on-chain scaled ui/);
    await expect(page.getByTestId("position-scaled-ui-compare")).toBeVisible();
    await expect(page.getByTestId("position-scaled-ui-compare")).toContainText(
      /chain match|chain mismatch|chain off/i,
    );
    expect(body).toMatch(/api ↔ chain|api ↔ on-chain|within|diverge|unavailable/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet|4\.0000/);
  });

  test("public credit shows live Kamino / NestUSD honesty", async ({ page }) => {
    await page.goto("/credit");
    await expect(page.getByText(/credit|liquidity|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/kamino/);
    expect(body).toMatch(/nestusd/);
    expect(body).toMatch(/nest\.credit|vault|oft|not nestusd/i);
    expect(body).toMatch(/no broadcast|unavailable|off|unfunded/);
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
    expect(body).toMatch(/bitquery|fail-closed|unavailable|keyed/);
    // Missing Bitquery must not paint Heuristic-as-green theater
    expect(body).toMatch(/fail-closed/);
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

  test("position detail keeps inspect wallet-read continuity", async ({ page }) => {
    const inspect = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    await page.goto(`/desk/positions/AAPLx?inspect=${inspect}`);
    await expect(page.getByText(/AAPLx|position|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/inspect|ephemeral/);
    expect(body).toMatch(/wallet-read|inspect ephemeral|not auth|not multi-tenant/);
    expect(body).toMatch(/pending corporate action/);
    expect(body).not.toMatch(/unhackable|nation-state|filled on mainnet|4\.0000/);
  });

  test("truth diverge gate does not invent a pass checkmark", async ({ page }) => {
    await page.goto("/truth");
    await expect(page.getByText(/FOLIO|truth|multiplier|Scaled/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/diverge gate/);
    // Without Pyth key, diverge must stay labeled unavailable — not silent pass theater
    expect(body).toMatch(/pyth unavailable|informational only|pyth required for pass|no invent/);
    expect(body).toMatch(/on-chain scaled ui/);
    expect(body).toMatch(/jupiter price (live|cached|stale-cache|unavailable)/);
    // Stocklana Pyth bounty triad mapped even when key missing
    expect(body).toMatch(/equity\.us\.aapl\/usd/);
    expect(body).toMatch(/crypto\.aaplx\/usd/);
    expect(body).toMatch(/crypto\.aaplon\/usd/);
    expect(body).toMatch(/pyth_api_key|fail-closed until pyth_api_key|mapped/);
    // Diverge must not invent pass=true without Pyth Equity.US
    await expect(page.locator('[data-testid="truth-diverge-gate"]')).toHaveAttribute(
      "data-diverge-pass",
      "null",
    );
    expect(body).not.toMatch(/unhackable|nation-state|4\.0000/);
  });

  test("activity labels Jupiter cache + Nest.credit ≠ NestUSD", async ({ page }) => {
    await page.goto("/desk/activity");
    await expect(page.getByText(/activity|events|FOLIO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/jupiter route inspected|jupiter quote unavailable/);
    expect(body).toMatch(/live|cached|stale-cache|unavailable/);
    expect(body).toMatch(/nest\.credit|not nestusd/);
    expect(body).toMatch(/nestusd.*fail-closed|fail-closed.*nestusd|≠ nest\.credit/);
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


  test("home surfaces brand-first hero and lab links", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Brand is stencil + topbar (no competing h1 FOLIO over the plane)
    await expect(page.locator(".home-brand-hero").getByText("FOLIO")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator(".folio-stencil, .folio-stencil-svg").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /open (the )?desk/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /lab ui/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /lab shaders|shaders/i }).first()).toBeVisible();
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/own the economic truth|live|broadcast/);
    // Supporting copy + lab links sit below the brand plane — not stacked on letterforms
    expect(body).toMatch(/lab\/ui|lab\/shaders|premium chrome|honest stock desk|truth before trade/);
    // Full landing below preserved hero — secondary Netro section is not a second hero
    await expect(page.getByRole("heading", { name: /truth before trade/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /share truth desk/i })).toBeVisible();
    await expect(page.locator(".home-section-netro")).toBeVisible();
    // Hero preserved — Empire readiness lives on desk/lab, not a second home hero
    await expect(page.getByRole("heading", { name: /live empire/i })).toHaveCount(0);
  });

  test("lab ui pins 21st Plasma and Trade Journal ids", async ({ page }) => {
    await page.goto("/lab/ui", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /look at the stages/i })).toBeVisible({
      timeout: 20_000,
    });
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/24346/);
    expect(body).toMatch(/27124/);
    await expect(page.locator("#stage-netro .netro-density-chrome")).toBeVisible();
    await expect(page.locator("#stage-netro .netro-density-grid")).toBeVisible();
    await expect(page.locator("#stage-netro #netro-left-column")).toBeVisible();
    await expect(page.locator("#stage-netro #netro-right-column")).toBeVisible();
    await expect(page.locator("#stage-netro .netro-density-quote")).toBeVisible();
    await expect(page.locator("#stage-netro .netro-density-rail")).toBeVisible();
  });

  test("paper agent keeps live spine and never fills", async ({ page }) => {
    await page.goto("/desk/settings", { waitUntil: "networkidle" });
    await expect(page.getByText(/paper agent/i).first()).toBeVisible({
      timeout: 30_000,
    });
    const runBtn = page.getByRole("button", { name: /run paper agent/i });
    await runBtn.scrollIntoViewIfNeeded();
    await runBtn.click();
    await expect(page.locator("pre").filter({ hasText: /nl=/i })).toBeVisible({
      timeout: 60_000,
    });
    const out = (await page.locator("pre").filter({ hasText: /nl=/i }).innerText()).toLowerCase();
    // nl=off when AGENTROUTER missing; ok/failed/skipped when NL path runs
    expect(out).toMatch(/nl=(ok|failed|skipped|off)/);
    expect(out).toMatch(/broadcast=false/);
    expect(out).toMatch(/truth|quote|gates|×|multiplier|pending/);
    expect(out).not.toMatch(/filled on mainnet|broadcast complete|unhackable/);
  });
});
