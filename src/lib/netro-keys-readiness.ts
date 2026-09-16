/**
 * Compact Empire key readiness for Netro overview.
 * Never invents greens — only reports env presence flags from session readiness.
 */

export type NetroKeysReadiness = {
  missingCount: number;
  multiTenantLabel: string;
  rows: Array<{ id: string; label: string; status: string; ok: boolean }>;
};

export type NetroKeysReadinessInput = {
  bitqueryKeyPresent: boolean;
  pythApiKeyPresent: boolean;
  privyConfigured: boolean;
  supabaseConfigured: boolean;
  supabaseJwtConfigured: boolean;
  supabaseSchemaReady?: boolean;
  sessionSecretPresent: boolean;
  broadcastPaused: boolean;
  jupiterKeyPresent?: boolean;
};

export function buildNetroKeysReadiness(
  input: NetroKeysReadinessInput,
): NetroKeysReadiness {
  const multiTenantOk = input.privyConfigured && input.supabaseConfigured;
  const rows: NetroKeysReadiness["rows"] = [
    {
      id: "bitquery",
      label: "Bitquery wash",
      status: input.bitqueryKeyPresent ? "Keyed · live path" : "Missing · fail-closed",
      ok: input.bitqueryKeyPresent,
    },
    {
      id: "pyth",
      label: "Pyth Hermes",
      status: input.pythApiKeyPresent
        ? "Keyed · entitle Equity.US + Crypto.xStock before diverge live"
        : "Missing · fail-closed",
      ok: input.pythApiKeyPresent,
    },
    {
      id: "privy",
      label: "Privy",
      status: input.privyConfigured ? "Configured" : "Missing · identity off",
      ok: input.privyConfigured,
    },
    {
      id: "supabase",
      label: "Supabase",
      status: input.supabaseConfigured
        ? !input.supabaseSchemaReady
          ? "Configured · schema missing (run migration)"
          : input.supabaseJwtConfigured
            ? "Configured · user-JWT RLS"
            : "Configured · service-role fallback"
        : "Missing · tenants off",
      ok: input.supabaseConfigured,
    },
    {
      id: "session",
      label: "Session secret",
      status: input.sessionSecretPresent
        ? "Set · watch-wallet ready"
        : "Missing · bind blocked",
      ok: input.sessionSecretPresent,
    },
    {
      id: "broadcast",
      label: "Broadcast",
      status: input.broadcastPaused
        ? "Paused · ≤~$1 quote-only"
        : "Policy open · still unfunded",
      ok: input.broadcastPaused,
    },
  ];

  if (input.jupiterKeyPresent != null) {
    rows.splice(2, 0, {
      id: "jupiter",
      label: "Jupiter key",
      status: input.jupiterKeyPresent
        ? "Keyed · auth header"
        : "Optional · public path",
      ok: true, // optional — never counts as blocking miss
    });
  }

  const missingCount = rows.filter((r) => !r.ok && r.id !== "jupiter").length;

  return {
    missingCount,
    multiTenantLabel: multiTenantOk
      ? "Multi-tenant path armed"
      : "Multi-tenant fail-closed · paste Privy + Supabase",
    rows,
  };
}
