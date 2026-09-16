# FOLIO — Henry key steps (one at a time)

Do **one step**, screenshot, reply in chat. Do not skip ahead. I will give the next step after each reply.

Demo (hard-refresh): https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app

---

## Step 0 — Approve lab look ✅ DONE (netro-density)

1. Open https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app/lab/ui  
   Tap **Pick** on one id (recommended for Stocklana desk: **`netro-density`** — Preview on desk mounts the full NetroBNB **12-col** canvas with live AAPLx ×).  
   Other ids: `aionis-brand-plane` (already mirrors production `/` hero) · `cinematic-landing-21st` · `trade-journal-21st`  
   (optional) **Preview on desk** — opt-in only; Exit preview anytime; not a production merge.
2. Open https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app/lab/shaders  
   Tap **Pick** on one: `ink-ledger` · `ledger-mist` · `aurora-grid`
3. Reply in Cursor chat with the copied line (e.g. `Approve lab UI: netro-density`) + screenshot.

Until you reply in chat, premium chrome stays off production home/desk on purpose.

**After your chat reply**, the agent sets Vercel env (then redeploys):

| Name | Example |
|------|--------|
| `FOLIO_APPROVED_LAB_UI` | `netro-density` |
| `FOLIO_APPROVED_LAB_SHADER` | `ink-ledger` (optional) |

Production `/desk` then mounts that chrome (yellow banner · Netro 12-col when UI=`netro-density`). Local **Pick** alone never merges.

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

## Step 2 — Bitquery (after Step 0 Pick)

Only when I say so. Needed for live wash tape (fail-closed until then).

| Name | Where |
|------|--------|
| `BITQUERY_API_KEY` | Bitquery dashboard → API key → paste into Vercel + local `.env` |

Optional same sitting (unlocks Pyth diverge vs Jupiter — Pyth bounty):

| Name | Where |
|------|--------|
| `PYTH_API_KEY` | [Pyth Terminal](https://pyth.network/) → API key → Vercel + `.env` (Hermes auth required since Aug 2026) |

---

## Step 3 — Privy (after Step 2)

| Name | Where |
|------|--------|
| `PRIVY_APP_ID` | Privy dashboard → App |
| `PRIVY_APP_SECRET` | Privy dashboard → App |

---

## Step 4 — Supabase (after Step 3)

| Name | Where |
|------|--------|
| `SUPABASE_URL` | Project settings → API |
| `SUPABASE_ANON_KEY` | Project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Project settings → API (server only — never expose to browser) |
| `SUPABASE_JWT_SECRET` | Project settings → API → **JWT Secret** (≥16) |

Full checklist: `docs/KEYS_LANDING.md`.

---

## Still paused until funded
- Mainnet broadcast / swap send
- Custom program deploy (rent ≫ $1)
- Mentors/judges cold DMs (we draft after product looks premium)

## CI note
GitGuardian may flag historical public AAPLx mint in old commits — **Skip: false positive** (tip remediates; no Lovable history rewrite).
