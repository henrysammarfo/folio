# FOLIO — Stocklana submit checklist

Deadline conflict — **re-check live at submit**:
- Hero / stats strip: **SEP 25, 2026**
- Timeline copy: **Fri 18 Sep 2026, 16:00 ET (20:00 UTC)**
Budget: ≤~$1 · Broadcast: paused

## Live counts (2026-09-15, official page WebFetch)

Source: https://hackathons.solana.com/hackathons/stocklana

- Registered: **536**
- Submissions: **69**
- Prize pool hero: **$121,000** (Foundation main track $100k + bounty tracks)
- Deadline conflict: hero **SEP 25, 2026** vs timeline **Fri 18 Sep 2026, 20:00 UTC**

Do not invent newer counts — refresh the page before the submission form.
Paste pack: `docs/STOCKLANA_SUBMISSION.md`

## Before submit

- [x] Demo URL reachable (Block 0 spine) — https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app (SSO off). Set `FOLIO_SESSION_SECRET` (+ optional `SOLANA_RPC_URL`) in Vercel env for watch-wallet; public RPC fallback covers Scaled UI reads when RPC unset. `BROADCAST_PAUSED=true` recommended in Vercel.
- [x] Ephemeral `?inspect=` wallet-read on positions + credit (no Vercel secret required; labeled not-auth)
- [ ] Vercel env: `FOLIO_SESSION_SECRET` (≥16) + `BROADCAST_PAUSED=true` (preview matrix currently reports watch-wallet secret missing)

- [x] Replay green locally (unit + e2e + empire smoke + build) — re-run before final submit:

```bash
npm run replay
# = npm test && npm run test:e2e && npx tsx scripts/smoke-empire.mts && npm run build
```

- [x] Pitch order locked (truth → wash → buy → credit → agent) — see `docs/DEMO_SCRIPT.md`
- [x] Mode badges visible on `/truth`, `/desk/acquire`, `/network`, `/desk/credit` (verified on Vercel preview SSR)
- [x] `/network` shows NestUSD unavailable, wash fail-closed without Bitquery, broadcast paused (verified live preview)
- [x] Wash fail-closed without Bitquery (Continue disabled) — e2e + live preview
- [x] No “unhackable” / nation-state claims in product UI (e2e asserts + README/threat model forbid)
- [x] No claim of mainnet fill / mint / borrow unless actually funded + confirmed (broadcast hard-false; smoke gates)
- [x] `.env` keys never committed; rotate any chat-pasted secrets after hackathon
- [x] Submission paste pack ready — `docs/STOCKLANA_SUBMISSION.md`

## Keys to land (Henry)

| Key | Unlocks |
|---|---|
| `BITQUERY_API_KEY` | Live wash tape (still heuristic) |
| `PRIVY_APP_ID` + `PRIVY_APP_SECRET` | Wallet identity |
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` + migration | Tenant memberships / prefs |
| `FOLIO_SESSION_SECRET` (≥16) — **also set on Vercel** | httpOnly `folio_session` + watch-wallet cookie |
| Optional `JUPITER_API_KEY` | If quote/price becomes gated |
| Optional `SOLANA_RPC_URL` | Private RPC (public mainnet fallback works for reads) |

## UI approve gate (reply with one id)

Step-by-step for Henry (keys + lab): `docs/HENRY_STEPS.md` · Vision/interview: `docs/COLOSSEUM_VISION.md`

Live home now shows **Approve desk UI** / **Approve shaders** CTAs.

Shaders (`/lab/shaders`):
- `ink-ledger`
- `ledger-mist`
- `aurora-grid`

UI (`/lab/ui`):
- `desk-density-a`
- `desk-density-b`
- `gate-chip`

Production hero + desk chrome stay frozen until Henry names an id in chat.

## After Stocklana

- Colosseum World’s Fair uses the **same** mainnet-read + quote-only honesty posture
- Still no custom mainnet program deploy on ≤~$1
