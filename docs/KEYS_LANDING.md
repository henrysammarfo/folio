# FOLIO — Keys landing runbook (multi-tenant + wash + Pyth)

Use this **after** Henry replies with a lab candidate id (or in parallel if he asks).  
Do **one key family at a time**. Paste into Vercel (Preview + Production) and local `.env`. Never commit values. Rotate anything pasted in chat.

Demo: https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app/desk/settings

Already on Vercel: `FOLIO_SESSION_SECRET` · `BROADCAST_PAUSED=true` · `SOLANA_RPC_URL`

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
| `SUPABASE_SERVICE_ROLE_KEY` | Project settings → API (**server only**) |

Then:

```bash
# Apply migration (Supabase SQL editor or CLI)
# File: supabase/migrations/20260915_folio_tenants.sql
# Optional seed: supabase/seed/demo_tenant.sql
```

Verify: Settings → paste Privy access token → mint httpOnly `folio_session` → tenant list non-empty only when `tenant_members` rows exist for that Privy subject. Empty memberships stay fail-closed (no invented tenants).

---

## E — After keys: redeploy + checklist

1. Redeploy Vercel preview so env binds.
2. Hard-refresh `/desk/settings` — readiness rows green only for keys that actually landed.
3. `/network` matrix matches readiness (no false mainnet-read).
4. Keep `BROADCAST_PAUSED=true` until ≤~$1 funded demo is intentional.
5. Run `npm run replay` locally with the same keys.

## Honesty rules (do not regress)

- No wash clear without Bitquery success
- No multi-tenant session without Privy verify + Supabase membership
- No Pyth price without `PYTH_API_KEY`
- No “Ready” NestUSD until endpoint verified
- Never claim unhackable / nation-state proof
