import { describe, expect, it } from "vitest";
import { resolveWalletBinding } from "../wallet-binding";

describe("resolveWalletBinding inspect", () => {
  it("uses ephemeral inspect when no session/watch-wallet", () => {
    const wallet = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    const resolved = resolveWalletBinding({ inspectWallet: wallet });
    expect(resolved.source).toBe("inspect");
    expect(resolved.wallet).toBe(wallet);
  });

  it("ignores invalid inspect pubkeys", () => {
    const resolved = resolveWalletBinding({ inspectWallet: "not-a-key" });
    expect(resolved.source).toBeNull();
    expect(resolved.wallet).toBeNull();
  });

  it("prefers session wallet over inspect", () => {
    const resolved = resolveWalletBinding({
      sessionWallet: "11111111111111111111111111111111",
      inspectWallet: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    });
    expect(resolved.source).toBe("session");
    expect(resolved.wallet).toBe("11111111111111111111111111111111");
  });

  it("prefers watch-wallet over inspect", () => {
    const resolved = resolveWalletBinding({
      watchWallet: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      inspectWallet: "11111111111111111111111111111111",
    });
    expect(resolved.source).toBe("watch-wallet");
  });
});
