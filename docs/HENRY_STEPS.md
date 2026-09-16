# FOLIO — Henry key steps (one at a time)

Do **one step**, screenshot, reply in chat. Do not skip ahead. I will give the next step after each reply.

Demo (hard-refresh): https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app

---

## Step 0 — Approve lab look ✅ DONE (netro-density)

1. Open https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app/lab/ui  
   Tap **Pick** on one id (recommended for Stocklana desk: **`netro-density`** — Preview on desk mounts the full NetroBNB **12-col** canvas with live AAPLx ×).  
   Other ids: `aionis-brand-plane` (already mirrors production `/` hero) · `cinematic-landing-21st` · `trade-journal-21st`  
   (optional) **Preview on desk** — opt-in only; Exit preview anytime; not a production merge.
2. Open https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app/lab/shaders  
   Tap **Pick** on one: `ink-ledger` · `ledger-mist` · `aurora-grid`
3. Reply in Cursor chat with the copied line (e.g. `Approve lab UI: netro-density`) + screenshot.

**Status:** `FOLIO_APPROVED_LAB_UI=netro-density` is set on Vercel (all targets). Production `/desk` mounts Netro 12-col; home Aionis hero stays preserved. Local **Pick** remains opt-in preview only.

Optional shader env (still unset):

| Name | Example |
|------|--------|
| `FOLIO_APPROVED_LAB_SHADER` | `ink-ledger` |

Refs extracted: **Aionis** brand-plane (production `/` already mirrors composition) · **NetroBNB** 12-col desk density (lab + desk preview) · live **21st.dev** MCP (Plasma 24346 + Trade Journal 27124 pinned).

### Optional before Step 2 — Vercel lab keys ✅ DONE

Live-verified 2026-09-16 on branch preview `/lab/ui`: **21st MCP connected**.

| Name | Status |
|------|--------|
| `API_KEY_21ST` | ✅ on Vercel (all targets) |
| `SHADERS_API_KEY` | ✅ on Vercel (Clerk may still 500; WebGL Plasma still ships) |
| `AGENTROUTER_*` · `TAVILY_API_KEY` · `TINYFISH_API_KEY` | ✅ on Vercel |

---

## Step 1 — Vercel secrets (no paid API) ✅ DONE

`FOLIO_SESSION_SECRET` + `BROADCAST_PAUSED=true` + `SOLANA_RPC_URL` are set on Vercel and verified live on Settings.

**Rotate** any Vercel token pasted in chat (Account → Tokens). Do not paste tokens in chat again.

What this unlocked: watch-wallet bind on the public demo. Broadcast stays paused.

---

## Step 2 — Bitquery ✅ KEYED (live wash) · Pyth ⚠️ keyed but not entitled

Stocklana live 2026-09-16 (jina re-scrape): **605** regs · **84** subs · **$121k** · deadline SEP 25 (timeline still Fri 18 Sep — conservative).

| Name | Status |
|------|--------|
| `BITQUERY_API_KEY` | ✅ on Vercel + `.env` — live wash probe **ok** (V2 `/graphql`, sample n=50) |
| `PYTH_API_KEY` | ⚠️ on Vercel + `.env` — Hermes auth works (BTC/ETH 200) but **403 Not entitled** for Equity.US.AAPL / Crypto.AAPLX / Crypto.AAPLON |

**Henry next for Pyth:** [Pyth Terminal](https://app.pyth.com/) → entitle equity / tokenized-stock feeds (or email data@dourolabs.xyz). Do not claim diverge green until entitled.

| Name | Where (click → copy key → paste Vercel + `.env`) |
|------|--------|
| `BITQUERY_API_KEY` | [Bitquery account](https://account.bitquery.io/) → API key |
| `PYTH_API_KEY` | [pyth.network](https://pyth.network/) → [Pyth Terminal](https://app.pyth.com/) / [Hermes docs](https://docs.pyth.network/price-feeds/how-pyth-works/hermes) → API key |

Paste targets: [folio Environment Variables](https://vercel.com/teamtitanlink/folio/settings/environment-variables) (Preview + Production) + local `.env`. Redeploy preview after paste.

After paste + redeploy, verify:

```bash
npm run smoke:goal   # requirement matrix — Empire leaves PARTIAL when wash live + Pyth entitled
npm run smoke:keys   # live probes for present keys
```

Full step-by-step with every provider link: `docs/KEYS_LANDING.md`.

---

## Step 3 — Privy ✅ KEYED (verify path armed)

| Name | Status / Where |
|------|--------|
| `PRIVY_APP_ID` | ✅ on Vercel + `.env` — [Privy Dashboard](https://dashboard.privy.io/) |
| `PRIVY_APP_SECRET` | ✅ on Vercel + `.env` — rotate after chat paste |

---

## Step 4 — Supabase ⚠️ KEYS SET · schema + JWT still needed

| Name | Status / Where |
|------|--------|
| `SUPABASE_URL` | ✅ on Vercel + `.env` |
| `SUPABASE_ANON_KEY` | ✅ JWT anon on Vercel + `.env` (prefer JWT over `sb_publishable_*` alone) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ on Vercel + `.env` (server only) |
| `SUPABASE_JWT_SECRET` | ❌ still missing — Project Settings → API → **JWT Secret** |

**Henry next:** (1) paste `SUPABASE_JWT_SECRET` (2) run `supabase/migrations/20260915_folio_tenants.sql` in SQL editor — tables currently missing (`PGRST205`) (3) optional seed `supabase/seed/demo_tenant.sql` (4) mint httpOnly `folio_session` from Settings with a real Privy access token.

**Rotate** every secret pasted in Cursor chat (Bitquery · Pyth · Privy · Supabase · Jupiter · any Vercel token).

Full checklist: `docs/KEYS_LANDING.md`.

---

## Still paused until funded
- Mainnet broadcast / swap send
- Custom program deploy (rent ≫ $1)
- Mentors/judges cold DMs (we draft after product looks premium)

## CI note
GitGuardian may flag historical public AAPLx mint in old commits — **Skip: false positive** (tip remediates; no Lovable history rewrite).
