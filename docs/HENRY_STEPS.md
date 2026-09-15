# FOLIO — Henry key steps (one at a time)

Do **one step**, screenshot, reply in chat. Do not skip ahead. I will give the next step after each reply.

Demo (hard-refresh): https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app

---

## Step 0 — Approve lab look (do this before or with Step 1)

1. Open https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app/lab/ui  
   Pick one: `desk-density-a` · `desk-density-b` · `gate-chip`
2. Open https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app/lab/shaders  
   Pick one: `ink-ledger` · `ledger-mist` · `aurora-grid`
3. Reply in chat with the id(s) + screenshot.

Until you reply, premium chrome stays off home/desk on purpose.

---

## Step 1 — Vercel secrets (no paid API)

Link: https://vercel.com/teamtitanlink/folio/settings/environment-variables  

Add for **Preview** (and Production if you want):

| Name | Value |
|------|--------|
| `FOLIO_SESSION_SECRET` | any random string ≥16 characters |
| `BROADCAST_PAUSED` | `true` |

Screenshot the env list (values can be hidden) → reply here.

What this unlocks: watch-wallet bind on the public demo. Broadcast stays paused.

---

## Step 2 — Bitquery (after Step 1 done)

Only when I say so. Needed for live wash tape (fail-closed until then).

| Name | Where |
|------|--------|
| `BITQUERY_API_KEY` | Bitquery dashboard → API key → paste into Vercel + local `.env` |

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

Run migration `supabase/migrations/*folio_tenants*` when keys land.

---

## Still paused until funded
- Mainnet broadcast / swap send
- Custom program deploy (rent ≫ $1)
- Mentors/judges cold DMs (we draft after product looks premium)
