import { errResult, okResult, type AdapterResult } from "../adapters/types";

export type AuthProviderStatus = {
  privyConfigured: boolean;
  supabaseConfigured: boolean;
  sessionReady: boolean;
  persistence: "httpOnly-server" | "unavailable";
  note: string;
};

/** Fail-closed auth readiness — never invent a wallet session from localStorage. */
export function getAuthProviderStatus(): AdapterResult<AuthProviderStatus> {
  const source = "folio.auth";
  const privyConfigured = Boolean(
    process.env["PRIVY_APP_ID"]?.trim() && process.env["PRIVY_APP_SECRET"]?.trim(),
  );
  const supabaseConfigured = Boolean(
    process.env["SUPABASE_URL"]?.trim() &&
      process.env["SUPABASE_ANON_KEY"]?.trim() &&
      process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim(),
  );
  if (!privyConfigured || !supabaseConfigured) {
    return errResult(
      source,
      "auth_keys_missing",
      "Privy + Supabase keys required for multi-tenant httpOnly sessions. Desk prefs stay non-authoritative until wired.",
    );
  }
  return okResult("mainnet-read", source, {
    privyConfigured,
    supabaseConfigured,
    sessionReady: false,
    persistence: "httpOnly-server",
    note: "Keys present — session mint + RLS membership wiring is next; no localStorage auth.",
  });
}

export type DeskPreference = {
  corporateActionAlerts: boolean;
  strictFailClosed: boolean;
};

/** Server-persisted prefs stub — fail-closed without Supabase. */
export async function loadDeskPreferences(
  _tenantId: string | null,
): Promise<AdapterResult<DeskPreference>> {
  void _tenantId;
  const auth = getAuthProviderStatus();
  if (!auth.ok) {
    return errResult("folio.prefs", "prefs_require_auth", auth.detail ?? auth.reason);
  }
  return errResult(
    "folio.prefs",
    "prefs_table_not_wired",
    "Supabase prefs table not migrated yet — refusing to fall back to localStorage.",
  );
}
