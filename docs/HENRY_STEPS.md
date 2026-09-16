# FOLIO — Henry key steps (one at a time)

Do **one step**, screenshot, reply in chat. Do not skip ahead. I will give the next step after each reply.

Demo (hard-refresh): https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app

---

## Step 0 — Approve lab look ✅ DONE (netro-density)

**Status:** `FOLIO_APPROVED_LAB_UI=netro-density` on Vercel. Production `/desk` mounts Netro; home Aionis hero preserved.

---

## Step 1 — Vercel secrets ✅ DONE

`FOLIO_SESSION_SECRET` + `BROADCAST_PAUSED=true` + `SOLANA_RPC_URL` set.

**Rotate** any Vercel token pasted in chat.

---

## Step 2 — Bitquery ✅ · Pyth ⚠️ DO THIS NEXT (be specific)

| Name | Status |
|------|--------|
| `BITQUERY_API_KEY` | ✅ live wash (V2 `/graphql`, n=50) |
| `PYTH_API_KEY` | ⚠️ Hermes auth works for **BTC/ETH only**. **403 Not entitled** for `Equity.US.AAPL/USD`, `Crypto.AAPLX/USD`, `Crypto.AAPLON/USD` |

### Exact Pyth clicks (not vague)

Your current key behaves like **Starter / crypto-only**. Equity is **not** on Starter.

1. Open **[app.pyth.com](https://app.pyth.com/)** → sign in.
2. Read pricing on **[pyth.network/price-feeds](https://www.pyth.network/price-feeds)**:
   - **Free $0** — Terminal view-only · **no API**
   - **Starter $500/mo** — **crypto API only** (explains why BTC/ETH = 200 and AAPL = 403)
   - **Pro from $2,500/mo** (or **Start free trial**) — equities + customize asset classes
3. In Terminal → **Subscribe / Upgrade / Start free trial** → choose **Pro** (not Starter).
4. Enable asset class **Equities** (and tokenized stock / RWA if the plan UI lists it).
5. Click **🔑 View your API key** → copy the **new** key.
6. Paste as `PYTH_API_KEY` on [Vercel env](https://vercel.com/teamtitanlink/folio/settings/environment-variables) (Preview + Production) **and** local `.env` → **redeploy**.
7. Prove live (must be HTTP **200**, not 403):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $PYTH_API_KEY" \
  "https://pyth.dourolabs.app/hermes/v2/updates/price/latest?ids[]=49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688"
# expect 200 for Equity.US.AAPL/USD
```

Also check Crypto.AAPLX feed `978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675`.

Stuck after Pro trial? Email **data@dourolabs.xyz** with subject:  
`Equity.US.AAPL Hermes 403 Not entitled — need equities on API key for FOLIO/Stocklana`

Docs: [Hermes](https://docs.pyth.network/price-feeds/how-pyth-works/hermes) · [Terminal](https://docs.pyth.network/price-feeds/pro/pyth-terminal) · [Acquire API key](https://docs.pyth.network/price-feeds/pro/acquire-api-key)

```bash
npm run smoke:goal   # Empire leaves PARTIAL until Equity/xStock entitled
```

---

## Step 3 — Privy ✅ KEYED

`PRIVY_APP_ID` + `PRIVY_APP_SECRET` on Vercel + `.env`. Rotate after chat paste.

---

## Step 4 — Supabase ⚠️ JWT ✅ · tables ✅ · **GRANTS NEEDED NOW**

| Name | Status |
|------|--------|
| `SUPABASE_URL` / anon / service_role | ✅ |
| `SUPABASE_JWT_SECRET` | ✅ set on Vercel + `.env` (2026-09-16) |
| Tables `tenants` / `tenant_members` / `desk_preferences` | ✅ exist (migration applied) |
| **GRANTs for `service_role`** | ❌ **42501 permission denied** — run grants SQL below |

### Paste this in Supabase → SQL editor → Run (exact)

File also at `supabase/migrations/20260916_folio_tenants_grants.sql`:

```sql
grant select, insert, update, delete on public.tenants to service_role;
grant select, insert, update, delete on public.tenant_members to service_role;
grant select, insert, update, delete on public.desk_preferences to service_role;
grant select on public.tenants to anon, authenticated;
grant select on public.tenant_members to anon, authenticated;
grant select, insert, update, delete on public.desk_preferences to anon, authenticated;
```

Then optional seed: `supabase/seed/demo_tenant.sql` (replace `privy_did_here` with a real Privy DID).

Then Settings → paste Privy access token → **Mint httpOnly session**.

**Rotate** every secret pasted in Cursor chat.

---

## Still paused until funded
- Mainnet broadcast / swap send
- Custom program deploy (rent ≫ $1)

## CI note
GitGuardian may flag historical public AAPLx mint — **Skip: false positive**.
