# FOLIO — Stocklana submission paste pack

Re-check live counts on https://hackathons.solana.com/hackathons/stocklana before final submit.

**Live (2026-09-16 jina):** **590** registered · **79** submissions · hero prize **$121,000** · hero deadline **SEP 25, 2026** vs timeline **Fri 18 Sep 2026, 16:00 ET** — confirm which the form uses at submit.

## Form fields (paste)

**Project name:** FOLIO

**One-liner:** Honest stock desk on Solana — live share truth, wash fail-closed, Jupiter quote-only, credit reads without fake fills.

**Demo URL:** https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app

**Repo:** https://github.com/henrysammarfo/folio (branch `cursor/folio-prefs-agent-honesty-f1ec` / PR #3)

**Pitch (≤ short paragraph):**
FOLIO is a stock desk for tokenized equities on Solana. Token balances lie after corporate actions — we read the live xStocks Scaled UI multiplier (AAPLx ≈ 1.003× today) and surface pending newMultiplier honestly (or none). If wash tape is missing or linked-flow looks dirty, acquire stays fail-closed. Jupiter quotes stay quote-only with short TTL / labeled stale-on-429 and broadcast paused on a ≤~$1 budget. Credit shows live Kamino LTV, Nest.credit vault awareness, and NestUSD labeled unavailable until a verified borrow endpoint exists. Watch-wallet mainnet-read qty is live on the public demo; multi-tenant Privy + Supabase sessions are wired but fail-closed without keys. We do not claim unhackable security.

**Links judges can open:**
1. Demo: https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app
2. Truth: `…/truth?symbol=AAPLx`
3. Network honesty: `…/network`
4. Settings readiness: `…/desk/settings` (secret set · wash/Pyth/Privy/Supabase fail-closed)
5. Demo script: `docs/DEMO_SCRIPT.md`

**Track fit:** Investing / credit & yield / infrastructure (honest price + corporate-action truth + borrow reads). **Pyth bounty:** Equity.US.* vs Jupiter venue diverge on `/truth` + acquire; Crypto.{SYM}X/USD labeled secondary when keyed.

## Henry blockers before “production complete”

- [x] Vercel `FOLIO_SESSION_SECRET` (≥16) + `BROADCAST_PAUSED=true` — settings shows **Watch-wallet secret set** · bind ready (live-verified)
- [x] Vercel `SOLANA_RPC_URL` (public mainnet) for Scaled UI + wallet reads
- [ ] Reply with one lab id to approve premium chrome: `netro-density` · `aionis-brand-plane` · `trade-journal-21st` · `ink-ledger` · `ledger-mist` · `aurora-grid`
- [ ] Land `BITQUERY_API_KEY` for live wash (fail-closed until then)
- [ ] Land `PYTH_API_KEY` for Hermes equity diverge (fail-closed until then)
- [ ] Land Privy + Supabase keys for multi-tenant sessions — see `docs/KEYS_LANDING.md`
- [ ] Rotate any chat-pasted Vercel token

## Walkthrough artifacts

- Watch-wallet bind live: `/opt/cursor/artifacts/screenshots/watch-wallet-bind-live.png`
- Truth CA pending: `/opt/cursor/artifacts/screenshots/demo-truth-ca-pending.png`
- Activity CA pending: `/opt/cursor/artifacts/screenshots/demo-activity-ca-pending.png`
- Lab approve CTAs + candidates: `/lab/ui` · `/lab/shaders`
