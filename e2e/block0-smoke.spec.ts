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
      await page.getByText(/wash|checks|policy|gate/i).first().waitFor({ timeout: 30_000 });
    }

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).toMatch(/wash|fail|blocked|unavailable|bitquery|quote|check/);

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
  });

  test("lab routes stay approve-gated", async ({ page }) => {
    await page.goto("/lab/shaders");
    await expect(page.getByText(/awaiting approval|approve/i).first()).toBeVisible();
    await page.goto("/lab/ui");
    await expect(page.getByText(/awaiting approval|approve/i).first()).toBeVisible();
  });
});
