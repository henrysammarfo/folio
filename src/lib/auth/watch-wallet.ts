import { createHmac, timingSafeEqual } from "node:crypto";
import { errResult, okResult, type AdapterResult } from "../adapters/types";
import { isLikelySolanaPubkey } from "../adapters/wallet-balances";

/**
 * Optional httpOnly watch-wallet cookie for mainnet-read position qty.
 * This is NOT multi-tenant auth — Privy+Supabase still required for folio_session.
 * Signing reuses FOLIO_SESSION_SECRET when present (≥16 chars).
 */
export const FOLIO_WATCH_WALLET_COOKIE = "folio_watch_wallet";

type WatchWalletPayload = {
  wallet: string;
  issuedAt: string;
  expiresAt: string;
};

function sessionSecret(): string | null {
  const s = process.env["FOLIO_SESSION_SECRET"]?.trim();
  return s && s.length >= 16 ? s : null;
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b.toString("base64url");
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function mintWatchWalletCookie(
  wallet: string,
  ttlSec = 60 * 60 * 24 * 7,
): AdapterResult<{ wallet: string; cookieValue: string }> {
  const source = "folio.watch-wallet.mint";
  const secret = sessionSecret();
  if (!secret) {
    return errResult(
      source,
      "session_secret_missing",
      "FOLIO_SESSION_SECRET (≥16) required to bind watch-wallet cookie (not Privy auth).",
    );
  }
  const trimmed = wallet.trim();
  if (!isLikelySolanaPubkey(trimmed)) {
    return errResult(source, "wallet_pubkey_invalid", "Expected a base58 Solana pubkey.");
  }
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + ttlSec * 1000);
  const payload: WatchWalletPayload = {
    wallet: trimmed,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = signPayload(payloadB64, secret);
  return okResult("mainnet-read", source, {
    wallet: trimmed,
    cookieValue: `${payloadB64}.${sig}`,
  });
}

export function verifyWatchWalletCookieValue(
  cookieValue: string | null | undefined,
): AdapterResult<{ wallet: string }> {
  const source = "folio.watch-wallet.verify";
  const secret = sessionSecret();
  if (!secret) {
    return errResult(
      source,
      "session_secret_missing",
      "FOLIO_SESSION_SECRET required to verify watch-wallet cookie.",
    );
  }
  if (!cookieValue?.includes(".")) {
    return errResult(source, "watch_wallet_missing", "No folio_watch_wallet cookie.");
  }
  const [payloadB64, sig] = cookieValue.split(".");
  if (!payloadB64 || !sig) {
    return errResult(source, "watch_wallet_malformed", "Expected payload.sig format.");
  }
  const expected = signPayload(payloadB64, secret);
  if (!safeEqual(sig, expected)) {
    return errResult(source, "watch_wallet_sig_invalid", "HMAC mismatch — fail-closed.");
  }
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(json) as WatchWalletPayload;
    if (!payload.wallet || !isLikelySolanaPubkey(payload.wallet)) {
      return errResult(source, "watch_wallet_payload_invalid", "Missing wallet.");
    }
    if (Date.parse(payload.expiresAt) <= Date.now()) {
      return errResult(source, "watch_wallet_expired", "Watch wallet cookie expired.");
    }
    return okResult("mainnet-read", source, { wallet: payload.wallet });
  } catch (e) {
    return errResult(source, "watch_wallet_parse_failed", String(e));
  }
}
