# FOLIO — Keys landing runbook (multi-tenant + wash + Pyth)

Use this **after** Henry replies with a lab candidate id (or in parallel if he asks).  
Do **one key family at a time**. Paste into Vercel (Preview + Production) and local `.env`. Never commit values. Rotate anything pasted in chat.

Demo: https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app/desk/settings

Already on Vercel: `FOLIO_SESSION_SECRET` · `BROADCAST_PAUSED=true` · `SOLANA_RPC_URL` · `API_KEY_21ST` · `SHADERS_API_KEY` · `AGENTROUTER_*` · `TAVILY_API_KEY` · `TINYFISH_API_KEY`

Lab MCP live-verified on branch preview `/lab/ui` (2026-09-16): **21st MCP connected**.

---

## A — Bitquery (wash tape)

| Name | Where |
|------|--------|
| `BITQUERY_API_KEY` | Bitquery dashboard → API key |

Verify: `/desk/acquire` wash row leaves “key missing”; `/network` wash capability becomes live or labeled error (never silent green).

---

## B — Pyth Hermes (equity diverge)

| Name | Where |
|------|--------|
| `PYTH_API_KEY` | [Pyth Terminal](https://pyth.network/) → API key |

Verify: Settings **PYTH_API_KEY** readiness turns set; `/truth` / acquire diverge can score Pyth vs Jupiter when both live. Without the key, Hermes price updates stay fail-closed (Aug 2026 auth).

---

## C — Privy (wallet identity)

| Name | Where |
|------|--------|
| `PRIVY_APP_ID` | Privy dashboard → App |
| `PRIVY_APP_SECRET` | Privy dashboard → App |

Verify: Settings auth badge still fail-closed until Supabase lands (both required for multi-tenant httpOnly sessions).

---

## D — Supabase (tenants)

| Name | Where |
|------|--------|
| `SUPABASE_URL` | Project settings → API |
| `SUPABASE_ANON_KEY` | Project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project settings → API (**server only** · labeled fallback) |
| `SUPABASE_JWT_SECRET` | Project settings → API → **JWT Secret** (≥16) |

`SUPABASE_JWT_SECRET` arms the **user-JWT RLS path**: server mints short-lived HS256 JWTs with `sub` = Privy DID so PostgREST policies (`auth.jwt() ->> 'sub'`) authorize tenants/prefs. Desk prefs write policies require owner/trader membership (viewers read-only). Without the JWT secret, FOLIO keeps a labeled **service-role** fallback (not end-user authz).

Then:

```bash
# Apply migration (Supabase SQL editor or CLI)
# File: supabase/migrations/20260915_folio_tenants.sql
# Optional seed: supabase/seed/demo_tenant.sql
```

Verify: Settings → paste Privy access token → mint httpOnly `folio_session` → tenant list non-empty only when `tenant_members` rows exist for that Privy subject. Empty memberships stay fail-closed (no invented tenants). Settings RLS note should say **user-JWT path armed** when JWT secret is set.
---

## E — Lab UI registries (optional · approve gate)

| Name | Where |
|------|--------|
| `API_KEY_21ST` | 21st.dev → API key → Vercel + `.env` |
| `SHADERS_API_KEY` | shaders.com → `ak_*` key → Vercel + `.env` |

Verify: Settings readiness rows for lab keys; `/lab/ui` shows MCP connected when `API_KEY_21ST` set; `/lab/shaders` probes shaders.com (Clerk may still 500 — WebGL Plasma from 21st still runs). Never auto-merge lab picks without Henry chat reply.

After Henry replies `Approve lab UI: …` in chat, set on Vercel (Preview + Production) then redeploy:

| Name | Example |
|------|--------|
| `FOLIO_APPROVED_LAB_UI` | `netro-density` |
| `FOLIO_APPROVED_LAB_SHADER` | `ink-ledger` (optional) |

Production `/desk` then shows a yellow **Henry-approved** banner and mounts that chrome. Local Pick / Preview alone never sets these.

---

## F — After keys: redeploy + checklist

1. Redeploy Vercel preview so env binds.
2. Hard-refresh `/desk/settings` — readiness rows green only for keys that actually landed.
3. `/network` matrix matches readiness (no false mainnet-read).
4. Keep `BROADCAST_PAUSED=true` until ≤~$1 funded demo is intentional.
5. Run locally with the same keys:

```bash
npm run keys        # presence only (no secret values)
npm run smoke:keys  # live probes when keys present; fail-closed skips when missing
npm run replay      # unit + e2e + empire smoke + build
```

`smoke:keys` never invents a wash clear or multi-tenant session. Empty Privy token must fail-closed. Supabase probe checks REST `tenants` via service-role (apply migration first).

## Honesty rules (do not regress)

- No wash clear without Bitquery success
- No multi-tenant session without Privy verify + Supabase membership
- No Pyth price without `PYTH_API_KEY`
- No “Ready” NestUSD until endpoint verified
- Never claim unhackable / nation-state proof
- Paper agent: AgentRouter WAF/HTML → keep live spine, label NL skipped
- Lab picks stay local until Henry replies in chat
