# FOLIO — NETWORK MATRIX

| Capability | Mode | Detail |
|---|---|---|
| xStocks multiplier + asset | mainnet-read | api.xstocks.fi `network=Solana` |
| On-chain Scaled UI | mainnet-read | Token-2022 via SOLANA_RPC_URL (or labeled public RPC fallback) |
| Pyth Hermes equity | unavailable / mainnet-read | Price updates need `PYTH_API_KEY` — fail-closed |
| Jupiter Price v3 | mainnet-read | Venue + optional stockData · TTL 30s · stale≤120s on 429 |
| Jupiter swap quote | quote-only | No broadcast · TTL 20s · stale≤120s on 429 |
| Raydium pool awareness | mainnet-read | Awareness only · not a route guarantee · wash still required |
| Wash / Bitquery | unavailable | Key missing or query fail — **fail-closed** (mode forced unavailable without key) |
| Kamino xStocks reserves | mainnet-read | Market 5wJe…Lsua · borrow CPI unavailable until funded (no fork harness) |
| Jupiter Lend earn | mainnet-read | Earn vaults only — labeled (not xStock borrow) |
| Nest.credit vault awareness | mainnet-read | Indexed vault TVL/OFT — **not** NestUSD borrow |
| NestUSD | unavailable | Unverified endpoint · fail-closed |
| Multi-tenant sessions | unavailable | PRIVY_* / SUPABASE_* missing · fail-closed |
| Watch-wallet mainnet-read qty | mainnet-read / unavailable | Requires `FOLIO_SESSION_SECRET` ≥16 (≠ Privy auth) |
| Ephemeral wallet inspect | mainnet-read | `?inspect=` on desk/positions/credit · not auth |
| Broadcast swap/borrow | unavailable | ≤~$1 budget · `BROADCAST_PAUSED` |
| Custom program deploy | unavailable | Rent exceeds budget |
