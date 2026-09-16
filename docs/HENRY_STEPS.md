# FOLIO — Henry key steps (one at a time)

Demo (hard-refresh): https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app

---

## Step 0–1 · Lab + Vercel secrets ✅ DONE

`FOLIO_APPROVED_LAB_UI=netro-density` · session secret · broadcast paused · RPC.

---

## Step 2 · Bitquery ✅ · Equity diverge ✅ LIVE FREE (Pyth off ship path)

Wash is **live**. Ship diverge does **not** call Pyth Hermes (no Pro $).

Live cascade (fail-closed on HTTP miss — no invented prices):

1. **Finnhub** (optional) — [finnhub.io/register](https://finnhub.io/register) → `FINNHUB_API_KEY`
2. **Yahoo chart** (keyless) — labeled `YAHOO:AAPL`
3. **CoinGecko** `apple-xstock` secondary
4. Venue = **Jupiter Price** (already free)

---

## Step 3 · Privy ✅ KEYED

App ID + secret on Vercel. Rotate after chat paste.

---

## Step 4 · Supabase ✅ KEYS + JWT + SCHEMA READY

| Item | Status |
|------|--------|
| URL / anon / service_role / JWT secret | ✅ |
| Tables + **service_role GRANTs** | ✅ live |
| `folio-demo` tenant | ✅ seeded |

### Henry next — mint multi-tenant session (LAST BLOCKER)
1. Privy Dashboard → **Configuration → App settings → Domains** → Allowed origins → paste exactly:  
   `https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app`  
   (Privy rejects `*.vercel.app` wildcards; `https://*.teamtitanlink.vercel.app` OK if you own that suffix.)
2. Open [Settings](https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app/desk/settings#settings-session)
3. Click **Log in with Privy (auto-mints)** — session cookie sets after login
4. If memberships empty → **Join folio-demo as owner**
5. Confirm Active tenant shows `folio-demo`

**Rotate** every secret pasted in chat.

---

## Still paused until funded
- Mainnet broadcast / swap send  
- Custom program deploy (rent ≫ $1)

## Goal matrix
`npm run smoke:goal` — Empire DONE with live Yahoo equity ref; multi-tenant PARTIAL until Privy mint + Join.
