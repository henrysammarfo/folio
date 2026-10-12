import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { getAuthProviderStatus } from "./session";

export type PrivyIdentity = {
  userId: string;
  walletAddress: string | null;
  email: string | null;
};

/**
 * Verify a Privy access token against Privy's user API.
 * Fail-closed when keys are missing or Privy rejects the token.
 * Does not mint a folio_session — call mintFolioSession after success.
 */
export async function verifyPrivyAccessToken(
  accessToken: string | null | undefined,
): Promise<AdapterResult<PrivyIdentity>> {
  const source = "privy.verify";
  const auth = getAuthProviderStatus();
  if (!auth.ok) {
    return errResult(source, "privy_requires_auth_keys", auth.detail ?? auth.reason);
  }
  if (!accessToken?.trim()) {
    return errResult(source, "privy_token_missing", "No Privy access token — fail-closed.");
  }

  const appId = process.env["PRIVY_APP_ID"]?.trim();
  const appSecret = process.env["PRIVY_APP_SECRET"]?.trim();
  if (!appId || !appSecret) {
    return errResult(source, "privy_keys_missing", "PRIVY_APP_ID / PRIVY_APP_SECRET required.");
  }

  try {
    const res = await fetch("https://auth.privy.io/api/v1/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`,
        "privy-app-id": appId,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return errResult(
        source,
        "privy_verify_http_error",
        `HTTP ${res.status} ${body.slice(0, 180)} — fail-closed.`,
      );
    }

    const json = (await res.json()) as {
      id?: string;
      email?: { address?: string } | null;
      wallet?: { address?: string; chain_type?: string } | null;
      linked_accounts?: Array<{
        type?: string;
        address?: string;
        chain_type?: string;
        chainType?: string;
      }>;
    };

    if (!json.id) {
      return errResult(source, "privy_user_missing", "Privy response missing user id.");
    }

    const linked = json.linked_accounts ?? [];
    const isSolana = (a: { chain_type?: string; chainType?: string }) =>
      a.chain_type === "solana" || a.chainType === "solana";
    const solanaFromLinked =
      linked.find((a) => a.type === "wallet" && a.address && isSolana(a))
        ?.address ?? null;
    const anyFromLinked =
      linked.find((a) => a.type === "wallet" && a.address)?.address ?? null;
    const primaryIsSolana =
      !json.wallet?.chain_type || json.wallet.chain_type === "solana";

    return okResult("mainnet-read", source, {
      userId: json.id,
      // Prefer Solana — email signup creates an embedded Solana wallet; never
      // bind an EVM primary when a Solana linked account exists.
      walletAddress:
        solanaFromLinked ??
        (primaryIsSolana ? (json.wallet?.address ?? null) : null) ??
        anyFromLinked,
      email: json.email?.address ?? null,
    });
  } catch (e) {
    return errResult(source, "privy_verify_failed", `${String(e)} — fail-closed.`);
  }
}
