# FOLIO — Keys landing runbook (multi-tenant + wash + Pyth)

Use this **after** Henry replies with a lab candidate id (or in parallel if he asks).  
Do **one key family at a time**. Paste into Vercel (Preview + Production) and local `.env`. Never commit values. Rotate anything pasted in chat.

Demo Settings: https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app/desk/settings#empire-readiness  
Vercel env UI: https://vercel.com/teamtitanlink/folio/settings/environment-variables

Already on Vercel: `FOLIO_SESSION_SECRET` · `BROADCAST_PAUSED=true` · `SOLANA_RPC_URL` · `API_KEY_21ST` · `SHADERS_API_KEY` · `AGENTROUTER_*` · `TAVILY_API_KEY` · `TINYFISH_API_KEY` · `FOLIO_APPROVED_LAB_UI=netro-density` · `BITQUERY_API_KEY` · `PYTH_API_KEY` · `PRIVY_*` · `SUPABASE_URL` · `SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `SUPABASE_JWT_SECRET` · `JUPITER_API_KEY`

SQL ✅ · JWT ✅ · **live free diverge** (Finnhub→Yahoo + CoinGecko; Pyth off ship path) ✅. Still need Henry: **Privy login mint + Join folio-demo**. **Rotate all chat-pasted secrets.**

Stocklana live 2026-09-16 (jina): **605** registered · **84** submissions · **$121k** · SEP 25.

Lab MCP live-verified on branch preview `/lab/ui` (2026-09-16): **21st MCP connected**.

---

## Step-by-step with links (do in order)

### 1 — Bitquery (wash tape)

1. Open [Bitquery account](https://account.bitquery.io/) and sign in.
2. Create / copy an **API key**.
3. Vercel → Environment Variables → add `BITQUERY_API_KEY` for **Preview + Production** (+ Development if you want).
4. Redeploy preview.

Verify: `/desk/acquire` wash row leaves “key missing”; `/network` wash capability becomes live or labeled error (never silent green).

### 2 — Equity reference for diverge — LIVE FREE (Pyth off ship path)

Ship diverge does **not** call Pyth Hermes. Live probes only — fail-closed if HTTP misses (no mocks/fixtures):

| Priority | Source | Cost |
|----------|--------|------|
| 1 | Finnhub `/quote` | Free key — [finnhub.io/register](https://finnhub.io/register) → `FINNHUB_API_KEY` |
| 2 | Yahoo chart v8 | Keyless · labeled `YAHOO:AAPL` |
| secondary | CoinGecko `*-xstock` | Free |
| venue | Jupiter Price v3 | Free (already wired) |

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
3. **Project Settings → API → JWT Secret** (≥16) → `SUPABASE_JWT_SECRET`. ✅ pasted + on Vercel.
4. Paste all four on Vercel (`SUPABASE_JWT_SECRET` included). ✅
5. SQL editor — ✅ DONE:
   1. `supabase/migrations/20260915_folio_tenants.sql` (tables + RLS)
   2. `supabase/migrations/20260916_folio_tenants_grants.sql` (service_role GRANTs)
   3. Optional seed: `supabase/seed/demo_tenant.sql` (`folio-demo`)
6. Redeploy if needed.

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
npm run smoke:goal  # Stocklana requirement matrix (loads .env — premium UI DONE when FOLIO_APPROVED_LAB_UI=netro-density)
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

---

## TradingView (live charts)

### Option A — Free widget (shipped · no key)

FOLIO embeds TradingView’s **Advanced Chart** widget on Acquire + Position detail.

1. No API key. No Vercel env.
2. Underlying equities: AAPLx → `NASDAQ:AAPL`, NVDAx → `NASDAQ:NVDA`, TSLAx → `NASDAQ:TSLA`.
3. Keep the TradingView attribution link (required by widget terms).
4. Widget data is display-only — not for automated trading / order generation.

Docs: https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/

### Option B — Charting Library (optional · license)

Only if we need full self-host / custom Solana xStock candles:

1. Apply for TradingView Charting Library access (company / public web project).
2. Wait for GitHub invite to the private library repo.
3. Host `charting_library/` privately (not redistributable publicly).
4. Implement a UDF/datafeed against FOLIO price spine (Yahoo / Jupiter / Bitquery) — never invent candles.
5. Store any license tokens only in Vercel env — never commit.

You do **not** need Option B for Stocklana ship. Say the word if you want Option B and I will walk the application form fields.

## Honesty rules (do not regress)

- No wash clear without Bitquery success
- No multi-tenant session without Privy verify + Supabase membership
- No Pyth price without `PYTH_API_KEY`
- No “Ready” NestUSD until endpoint verified
- Never claim unhackable / nation-state proof
- Paper agent: AgentRouter WAF/HTML → keep live spine, label NL skipped
- Lab picks stay local until Henry replies in chat
