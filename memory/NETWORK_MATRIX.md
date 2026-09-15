# FOLIO — NETWORK MATRIX

| Capability | Mode | Detail |
|---|---|---|
| xStocks multiplier + asset | mainnet-read | api.xstocks.fi `network=Solana` |
| On-chain Scaled UI | mainnet-read | Token-2022 via SOLANA_RPC_URL (or labeled public RPC fallback) |
| Pyth Hermes equity | unavailable / mainnet-read | Price updates 401 on some egress — fail-closed |
| Jupiter Price v3 | mainnet-read | Venue + optional stockData |
| Jupiter swap quote | quote-only | No broadcast |
| Wash / Bitquery | unavailable | Key missing or query fail — **fail-closed** (mode forced unavailable without key) |
| Kamino xStocks reserves | mainnet-read | Market 5wJe…Lsua · borrow CPI = fork until funded |
| Jupiter Lend earn | mainnet-read | Earn vaults only — labeled (not xStock borrow) |
| NestUSD | unavailable | Unverified endpoint · fail-closed |
| Multi-tenant sessions | unavailable | PRIVY_* / SUPABASE_* missing · fail-closed |
| Watch-wallet mainnet-read qty | mainnet-read / unavailable | Requires `FOLIO_SESSION_SECRET` ≥16 (≠ Privy auth) |
| Broadcast swap/borrow | unavailable | ≤~$1 budget · `BROADCAST_PAUSED` |
| Custom program deploy | unavailable | Rent exceeds budget |
