# FOLIO — Henry key steps (one at a time)

Do **one step**, screenshot, reply in chat. Do not skip ahead. I will give the next step after each reply.

Demo (hard-refresh): https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app

---

## Step 0 — Approve lab look ← DO THIS NEXT

1. Open https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app/lab/ui  
   Tap **Pick** on one: `aionis-brand-plane` · `netro-density` · `cinematic-landing-21st` · `trade-journal-21st`  
   (optional) **Preview on desk** — opt-in only; Exit preview anytime; not a production merge.
2. Open https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app/lab/shaders  
   Tap **Pick** on one: `ink-ledger` · `ledger-mist` · `aurora-grid`
3. Reply in Cursor chat with the copied line (e.g. `Approve lab UI: aionis-brand-plane`) + screenshot.

Until you reply in chat, premium chrome stays off home/desk on purpose.

Refs extracted: **Aionis** brand-plane (production `/` already mirrors composition) · **NetroBNB** 12-col desk density · live **21st.dev** MCP previews.
Opt-in **Preview on desk** paints stronger Netro grey/yellow chrome, Aionis dark plane, or cinematic/trade-journal desk skin (session-only · Exit anytime).

For live 21st MCP on the Vercel preview, set `API_KEY_21ST` (and optional `SHADERS_API_KEY`) on the Vercel project — local `.env` already has them. **Live check 2026-09-16:** preview `/lab/ui` still shows `API_KEY_21ST missing` until that Vercel env lands.

---

## Step 1 — Vercel secrets (no paid API) ✅ DONE

`FOLIO_SESSION_SECRET` + `BROADCAST_PAUSED=true` are set on Vercel (all targets) and verified live on Settings:

- Badge: **Watch-wallet secret set**
- Readiness: **Set · watch-wallet bind ready**

Demo: https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app/desk/settings  

**Rotate** any Vercel token pasted in chat (Account → Tokens). Do not paste tokens in chat again.

What this unlocked: watch-wallet bind on the public demo (live-verified: bind Tokenkeg… → cookie set, Positions can mainnet-read qty). Broadcast stays paused.

---

## Step 2 — Bitquery (after Step 1 done)

Only when I say so. Needed for live wash tape (fail-closed until then).

| Name | Where |
|------|--------|
| `BITQUERY_API_KEY` | Bitquery dashboard → API key → paste into Vercel + local `.env` |

Optional same sitting (unlocks Pyth diverge vs Jupiter):

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

`SUPABASE_JWT_SECRET` arms the user-JWT RLS path (`sub` = Privy DID). Without it FOLIO keeps a labeled service-role fallback. Desk prefs RLS: viewers read-only; owner/trader write.

Run migration `supabase/migrations/*folio_tenants*` when keys land. Optional seed: `supabase/seed/demo_tenant.sql`.

Full checklist when pasting keys: `docs/KEYS_LANDING.md`.

---

## Still paused until funded
- Mainnet broadcast / swap send
- Custom program deploy (rent ≫ $1)
- Mentors/judges cold DMs (we draft after product looks premium)
