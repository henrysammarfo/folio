# FOLIO — NETWORK MATRIX

| Capability | Mode | Status |
|---|---|---|
| xStocks asset + multiplier | Mainnet READ | Live adapter |
| Pyth equity / Hermes | Mainnet READ | Live adapter |
| Jupiter swap quote | Mainnet READ (quote-only) | Live adapter |
| Wash / Bitquery tape | Mainnet READ | Fail-closed until key |
| Raydium / Meteora / Orca pool reads | Mainnet READ | Planned |
| Kamino / Jupiter Lend / NestUSD | Mainnet READ · borrow CPI = fork if unfunded | Planned labeled |
| Broadcast swap / borrow | Mainnet WRITE | Disabled until funded + explicit user confirm (≤~$1 test budget) |
| FOLIO custom program | Mainnet deploy | **Skipped** (budget) |
| Agent (stonkfly-style) | Paper default | AgentRouter when key works |

Every UI surface must show mode badges: `mainnet-read` | `quote-only` | `fork` | `unavailable` | `paper`.
