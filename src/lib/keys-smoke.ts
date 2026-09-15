/**
 * Post-key production probes — verify each key-gated Empire path without inventing greens.
 * Missing keys → labeled skip/fail-closed. Present keys → live adapter or auth check.
 */

export type KeySmokeRow = {
  id: string;
  present: boolean;
  status: "ok" | "fail-closed" | "skipped" | "error";
  detail: string;
};

export type KeySmokeEnv = {
  bitquery: boolean;
  pyth: boolean;
  privy: boolean;
  supabase: boolean;
  supabaseJwt: boolean;
  sessionSecret: boolean;
  agentRouter: boolean;
  broadcastPaused: boolean;
};

export function readKeySmokeEnv(
  env: NodeJS.ProcessEnv = process.env,
): KeySmokeEnv {
  return {
    bitquery: Boolean(env["BITQUERY_API_KEY"]?.trim()),
    pyth: Boolean(env["PYTH_API_KEY"]?.trim()),
    privy: Boolean(env["PRIVY_APP_ID"]?.trim() && env["PRIVY_APP_SECRET"]?.trim()),
    supabase: Boolean(
      env["SUPABASE_URL"]?.trim() &&
        env["SUPABASE_ANON_KEY"]?.trim() &&
        env["SUPABASE_SERVICE_ROLE_KEY"]?.trim(),
    ),
    supabaseJwt:
      Boolean(env["SUPABASE_URL"]?.trim()) &&
      Boolean(env["SUPABASE_ANON_KEY"]?.trim()) &&
      (env["SUPABASE_JWT_SECRET"]?.trim().length ?? 0) >= 16,
    sessionSecret: (env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16,
    agentRouter: Boolean(env["AGENTROUTER_API_KEY"]?.trim()),
    broadcastPaused: (env["BROADCAST_PAUSED"] ?? "true").toLowerCase() !== "false",
  };
}

/** Classify readiness before live probes — pure, unit-tested. */
export function classifyKeySmokeBaseline(env: KeySmokeEnv): KeySmokeRow[] {
  return [
    {
      id: "broadcast",
      present: env.broadcastPaused,
      status: env.broadcastPaused ? "ok" : "fail-closed",
      detail: env.broadcastPaused
        ? "BROADCAST_PAUSED — quote-only · ≤~$1"
        : "Broadcast policy not paused — refuse funded theater until intentional",
    },
    {
      id: "session_secret",
      present: env.sessionSecret,
      status: env.sessionSecret ? "ok" : "fail-closed",
      detail: env.sessionSecret
        ? "FOLIO_SESSION_SECRET ≥16 — watch-wallet + cookie signing"
        : "Missing FOLIO_SESSION_SECRET — watch-wallet bind fail-closed",
    },
    {
      id: "bitquery",
      present: env.bitquery,
      status: env.bitquery ? "ok" : "skipped",
      detail: env.bitquery
        ? "BITQUERY_API_KEY present — will probe wash gate"
        : "BITQUERY_API_KEY missing — wash stays fail-closed",
    },
    {
      id: "pyth",
      present: env.pyth,
      status: env.pyth ? "ok" : "skipped",
      detail: env.pyth
        ? "PYTH_API_KEY present — will probe Hermes equity"
        : "PYTH_API_KEY missing — Hermes diverge fail-closed",
    },
    {
      id: "privy",
      present: env.privy,
      status: env.privy ? "ok" : "skipped",
      detail: env.privy
        ? "Privy keys present — will probe verify path"
        : "Privy keys missing — multi-tenant identity fail-closed",
    },
    {
      id: "supabase",
      present: env.supabase,
      status: env.supabase ? "ok" : "skipped",
      detail: env.supabase
        ? "Supabase keys present — will probe REST reachability"
        : "Supabase keys missing — tenants/prefs fail-closed",
    },
    {
      id: "supabase_jwt",
      present: env.supabaseJwt,
      status: env.supabaseJwt ? "ok" : "skipped",
      detail: env.supabaseJwt
        ? "SUPABASE_JWT_SECRET present — user-JWT RLS path armed (sub=Privy DID)"
        : "SUPABASE_JWT_SECRET missing — service-role labeled fallback until set",
    },
    {
      id: "multi_tenant",
      present: env.privy && env.supabase && env.sessionSecret,
      status:
        env.privy && env.supabase && env.sessionSecret ? "ok" : "fail-closed",
      detail:
        env.privy && env.supabase && env.sessionSecret
          ? env.supabaseJwt
            ? "Privy + Supabase + session secret + JWT secret — multi-tenant mint + RLS path ready"
            : "Privy + Supabase + session secret — mint ready; add SUPABASE_JWT_SECRET for RLS user path"
          : "Multi-tenant FAIL-CLOSED until Privy + Supabase + FOLIO_SESSION_SECRET",
    },
    {
      id: "agentrouter",
      present: env.agentRouter,
      status: env.agentRouter ? "ok" : "skipped",
      detail: env.agentRouter
        ? "AGENTROUTER_API_KEY present — NL optional (WAF → spine-only)"
        : "AgentRouter missing — paper agent live spine only",
    },
  ];
}

export function summarizeKeySmoke(rows: KeySmokeRow[]): {
  blockingMissing: string[];
  probeReady: string[];
  errors: string[];
} {
  const blocking = ["bitquery", "pyth", "privy", "supabase"] as const;
  const blockingMissing = blocking
    .filter((id) => {
      const row = rows.find((r) => r.id === id);
      return row && !row.present;
    })
    .map(String);
  const probeReady = rows
    .filter((r) => r.present && (r.id === "bitquery" || r.id === "pyth" || r.id === "supabase" || r.id === "privy"))
    .map((r) => r.id);
  const errors = rows.filter((r) => r.status === "error").map((r) => `${r.id}: ${r.detail}`);
  return { blockingMissing, probeReady, errors };
}
