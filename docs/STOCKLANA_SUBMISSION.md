# FOLIO — Stocklana submission paste pack

Re-check live counts on https://hackathons.solana.com/hackathons/stocklana before final submit.

**Live (2026-09-15 WebFetch):** 536 registered · **69** submissions · hero prize **$121,000** · hero deadline SEP 25 vs timeline **Fri 18 Sep 2026 20:00 UTC** — confirm which the form uses.

## Form fields (paste)

**Project name:** FOLIO

**One-liner:** Honest stock desk on Solana — live share truth, wash fail-closed, Jupiter quote-only, credit reads without fake fills.

**Demo URL:** https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app

**Repo:** https://github.com/henrysammarfo/folio (branch `cursor/folio-wallet-read-f1ec` / PR #2)

**Pitch (≤ short paragraph):**
FOLIO is a stock desk for tokenized equities on Solana. Token balances lie after corporate actions — we read the live xStocks Scaled UI multiplier (AAPLx ≈ 1.003× today). If wash tape is missing or linked-flow looks dirty, acquire stays fail-closed. Jupiter quotes stay quote-only on a ≤~$1 budget with broadcast paused. Credit shows live Kamino LTV with NestUSD labeled unavailable until a verified endpoint exists. Multi-tenant Privy + Supabase sessions are wired but fail-closed without keys. We do not claim unhackable security.

**Links judges can open:**
1. Demo: https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app
2. Truth: `…/truth?symbol=AAPLx`
3. Network honesty: `…/network`
4. Demo script: `docs/DEMO_SCRIPT.md`

**Track fit:** Investing / credit & yield / infrastructure (honest price + corporate-action truth + borrow reads)

## Henry blockers before “production complete”

- [ ] Set Vercel env: `FOLIO_SESSION_SECRET` (≥16) + `BROADCAST_PAUSED=true` — preview `/desk/settings` already shows **Watch-wallet secret missing** and disables Bind until set
- [ ] Land `BITQUERY_API_KEY` for live wash (still heuristic)
- [ ] Land Privy + Supabase keys for multi-tenant sessions
- [ ] Reply with one lab id to approve premium chrome: `ink-ledger` · `ledger-mist` · `aurora-grid` · `desk-density-a` · `desk-density-b` · `gate-chip`

## Walkthrough artifacts (preview)

- Settings secret honesty: `/opt/cursor/artifacts/settings_watch_wallet_secret.png`
- Lab UI candidates: `/opt/cursor/artifacts/lab_ui_density_candidates.png`
- Lab shaders candidates: `/opt/cursor/artifacts/lab_shaders_candidates.png`
