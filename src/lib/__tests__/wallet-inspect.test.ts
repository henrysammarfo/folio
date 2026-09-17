import { describe, expect, it } from "vitest";
import { resolveWalletBinding } from "../wallet-binding";
import { TOKEN_PROGRAM_ID } from "../adapters/solana-program-ids";

const MEMBERSHIP = TOKEN_PROGRAM_ID;
const SESSION = "11111111111111111111111111111111";
const WATCH = "SysvarRent111111111111111111111111111111111";
const INSPECT = "So11111111111111111111111111111111111111112";

describe("resolveWalletBinding inspect", () => {
  it("uses ephemeral inspect when no session/watch-wallet", () => {
    const resolved = resolveWalletBinding({ inspectWallet: INSPECT });
    expect(resolved.source).toBe("inspect");
    expect(resolved.wallet).toBe(INSPECT);
  });

  it("ignores invalid inspect pubkeys", () => {
    const resolved = resolveWalletBinding({ inspectWallet: "not-a-key" });
    expect(resolved.source).toBeNull();
    expect(resolved.wallet).toBeNull();
  });

  it("prefers session wallet over inspect", () => {
    const resolved = resolveWalletBinding({
      sessionWallet: SESSION,
      inspectWallet: INSPECT,
    });
    expect(resolved.source).toBe("session");
    expect(resolved.wallet).toBe(SESSION);
  });

  it("prefers watch-wallet over inspect", () => {
    const resolved = resolveWalletBinding({
      watchWallet: MEMBERSHIP,
      inspectWallet: SESSION,
    });
    expect(resolved.source).toBe("watch-wallet");
  });
});

describe("resolveWalletBinding membership priority", () => {
  it("prefers membership wallet over session, watch, and inspect", () => {
    const resolved = resolveWalletBinding({
      membershipWallet: MEMBERSHIP,
      sessionWallet: SESSION,
      watchWallet: WATCH,
      inspectWallet: INSPECT,
    });
    expect(resolved.source).toBe("membership");
    expect(resolved.wallet).toBe(MEMBERSHIP);
  });

  it("falls through to session when membership wallet missing", () => {
    const resolved = resolveWalletBinding({
      membershipWallet: null,
      sessionWallet: SESSION,
      watchWallet: WATCH,
    });
    expect(resolved.source).toBe("session");
    expect(resolved.wallet).toBe(SESSION);
  });

  it("ignores invalid membership pubkeys", () => {
    const resolved = resolveWalletBinding({
      membershipWallet: "not-a-key",
      sessionWallet: SESSION,
    });
    expect(resolved.source).toBe("session");
  });
});
