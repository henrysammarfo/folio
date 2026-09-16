# FOLIO — Henry key steps (one at a time)

Demo (hard-refresh): https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app

---

## Step 0–1 · Lab + Vercel secrets ✅ DONE

`FOLIO_APPROVED_LAB_UI=netro-density` · session secret · broadcast paused · RPC.

---

## Step 2 · Bitquery ✅ · Equity diverge ✅ FREE (no Pro $)

Wash is **live**. Pyth Hermes still **403 Not entitled** for `Equity.US.AAPL` + `Crypto.AAPLX` on Starter/unpaid trial — **do not pay ~$2.5k/mo**.

FOLIO diverge now uses a **free cascade** (labeled · never claimed as Pyth):

1. **Pyth Hermes** — if Equity.US entitled on your key  
2. **Finnhub free** (optional) — [finnhub.io/register](https://finnhub.io/register) → `FINNHUB_API_KEY`  
3. **Yahoo chart** (keyless) — `query1.finance.yahoo.com/v8/finance/chart/AAPL` → labeled `YAHOO:AAPL`  
4. **CoinGecko** — `apple-xstock` free secondary when Hermes Crypto.xStock is 403  

Venue side remains **Jupiter Price** (already free).

### Optional only — Pyth bounty track
If you want Stocklana Pyth bounty points: try free Pro trial asset classes at [app.pyth.com](https://app.pyth.com/) or email **data@dourolabs.xyz**. Not required for FOLIO ship.

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
`npm run smoke:goal` — Empire should light with free Yahoo equity ref; multi-tenant PARTIAL until Privy mint + Join.
