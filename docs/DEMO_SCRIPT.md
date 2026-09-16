# FOLIO — Stocklana demo script (≤8 seconds spoken)

**Live Stocklana (2026-09-16, hackathons.solana.com jina):** **598** registered · **82** submissions · prize **$121,000** · hero deadline **SEP 25, 2026**. Timeline body may still list **Fri 18 Sep** — treat **18 Sep as conservative**; re-check hero at submit.

Network: mainnet-read + quote-only · Budget: ≤~$1 · Broadcast: paused

## Pitch order (lock)

1. **Truth** — “Token balances lie after splits. FOLIO reads the live xStocks Scaled UI multiplier — AAPLx ≈ 1.003× today, not a demo 4×.”
2. **Wash** — “If the tape is missing or linked-flow looks dirty, we fail closed. No silent green.”
3. **Buy** — “Jupiter quote-only on mainnet. Review the route — we do not broadcast on a dollar budget.”
4. **Credit** — “Kamino xStocks LTV is live (AAPLx 40%). Borrow CPI stays unavailable until funded — we do not fake a fork harness. Bind a watch wallet for mainnet-read qty — still not Privy multi-tenant auth.”
5. **Agent** — “Paper by default, live truth/quote spine, metered, caps on. No mentor spam until this URL works.”

## Live demo URL

https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app

Home CTAs: **Open desk** → Netro overview (Henry-approved `netro-density`) with live Empire gates + ≤$1 Jupiter inspect. Home hero stays Aionis brand-plane. Lab still at `/lab/ui` · `/lab/shaders`.

Verified on this preview (SSO off):

- `/` — Aionis brand-plane hero (unchanged)
- `/desk` — Netro 12-col · live wash/Pyth/NestUSD/Kamino modes · live Kamino maxLTV · live Jupiter ≤$1 out amount (quote-only)
- `/truth` ~1.003× Scaled UI + on-chain compare
- `/lab/ui` — **21st MCP connected**
- `/network` NestUSD / wash / Pyth / broadcast fail-closed until keyed
- `/desk/settings` — **Watch-wallet secret set** · bind ready; Bitquery/Pyth/Privy/Supabase still missing
- Watch-wallet bind live-verified (mainnet-read qty, not Privy auth)

Ephemeral inspect still works without bind:  
`/desk/positions?inspect=<pubkey>` · `/desk/credit?inspect=<pubkey>` (labeled not-auth).

Paste pack: `docs/STOCKLANA_SUBMISSION.md` · Keys when ready: `docs/KEYS_LANDING.md` · Henry steps: `docs/HENRY_STEPS.md`

## Click path

1. `/` — brand hero → **Open desk**
2. `/desk` — Netro overview: live × · wash fail-closed · Kamino LTV · Jupiter ≤$1 out → **Inspect quote**
3. `/desk/acquire` — run checks; wash blocked without Bitquery (honest)
4. `/truth?symbol=AAPLx` — multiplier + on-chain Scaled UI
5. `/desk/settings` — bind watch wallet → `/desk/positions` qty
6. `/network` — capability matrix badges

## Replay

```bash
npm run replay
# = npm test && npm run test:e2e && npx tsx scripts/smoke-empire.mts && npm run build
```

Lab approve ids (not production):

- UI: `aionis-brand-plane` · `netro-density` · `cinematic-landing-21st` · `trade-journal-21st`
- Shaders: `ink-ledger` · `ledger-mist` · `aurora-grid`

## Do not say

- Unhackable / nation-state proof
- We filled / minted / borrowed on mainnet (unless broadcast is actually funded + confirmed)
- Fake registration counts — re-check Stocklana page at submit
