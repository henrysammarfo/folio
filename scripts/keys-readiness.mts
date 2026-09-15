/**
 * Print fail-closed key readiness for FOLIO (no secrets printed).
 * Usage: npx tsx scripts/keys-readiness.mts
 */
const rows: Array<{ name: string; ok: boolean; note: string; required?: boolean }> = [
  {
    name: "FOLIO_SESSION_SECRET",
    ok: (process.env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16,
    note: "watch-wallet + folio_session HMAC",
  },
  {
    name: "BROADCAST_PAUSED",
    ok: (process.env["BROADCAST_PAUSED"] ?? "true").toLowerCase() !== "false",
    note: "must stay paused until ≤~$1 funded demo",
  },
  {
    name: "SOLANA_RPC_URL",
    ok: Boolean(process.env["SOLANA_RPC_URL"]?.trim()),
    note: "optional — public mainnet fallback if unset",
    required: false,
  },
  {
    name: "BITQUERY_API_KEY",
    ok: Boolean(process.env["BITQUERY_API_KEY"]?.trim()),
    note: "wash tape — fail-closed when missing",
  },
  {
    name: "PYTH_API_KEY",
    ok: Boolean(process.env["PYTH_API_KEY"]?.trim()),
    note: "Hermes equity diverge — fail-closed when missing",
  },
  {
    name: "AGENTROUTER_API_KEY",
    ok: Boolean(process.env["AGENTROUTER_API_KEY"]?.trim()),
    note: "optional NL for paper agent — live spine always; WAF → spine-only",
    required: false,
  },
  {
    name: "PRIVY_APP_ID + PRIVY_APP_SECRET",
    ok: Boolean(
      process.env["PRIVY_APP_ID"]?.trim() && process.env["PRIVY_APP_SECRET"]?.trim(),
    ),
    note: "multi-tenant identity",
  },
  {
    name: "SUPABASE_URL + ANON + SERVICE_ROLE",
    ok: Boolean(
      process.env["SUPABASE_URL"]?.trim() &&
        process.env["SUPABASE_ANON_KEY"]?.trim() &&
        process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim(),
    ),
    note: "tenant_members + desk_preferences",
  },
  {
    name: "SUPABASE_JWT_SECRET",
    ok: (process.env["SUPABASE_JWT_SECRET"]?.trim().length ?? 0) >= 16,
    note: "user-JWT RLS path (sub=Privy DID); service-role labeled fallback when missing",
  },
];

let missing = 0;
for (const r of rows) {
  const mark = r.ok ? "SET " : "MISS";
  if (!r.ok && r.required !== false) missing += 1;
  console.log(`${mark}  ${r.name} — ${r.note}`);
}

const multiTenant =
  rows.find((r) => r.name.startsWith("PRIVY"))!.ok &&
  rows.find((r) => r.name.startsWith("SUPABASE"))!.ok &&
  rows.find((r) => r.name === "FOLIO_SESSION_SECRET")!.ok;

console.log("");
console.log(
  multiTenant
    ? "Multi-tenant path: keys present — mint httpOnly session after Privy JWT verify."
    : "Multi-tenant path: FAIL-CLOSED until Privy + Supabase + FOLIO_SESSION_SECRET are set.",
);
console.log(
  missing === 0
    ? "All listed keys present (still keep broadcast paused until funded)."
    : `${missing} key group(s) missing — see docs/KEYS_LANDING.md`,
);

process.exitCode = 0;
