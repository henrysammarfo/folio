# FOLIO — Stocklana demo script (≤8 seconds spoken)

Deadline: **2026-09-18 20:00 UTC** · Network: mainnet-read + quote-only · Budget: ≤~$1

## Pitch order (lock)

1. **Truth** — “Token balances lie after splits. FOLIO reads the live xStocks Scaled UI multiplier — AAPLx ≈ 1.003× today, not a demo 4×.”
2. **Wash** — “If the tape is missing or linked-flow looks dirty, we fail closed. No silent green.”
3. **Buy** — “Jupiter quote-only on mainnet. Review the route — we do not broadcast on a dollar budget.”
4. **Credit** — “Kamino xStocks LTV is live (AAPLx 40%). Borrow CPI stays fork/unavailable until funded. Bind a watch wallet for mainnet-read qty — still not Privy multi-tenant auth.”
5. **Agent** — “Paper by default, metered, caps on. No mentor spam until this URL works.”


## Live demo URL

https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app

Verified on this preview (SSO off): `/truth` ~1.003269× · `/network` NestUSD/wash/broadcast fail-closed · `/desk/credit` NestUSD unverified (not Ready).

Set `FOLIO_SESSION_SECRET` (+ `BROADCAST_PAUSED=true`) in Vercel before demos that need watch-wallet bind.

Stocklana live (2026-09-15 WebFetch, re-check at submit): **536** registered · **69** submissions · **$121k** hero · deadline conflict SEP 25 hero vs **18 Sep 20:00 UTC** timeline.

Paste pack: `docs/STOCKLANA_SUBMISSION.md`

## Click path

1. `/truth?symbol=AAPLx` — multiplier + economic shares
2. `/desk/acquire` — run checks; wash blocked without Bitquery (honest)
3. `/network` — capability matrix badges
4. `/desk/settings` — bind watch wallet (optional) → `/desk/positions` + `/desk/credit`
5. `/lab/shaders` + `/lab/ui` — approve gate (not production)

## Replay

```bash
npm run replay
# = npm test && npm run test:e2e && npx tsx scripts/smoke-empire.mts && npm run build
```

Lab approve ids (not production): `ink-ledger` · `ledger-mist` · `aurora-grid` · `desk-density-a` · `desk-density-b` · `gate-chip`

## Do not say

- Unhackable / nation-state proof
- We filled / minted / borrowed on mainnet (unless broadcast is actually funded + confirmed)
- Fake registration counts — re-check Stocklana page at submit
