# FOLIO — CURRENT STATE

> Updated: 2026-09-15 · Stocklana deadline **2026-09-18 20:00 UTC**
> Doctrine: honest security only — **never claim unhackable / NK-proof**.

## Product lock

- **One job:** Honest stock desk on Solana (truth · safe route · credit).
- **Pitch order:** (1) honest share counts (2) won’t buy wash (3) buy on Solana (4) borrow without selling (5) guarded agent.
- Soft: FOLIO buys the US stocks you want on Solana — keeps share counts honest, won’t buy in shady pools, and lets you borrow cash without selling.

## Network verdict (Stocklana + Colosseum World’s Fair)

**Mainnet-primary READ + quote-only.** Not full mainnet broadcast-everything. Not “devnet cosplay as mainnet.”

| Layer | Policy |
|---|---|
| xStocks multiplier / mint / Scaled UI | **Mainnet READ** (API + on-chain Token-2022) |
| Jupiter price + swap quote | **Mainnet READ / quote-only** |
| Wash / Bitquery | **Mainnet READ**, fail-closed until keyed+wired |
| Kamino xStocks / Jupiter Lend earn / Raydium pools | **Mainnet READ** (labeled) |
| NestUSD capacity | **Unavailable** until verified endpoint |
| Swap / borrow broadcast | **Disabled** (≤~$1 budget) |
| Borrow CPI proofs | **Local mainnet-fork** when unfunded |
| Custom program mainnet deploy | **Out** (rent ≫ $1) |
| Optional policy harness | Devnet OK if labeled |

World’s Fair still wins on **working honesty**: live multiplier + wash refuse + Jupiter quote + credit reads with mode badges beats fake mainnet fills.

## Repo reality

| Layer | Status |
|---|---|
| Live Block 0 spine (truth / acquire / network) | Wired |
| Positions / credit / activity / settings | Live bundles (paper qty labeled) |
| On-chain Scaled UI reader | Live when `SOLANA_RPC_URL` set |
| Kamino xStocks market reserves | Live mainnet-read |
| Jupiter Lend earn vaults | Live mainnet-read (not xStock borrow) |
| Raydium pool awareness | Live mainnet-read |
| NestUSD | Fail-closed / risk-labeled |
| Privy + Supabase sessions | Scaffold fail-closed (keys empty) |
| Paper agent + meter stub | Wired on settings |
| Vitest unit | Green (multiplier / diverge / wash / intent) |
| Lovable traces | Removed (`.lovable` deleted; vite config independent) |

## Keys

Present in `.env`: Tavily, TinyFish, AgentRouter, 21st, Shaders, Solana RPC.
Empty / needed later: Privy, Supabase, Bitquery, Jupiter (if gated).
**Rotate all chat-pasted keys after hackathon.**

## Live deltas (do not regress)

- AAPLx multiplier ≈ **1.00327** (not fixture 4.0×)
- Mint `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`, decimals **8**
- On-chain effective Scaled UI matches pending API multiplier when timestamp elapsed
- Kamino AAPLx **maxLtv 0.40** on market `5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua`
