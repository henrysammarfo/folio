import { createHmac, timingSafeEqual } from "node:crypto";
import { errResult, okResult, type AdapterResult } from "../adapters/types";

export type AuthProviderStatus = {
  privyConfigured: boolean;
  supabaseConfigured: boolean;
  sessionSigningConfigured: boolean;
  /** True only when keys + signing secret are present AND a verified session cookie exists. */
  sessionReady: boolean;
  persistence: "httpOnly-server" | "unavailable";
  note: string;
};

export type TenantMembership = {
  tenantId: string;
  userId: string;
  role: "owner" | "trader" | "viewer";
};

export type FolioSession = {
  sessionId: string;
  userId: string;
  walletAddress: string | null;
  tenants: TenantMembership[];
  issuedAt: string;
  expiresAt: string;
};

export type MintSessionInput = {
  userId: string;
  walletAddress?: string | null;
  tenants?: TenantMembership[];
  ttlSec?: number;
};

export const FOLIO_SESSION_COOKIE = "folio_session";

function envTruthy(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]?.trim()));
}

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

/** Fail-closed auth readiness — never invent a wallet session from localStorage. */
export function getAuthProviderStatus(
  verifiedSession: AdapterResult<FolioSession> | null = null,
): AdapterResult<AuthProviderStatus> {
  const source = "folio.auth";
  const privyConfigured = envTruthy("PRIVY_APP_ID", "PRIVY_APP_SECRET");
  const supabaseConfigured = envTruthy(
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const sessionSigningConfigured = Boolean(sessionSecret());

  if (!privyConfigured || !supabaseConfigured) {
    return errResult(
      source,
      "auth_keys_missing",
      "Privy + Supabase keys required for multi-tenant httpOnly sessions. Desk prefs stay non-authoritative until wired.",
    );
  }

  if (!sessionSigningConfigured) {
    return errResult(
      source,
      "session_secret_missing",
      "FOLIO_SESSION_SECRET (≥16 chars) required to mint/verify httpOnly folio_session cookies.",
    );
  }

  const sessionReady = Boolean(verifiedSession?.ok);

  return okResult("mainnet-read", source, {
    privyConfigured,
    supabaseConfigured,
    sessionSigningConfigured,
    sessionReady,
    persistence: "httpOnly-server",
    note: sessionReady
      ? "Verified httpOnly folio_session — tenant_members resolved at mint when Supabase is reachable."
      : "Keys + signing secret present — mint folio_session after Privy JWT verify. No localStorage auth.",
  });
}

export type DeskPreference = {
  corporateActionAlerts: boolean;
  strictFailClosed: boolean;
};

/** Server-persisted prefs — fail-closed without Supabase + session. */
export async function loadDeskPreferences(
  tenantId: string | null,
  userId?: string | null,
): Promise<AdapterResult<DeskPreference>> {
  const source = "folio.prefs";
  const auth = getAuthProviderStatus();
  if (!auth.ok) {
    return errResult(source, "prefs_require_auth", auth.detail ?? auth.reason);
  }
  if (!tenantId) {
    return errResult(
      source,
      "prefs_require_tenant",
      "No tenant membership on session — refusing localStorage fallback.",
    );
  }
  if (!userId?.trim()) {
    return errResult(
      source,
      "prefs_require_user",
      "No verified user on session — refusing localStorage fallback.",
    );
  }

  const url = process.env["SUPABASE_URL"]?.trim();
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !serviceKey) {
    return errResult(source, "supabase_keys_missing", "SUPABASE_URL / SERVICE_ROLE_KEY required.");
  }

  try {
    const endpoint = new URL("/rest/v1/desk_preferences", url);
    endpoint.searchParams.set("tenant_id", `eq.${tenantId}`);
    endpoint.searchParams.set("user_id", `eq.${userId.trim()}`);
    endpoint.searchParams.set(
      "select",
      "corporate_action_alerts,strict_fail_closed",
    );
    endpoint.searchParams.set("limit", "1");

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return errResult(
        source,
        "prefs_http_error",
        `HTTP ${res.status} ${body.slice(0, 180)} — fail-closed.`,
      );
    }

    const rows = (await res.json()) as Array<{
      corporate_action_alerts?: boolean;
      strict_fail_closed?: boolean;
    }>;

    if (!Array.isArray(rows) || rows.length === 0) {
      return errResult(
        source,
        "prefs_row_missing",
        "No desk_preferences row for this tenant/user — apply migration and seed; refusing localStorage.",
      );
    }

    const row = rows[0]!;
    return okResult("mainnet-read", source, {
      corporateActionAlerts: Boolean(row.corporate_action_alerts ?? true),
      strictFailClosed: Boolean(row.strict_fail_closed ?? true),
    });
  } catch (e) {
    return errResult(source, "prefs_fetch_failed", `${String(e)} — fail-closed.`);
  }
}

/**
 * Mint a signed folio_session cookie value.
 * Call only after Privy JWT verification. Fail-closed without keys/secret.
 */
export function mintFolioSession(
  input: MintSessionInput,
): AdapterResult<{ session: FolioSession; cookieValue: string; setCookie: string }> {
  const source = "folio.session.mint";
  const auth = getAuthProviderStatus();
  if (!auth.ok) {
    return errResult(source, "mint_requires_auth_keys", auth.detail ?? auth.reason);
  }
  const secret = sessionSecret();
  if (!secret) {
    return errResult(source, "session_secret_missing", "FOLIO_SESSION_SECRET required.");
  }
  if (!input.userId?.trim()) {
    return errResult(source, "mint_user_missing", "Privy subject / userId required.");
  }

  const ttlSec = input.ttlSec ?? 60 * 60 * 12;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + ttlSec * 1000);
  const session: FolioSession = {
    sessionId: crypto.randomUUID(),
    userId: input.userId.trim(),
    walletAddress: input.walletAddress ?? null,
    tenants: input.tenants ?? [],
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const payloadB64 = b64url(JSON.stringify(session));
  const sig = signPayload(payloadB64, secret);
  const cookieValue = `${payloadB64}.${sig}`;
  const secure = process.env["NODE_ENV"] === "production" ? "; Secure" : "";
  const setCookie = `${FOLIO_SESSION_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSec}${secure}`;

  return okResult("mainnet-read", source, { session, cookieValue, setCookie });
}

/** Verify a signed folio_session cookie value (payload.sig). */
export function verifyFolioSessionCookieValue(
  cookieValue: string | null | undefined,
): AdapterResult<FolioSession> {
  const source = "folio.session.verify";
  const auth = getAuthProviderStatus();
  if (!auth.ok) {
    return errResult(source, "session_requires_auth_keys", auth.detail ?? auth.reason);
  }
  const secret = sessionSecret();
  if (!secret) {
    return errResult(source, "session_secret_missing", "FOLIO_SESSION_SECRET required.");
  }
  if (!cookieValue?.includes(".")) {
    return errResult(source, "session_cookie_missing", "No folio_session httpOnly cookie.");
  }

  const [payloadB64, sig] = cookieValue.split(".");
  if (!payloadB64 || !sig) {
    return errResult(source, "session_cookie_malformed", "Expected payload.sig format.");
  }
  const expected = signPayload(payloadB64, secret);
  if (!safeEqual(sig, expected)) {
    return errResult(source, "session_sig_invalid", "HMAC mismatch — fail-closed.");
  }

  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const session = JSON.parse(json) as FolioSession;
    if (!session.sessionId || !session.userId || !session.expiresAt) {
      return errResult(source, "session_payload_invalid", "Missing required session fields.");
    }
    if (Date.parse(session.expiresAt) <= Date.now()) {
      return errResult(source, "session_expired", "folio_session expired — re-auth via Privy.");
    }
    return okResult("mainnet-read", source, session);
  } catch (e) {
    return errResult(source, "session_parse_failed", String(e));
  }
}

/** Extract folio_session from a Cookie header and verify. */
export function parseFolioSessionCookie(
  cookieHeader: string | null | undefined,
): AdapterResult<FolioSession> {
  const source = "folio.session";
  const auth = getAuthProviderStatus();
  if (!auth.ok) {
    return errResult(source, "session_requires_auth_keys", auth.detail ?? auth.reason);
  }
  if (!cookieHeader || !cookieHeader.includes(`${FOLIO_SESSION_COOKIE}=`)) {
    return errResult(source, "session_cookie_missing", "No folio_session httpOnly cookie.");
  }
  const match = cookieHeader.match(new RegExp(`${FOLIO_SESSION_COOKIE}=([^;]+)`));
  return verifyFolioSessionCookieValue(match?.[1] ? decodeURIComponent(match[1]) : null);
}

/** Cookie clear / attribute helper when session minting is enabled. */
export function folioSessionCookieAttributes(maxAgeSec = 60 * 60 * 12): string {
  const secure = process.env["NODE_ENV"] === "production" ? "; Secure" : "";
  return `${FOLIO_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}
