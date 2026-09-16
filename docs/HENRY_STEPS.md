# FOLIO — Henry key steps (one at a time)

Demo (hard-refresh): https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app

---

## Step 0–1 · Lab + Vercel secrets ✅ DONE

`FOLIO_APPROVED_LAB_UI=netro-density` · session secret · broadcast paused · RPC.

---

## Step 2 · Bitquery ✅ · Pyth ⚠️ DO THIS (Pro, not Starter)

Wash is **live**. Current Pyth key = **crypto-only** (BTC/ETH 200 · AAPL **403 Not entitled**).

### Exact clicks
1. Open **[app.pyth.com](https://app.pyth.com/)** → sign in  
2. Pricing: [pyth.network/price-feeds](https://www.pyth.network/price-feeds) — **Starter $500 = crypto only**; **Pro** (free trial OK) = equities  
3. **Subscribe / Upgrade / Start free trial** → pick **Pro**  
4. Enable asset class **Equities**  
5. **🔑 View your API key** → replace `PYTH_API_KEY` on [Vercel env](https://vercel.com/teamtitanlink/folio/settings/environment-variables) → redeploy  
6. Prove HTTP **200** on Equity.US.AAPL feed `49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688`  
7. Stuck → email **data@dourolabs.xyz** subject `Equity.US.AAPL Hermes 403 Not entitled`

---

## Step 3 · Privy ✅ KEYED

App ID + secret on Vercel. Rotate after chat paste.

---

## Step 4 · Supabase ✅ KEYS + JWT + SCHEMA READY

| Item | Status |
|------|--------|
| URL / anon / service_role / JWT secret | ✅ |
| Tables + **service_role GRANTs** | ✅ live (`tenants` reachable) |
| `folio-demo` tenant | ✅ seeded |

### Henry next — mint multi-tenant session
1. Open [Settings](https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app/desk/settings#settings-session)  
2. Paste a **real Privy access token** → **Mint httpOnly session**  
3. If memberships empty → click **Join folio-demo as owner** (attaches your Privy DID · remints cookie)  
4. Confirm Active tenant shows `folio-demo`

**Rotate** every secret pasted in chat.

---

## Still paused until funded
- Mainnet broadcast / swap send  
- Custom program deploy (rent ≫ $1)

## Goal matrix
`npm run smoke:goal` — Empire PARTIAL until Pyth Pro equities; multi-tenant PARTIAL until Privy mint + Join folio-demo.
