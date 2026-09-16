# FOLIO — Keys landing runbook (multi-tenant + wash + Pyth)

Use this **after** Henry replies with a lab candidate id (or in parallel if he asks).  
Do **one key family at a time**. Paste into Vercel (Preview + Production) and local `.env`. Never commit values. Rotate anything pasted in chat.

Demo Settings: https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app/desk/settings#empire-readiness  
Vercel env UI: https://vercel.com/teamtitanlink/folio/settings/environment-variables

Already on Vercel: `FOLIO_SESSION_SECRET` · `BROADCAST_PAUSED=true` · `SOLANA_RPC_URL` · `API_KEY_21ST` · `SHADERS_API_KEY` · `AGENTROUTER_*` · `TAVILY_API_KEY` · `TINYFISH_API_KEY` · `FOLIO_APPROVED_LAB_UI=netro-density`

Still need Henry paste (cannot invent): Bitquery · Pyth · Privy · Supabase · Jupiter (if gated). **Rotate any Vercel token pasted in chat.**

Lab MCP live-verified on branch preview `/lab/ui` (2026-09-16): **21st MCP connected**.

---

## Step-by-step with links (do in order)

### 1 — Bitquery (wash tape)

1. Open [Bitquery account](https://account.bitquery.io/) and sign in.
2. Create / copy an **API key**.
3. Vercel → Environment Variables → add `BITQUERY_API_KEY` for **Preview + Production** (+ Development if you want).
4. Redeploy preview.

Verify: `/desk/acquire` wash row leaves “key missing”; `/network` wash capability becomes live or labeled error (never silent green).

### 2 — Pyth Hermes (equity diverge)

1. Start at [pyth.network](https://pyth.network/) → developer / Hermes access.
2. Docs entry: [Hermes documentation](https://docs.pyth.network/price-feeds/how-pyth-works/hermes).
3. Create / copy API key → set `PYTH_API_KEY` on Vercel (all targets you use).
4. Redeploy.

Verify: Settings **PYTH_API_KEY** readiness turns set; `/truth` / acquire diverge can score Pyth vs Jupiter when both live. Without the key, Hermes price updates stay fail-closed.

### 3 — Privy (wallet identity)

1. Open [Privy Dashboard](https://dashboard.privy.io/) → create or select app.
2. Copy **App ID** → `PRIVY_APP_ID`.
3. Copy **App Secret** → `PRIVY_APP_SECRET`.
4. Paste both on Vercel (Preview + Production). Redeploy.

Verify: Settings auth badge still fail-closed until Supabase lands (both required for multi-tenant httpOnly sessions).

### 4 — Supabase (tenants)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your FOLIO project (or create one).
2. **Project Settings → API**:
   - Project URL → `SUPABASE_URL`
   - `anon` `public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**server only**)
3. **Project Settings → API → JWT Secret** (≥16) → `SUPABASE_JWT_SECRET`.
4. Paste all four on Vercel. Apply migration `supabase/migrations/20260915_folio_tenants.sql` (SQL editor). Optional seed: `supabase/seed/demo_tenant.sql`.
5. Redeploy.

`SUPABASE_JWT_SECRET` arms the **user-JWT RLS path**: server mints short-lived HS256 JWTs with `sub` = Privy DID so PostgREST policies (`auth.jwt() ->> 'sub'`) authorize tenants/prefs. Without the JWT secret, FOLIO keeps a labeled **service-role** fallback (not end-user authz).

Verify: Settings → paste Privy access token → mint httpOnly `folio_session` → tenant list non-empty only when `tenant_members` rows exist for that Privy subject.

### 5 — Optional Jupiter (if quotes gate)

1. Open [Jupiter Portal](https://portal.jup.ag/).
2. Create API key if rate-limited → `JUPITER_API_KEY` on Vercel.
3. Public quote path remains until 429 (TTL cache / fail-closed).

### 6 — Paste + redeploy checklist

1. Confirm vars on [folio Environment Variables](https://vercel.com/teamtitanlink/folio/settings/environment-variables).
2. Redeploy the Netro preview branch.
3. Hard-refresh `/desk/settings#empire-readiness` — readiness rows green only for keys that actually landed.
4. Expand **Empire keys** on `/desk` (collapsed by default so cards stay readable).
5. Keep `BROADCAST_PAUSED=true` until ≤~$1 funded demo is intentional.
6. Local:

```bash
npm run keys        # presence only (no secret values)
npm run smoke:keys  # live probes when keys present; fail-closed skips when missing
npm run replay      # unit + e2e + empire smoke + build
```

---

## Lab UI registries (optional · approve gate)

| Name | Where |
|------|--------|
| `API_KEY_21ST` | [21st.dev](https://21st.dev/) → API key → Vercel + `.env` |
| `SHADERS_API_KEY` | shaders.com → `ak_*` key → Vercel + `.env` |

After Henry replies `Approve lab UI: …` in chat, set on Vercel (Preview + Production) then redeploy:

| Name | Example |
|------|--------|
| `FOLIO_APPROVED_LAB_UI` | `netro-density` |
| `FOLIO_APPROVED_LAB_SHADER` | `ink-ledger` (optional) |

**2026-09-16:** `FOLIO_APPROVED_LAB_UI=netro-density` is set on Vercel (all targets). Production `/desk` overview mounts Netro 12-col; home **primary** hero stays the Aionis brand-plane. Landing below-fold may show a secondary Netro desk section — never replaces the first viewport. Local **Pick** alone never merges.

Empire trading keys still need Henry paste (Bitquery · Pyth · Privy · Supabase · optional Jupiter) — agents cannot invent provider secrets.

## Honesty rules (do not regress)

- No wash clear without Bitquery success
- No multi-tenant session without Privy verify + Supabase membership
- No Pyth price without `PYTH_API_KEY`
- No “Ready” NestUSD until endpoint verified
- Never claim unhackable / nation-state proof
- Paper agent: AgentRouter WAF/HTML → keep live spine, label NL skipped
- Lab picks stay local until Henry replies in chat
