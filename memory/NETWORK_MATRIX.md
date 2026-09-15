# FOLIO — NETWORK MATRIX

| Capability | Mode | Detail |
|---|---|---|
| xStocks multiplier + asset | mainnet-read | api.xstocks.fi `network=Solana` |
| On-chain Scaled UI | mainnet-read | Token-2022 via SOLANA_RPC_URL |
| Pyth Hermes equity | unavailable / mainnet-read | Price updates 401 on some egress — fail-closed |
| Jupiter Price v3 | mainnet-read | Venue + optional stockData |
| Jupiter swap quote | quote-only | No broadcast |
| Wash / Bitquery | unavailable | Key missing or query not wired — fail-closed |
| Kamino xStocks reserves | mainnet-read | Market 5wJe…Lsua |
| Jupiter Lend earn | mainnet-read | Earn vaults only — labeled |
| Raydium pools | mainnet-read | Awareness only |
| NestUSD | unavailable | Unverified endpoint |
| Broadcast swap/borrow | unavailable | ≤~$1 budget |
| Custom program deploy | unavailable | Rent exceeds budget |
