# FOLIO — Fully active keys (2026-09-19 live probe)

> Never paste secrets in chat. Put them only in Vercel + local `.env` (gitignored).  
> Probe: `npm run keys` · `npm run smoke:keys` · `npm run smoke:goal`

## Status board

| Capability | Env | Present? | Live? | What Henry must do |
|---|---|---|---|---|
| Session / watch-wallet | `FOLIO_SESSION_SECRET` | ✅ Vercel | ✅ | Keep · rotate if chat-pasted |
| Broadcast policy | `BROADCAST_PAUSED=true` | ✅ | Paused **on purpose** | Leave `true` until funded ≤~$1 fill demo |
| Solana reads | `SOLANA_RPC_URL` | ✅ | ✅ | Optional upgrade to paid RPC later |
| **Wash tape** | `BITQUERY_API_KEY` | ✅ | ❌ **402 quota** | **Top up / upgrade Bitquery → new token → replace env** |
| Equity diverge | free Yahoo (+ optional Finnhub) | Yahoo ✅ | ✅ live | Optional: add `FINNHUB_API_KEY` |
| Pyth Hermes | `PYTH_API_KEY` | ✅ | ❌ **403 not entitled** | Optional Stocklana bounty: request **equity feed entitlement** |
| Privy identity | `PRIVY_APP_ID` + `SECRET` | ✅ | ✅ keyed | Add **Allowed origin** = production URL |
| Supabase tenants | URL + anon + service + JWT | ✅ | ✅ REST OK | Already migrated + `folio-demo` seeded |
| Jupiter quotes | `JUPITER_API_KEY` | ✅ | ✅ | Keep for 429 headroom |
| Paper agent NL | `AGENTROUTER_*` | ✅ | optional | WAF → spine-only is OK |
| Lab chrome | `FOLIO_APPROVED_LAB_UI` | ✅ | ✅ netro | Done |

**shipReady today:** `false` only because wash is keyed-but-not-live (402). Multi-tenant / premium UI / quote-only / honesty = DONE.

---

## Do these 3 things (order)

### 1) Bitquery — unblock wash (REQUIRED for “fully active”)

Live error: `HTTP 402 … usage quota reached`.

1. Open https://account.bitquery.io/ → **Billing → Select Plan**
2. Upgrade (Personal 100K pts is enough to start) **or** Top up API points
3. **Authorization → Tokens → Generate new token** (old token can keep old limits)
4. Vercel → folio → Environment Variables → edit `BITQUERY_API_KEY` (Production + Preview + Development)
5. Local `.env` — same value (never commit)
6. Redeploy production
7. Verify: `npm run smoke:keys` → `bitquery_live` **OK** · Buy desk wash leaves fail-closed-for-quota

Docs: https://docs.bitquery.io/docs/ide/paid/ · https://docs.bitquery.io/docs/start/errors/

### 2) Privy — production Allowed origin (REQUIRED for browser login)

Keys already work for **Bootstrap folio-demo session**. Browser “Log in with Privy” needs the domain allowlisted:

1. https://dashboard.privy.io/ → your app → **Configuration → App settings → Domains**
2. Allowed origins — paste **exactly**:
   - `https://folio-tawny-one.vercel.app`
   - (optional) preview hosts as needed — Privy rejects `*.vercel.app` wildcards
3. Hard-refresh https://folio-tawny-one.vercel.app/desk/settings → **Log in with Privy** or **Bootstrap folio-demo session**

### 3) Optional upgrades (not blocking Stocklana honesty)

| Key | Get it | Why |
|---|---|---|
| `FINNHUB_API_KEY` | https://finnhub.io/register (free) | Stronger equity ref before Yahoo fallback |
| Pyth equity entitlement | https://docs.pyth.network/price-feeds/pro/acquire-api-key · ask for Equity.US / xStock feeds | Only if chasing **Pyth bounty**; ship path already uses Yahoo |
| Paid Solana RPC | Helius / Triton / etc. | Replace public `api.mainnet-beta.solana.com` under load |

**Do not** set `BROADCAST_PAUSED=false` until you intentionally fund a ≤~$1 mainnet fill demo.

---

## After Bitquery top-up — paste checklist

In Vercel (https://vercel.com/teamtitanlink/folio/settings/environment-variables):

- [ ] New `BITQUERY_API_KEY` on production + preview + development
- [ ] Redeploy production
- [ ] Privy Allowed origin includes `https://folio-tawny-one.vercel.app`
- [ ] (Optional) `FINNHUB_API_KEY` on production + preview + development

Then tell the agent: **“Bitquery topped up + redeployed”** — we re-run `smoke:keys` / `smoke:goal` (no secret values in chat).

---

## What “fully active” means vs still paused

| Active now | Still paused by policy |
|---|---|
| Markets board · Buy quotes · pairs · PreStocks · Tessera | Mainnet **swap broadcast** |
| Truth / Scaled UI · Kamino LTV reads | Mainnet **borrow broadcast** |
| Sessions (bootstrap / Privy+Supabase) | Custom program deploy |
| Wash **after** Bitquery quota fixed | — |

Never claim unhackable. Residual risk stays in `memory/THREAT_MODEL.md`.
