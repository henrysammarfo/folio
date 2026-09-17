import { afterEach, describe, expect, it } from "vitest";
import {
  mintWatchWalletCookie,
  verifyWatchWalletCookieValue,
} from "../auth/watch-wallet";
import { TOKEN_PROGRAM_ID } from "../adapters/solana-program-ids";

const PREV = process.env["FOLIO_SESSION_SECRET"];

afterEach(() => {
  if (PREV === undefined) delete process.env["FOLIO_SESSION_SECRET"];
  else process.env["FOLIO_SESSION_SECRET"] = PREV;
});

describe("watch-wallet cookie", () => {
  it("fail-closes without FOLIO_SESSION_SECRET", () => {
    delete process.env["FOLIO_SESSION_SECRET"];
    const minted = mintWatchWalletCookie(TOKEN_PROGRAM_ID);
    expect(minted.ok).toBe(false);
  });

  it("mints and verifies a signed watch-wallet cookie", () => {
    process.env["FOLIO_SESSION_SECRET"] = "test-secret-at-least-16ch";
    const wallet = TOKEN_PROGRAM_ID;
    const minted = mintWatchWalletCookie(wallet);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const verified = verifyWatchWalletCookieValue(minted.data.cookieValue);
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    expect(verified.data.wallet).toBe(wallet);
  });

  it("rejects tampered cookies", () => {
    process.env["FOLIO_SESSION_SECRET"] = "test-secret-at-least-16ch";
    const minted = mintWatchWalletCookie(TOKEN_PROGRAM_ID);
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const [payload, sig] = minted.data.cookieValue.split(".");
    const bad = `${payload}.${(sig ?? "").split("").reverse().join("")}tamper`;
    const verified = verifyWatchWalletCookieValue(bad);
    expect(verified.ok).toBe(false);
  });
});
