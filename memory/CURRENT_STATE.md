# FOLIO — CURRENT STATE

> Updated: 2026-09-15 · Stocklana deadline **2026-09-18 20:00 UTC**
> Doctrine: honest security only — **never claim unhackable / NK-proof**.

## Product lock

- **One job:** Honest stock desk on Solana (truth · safe route · credit).
- **Pitch order:** (1) honest share counts (2) won’t buy wash (3) buy on Solana (4) borrow without selling (5) guarded agent.
- **Soft:** FOLIO buys the US stocks you want on Solana — keeps your share count honest, won’t buy in shady pools, and lets you borrow cash without selling.

## Repo reality

| Layer | Status |
|---|---|
|  TanStack Start UI (public + desk routes) | Present — was fixture-heavy |
| Live xStocks ScaledUiAmount / multiplier | Wiring in progress |
| Live Pyth diverge + Jupiter quote | Wiring in progress |
| Wash / Bitquery | Fail-closed until `BITQUERY_API_KEY` |
| Privy + Supabase multi-tenant | Scaffold — needs keys |
| Custom mainnet program deploy | **Out of budget** (≤~$1 spend) |
| Broadcast / mentor spam | **PAUSED** until Block 0 live demo |

## Network policy (funds law)

- Real xStocks liquidity / Kamino markets: **mainnet only**
- Jupiter DCA depth: **mainnet** (devnet ≈ empty)
- FOLIO policy harness: **devnet OK**
- xStocks API · Pyth · Jupiter **quote** · pool GETs: **mainnet READ**
- CPI borrow proofs: **local mainnet-fork** when unfunded

## Keys (names only — values in gitignored `.env`)

Present: Tavily, TinyFish, AgentRouter, 21st, Shaders, public Solana RPC.
Missing for full E2E: Privy, Supabase, Bitquery, dedicated RPC, Jupiter (if gated).

## Fact-check deltas vs bible (2026-09-15 live)

- Stocklana prize/deadline: **confirmed** $100k · 18 Sep 2026 20:00 UTC.
- Registered/submissions in older docs (~500/57) were **stale**; re-check page at submit.
- AAPLx live multiplier ≈ **1.003…** (not fixture 4.0×) — UI must show live API, not demo splits.
