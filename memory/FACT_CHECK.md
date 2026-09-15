# FOLIO — FACT CHECK

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Stocklana $100k · deadline 18 Sep 2026 20:00 UTC | CONFIRMED | hackathons.solana.com/hackathons/stocklana + Tavily | 2026-09-15 |
| xStocks Solana uses Token-2022 Scaled UI Amount (raw × multiplier) | CONFIRMED | docs.xstocks.fi multipliers | 2026-09-15 |
| Public multiplier API | CONFIRMED | `GET https://api.xstocks.fi/api/v2/public/assets/{SYMBOL}/multiplier?network=Solana` | 2026-09-15 |
| AAPLx multiplier ≈ 1.003 not 4.0 | CONFIRMED live | API response currentMultiplier | 2026-09-15 |
| Kamino xStocks market: SPYx/QQQx → USDC | CONFIRMED (news/docs) | xstocks.fi news Kamino lending market | 2026-09-15 |
| AgentRouter base `https://agentrouter.org/v1` | CONFIRMED | public docs / gist | 2026-09-15 |
| TinyFish Search `api.search.tinyfish.ai` + `X-API-Key` | CONFIRMED | docs.tinyfish.ai + live 200 | 2026-09-15 |
| Custom program mainnet deploy fits $1 budget | REJECTED | rent ~1 SOL for ~200KB account | 2026-09-15 |
| ≥10 named EU/APAC FOLIO yeses | UNVERIFIED | uniqueness lock | — |
| NestUSD audit complete | UNVERIFIED — label risk | empire plan open research | — |
| “Unhackable” / nation-state proof | FORBIDDEN claim | residual risk always remains | policy |

Re-verify competitor flaws and Stocklana counts before submit.

| 2026-09-15 live | Result | Source |
|---|---|---|
| xStocks AAPLx multiplier | ≈1.0032690125398187 | `api.xstocks.fi/.../multiplier?network=Solana` |
| AAPLx Solana mint | `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp` | xStocks asset deployments |
| AAPLx decimals | 8 (via Jupiter Price v3) | `api.jup.ag/price/v3` |
| Jupiter quote USDC→AAPLx | live outAmount | `api.jup.ag/swap/v1/quote` |
| Pyth Hermes price updates | HTTP 401 unauthorized on this egress | `hermes.pyth.network/v2/updates/price/latest` |
| Bitquery wash | blocked until key | env |
