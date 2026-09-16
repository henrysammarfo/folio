# FOLIO — Henry key steps (one at a time)

Demo (hard-refresh): https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app

---

## Step 0–1 · Lab + Vercel secrets ✅ DONE

`FOLIO_APPROVED_LAB_UI=netro-density` · session secret · broadcast paused · RPC.

---

## Step 2 · Bitquery ✅ · Pyth ⚠️ DO THIS — Equity.US + Crypto.xStock

Wash is **live**. Current Pyth key authenticates Hermes but both Stocklana feeds return **403 Not entitled**:

| Symbol | Feed id | Status now |
|--------|---------|------------|
| `Equity.US.AAPL/USD` | `49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688` | 403 Not entitled |
| `Crypto.AAPLX/USD` (xStock) | `978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675` | 403 Not entitled |

Starter = crypto majors only. FOLIO diverge stays **fail-closed** until both families are entitled.

### Exact clicks (be specific)
1. Open **[app.pyth.com](https://app.pyth.com/)** → sign in  
2. Pricing: [pyth.network/price-feeds](https://www.pyth.network/price-feeds) — **Starter $500 = crypto majors**; need **Pro free trial** / **U.S. Equities** / **All Asset Classes** (not Starter)  
3. **Subscribe / Upgrade / Start free trial**  
4. Enable entitlements that cover **`Equity.US.*`** and **`Crypto.*X`** (xStock). In Terminal search confirm `Equity.US.AAPL` + `Crypto.AAPLX` are entitled for your key  
5. **🔑 View your API key** → replace `PYTH_API_KEY` on [Vercel env](https://vercel.com/teamtitanlink/folio/settings/environment-variables) → redeploy  
6. Prove **HTTP 200** on both feed ids above (not 403)  
7. Stuck → email **data@dourolabs.xyz** subject `Equity.US / Crypto.xStock Hermes 403 Not entitled`

---

## Step 3 · Privy ✅ KEYED

App ID + secret on Vercel. Rotate after chat paste.

---

## Step 4 · Supabase ✅ KEYS + JWT + SCHEMA READY

| Item | Status |
|------|--------|
| URL / anon / service_role / JWT secret | ✅ (incl. Henry-pasted `SUPABASE_JWT_SECRET`) |
| Tables + **service_role GRANTs** | ✅ live (`tenants` reachable) |
| `folio-demo` tenant | ✅ seeded |

### Henry next — mint multi-tenant session
1. Open [Settings](https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app/desk/settings#settings-session)  
2. Privy Dashboard → **Allowed origins** add the demo origin (and localhost if testing)  
3. Click **Log in with Privy** → then **Mint httpOnly session from Privy login** (or paste `getAccessToken()` JWT as fallback)  
4. If memberships empty → click **Join folio-demo as owner**  
5. Confirm Active tenant shows `folio-demo`

**Rotate** every secret pasted in chat.

---

## Still paused until funded
- Mainnet broadcast / swap send  
- Custom program deploy (rent ≫ $1)

## Goal matrix
`npm run smoke:goal` — Empire PARTIAL until Equity.US + Crypto.xStock entitled; multi-tenant PARTIAL until Privy mint + Join folio-demo.
