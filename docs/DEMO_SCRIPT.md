# FOLIO — Stocklana demo script (≤8 seconds spoken)

Deadline conflict — **re-check at submit**: hero **SEP 25, 2026** vs timeline often **18 Sep 20:00 UTC**.  
Network: mainnet-read + quote-only · Budget: ≤~$1 · Broadcast: paused

## Pitch order (lock)

1. **Truth** — “Token balances lie after splits. FOLIO reads the live xStocks Scaled UI multiplier — AAPLx ≈ 1.003× today, not a demo 4×.”
2. **Wash** — “If the tape is missing or linked-flow looks dirty, we fail closed. No silent green.”
3. **Buy** — “Jupiter quote-only on mainnet. Review the route — we do not broadcast on a dollar budget.”
4. **Credit** — “Kamino xStocks LTV is live (AAPLx 40%). Borrow CPI stays unavailable until funded — we do not fake a fork harness. Bind a watch wallet for mainnet-read qty — still not Privy multi-tenant auth.”
5. **Agent** — “Paper by default, live truth/quote spine, metered, caps on. No mentor spam until this URL works.”

## Live demo URL

https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app

Home CTAs (live): **Approve desk UI** · **Approve shaders** → `/lab/ui` · `/lab/shaders` (Henry picks id before premium merge).

Verified on this preview (SSO off):

- `/truth` ~1.003× Scaled UI
- `/network` NestUSD / wash / Pyth / broadcast fail-closed until keyed
- `/desk/settings` — **Watch-wallet secret set** · bind ready; Bitquery/Pyth/Privy/Supabase still missing
- Watch-wallet bind live-verified (mainnet-read qty, not Privy auth)

Ephemeral inspect still works without bind:  
`/desk/positions?inspect=<pubkey>` · `/desk/credit?inspect=<pubkey>` (labeled not-auth).

Stocklana live (2026-09-15, re-check at submit): **545** registered · **72** submissions · **$121k** hero. Deadline conflict: hero SEP 25 vs timeline 18 Sep 16:00 ET.

Paste pack: `docs/STOCKLANA_SUBMISSION.md` · Keys when ready: `docs/KEYS_LANDING.md`

## Click path

1. `/truth?symbol=AAPLx` — multiplier + economic shares
2. `/desk/acquire` — run checks; wash blocked without Bitquery (honest)
3. `/network` — capability matrix badges
4. `/desk/settings` — bind watch wallet (secret already on Vercel) → `/desk/positions` qty
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
