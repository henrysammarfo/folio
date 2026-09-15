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


| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Token-2022 Scaled UI uses multiplier until `newMultiplierEffectiveTimestamp`, then newMultiplier | CONFIRMED | solana.com docs Scaled UI Amount | 2026-09-15 |
| AAPLx on-chain effectiveMultiplier ≈ 1.003269 after effective ts | CONFIRMED live | `getAccountInfo` jsonParsed scaledUiAmountConfig + SOLANA_RPC_URL | 2026-09-15 |
| Kamino public xStocks market `5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua` lists AAPLx maxLtv 0.40 | CONFIRMED live | `api.kamino.finance/kamino-market/.../reserves/metrics` | 2026-09-15 |
| Jupiter Lend `lite-api.jup.ag/lend/v1/earn/tokens` returns earn vaults (not xStock borrow) | CONFIRMED live | HTTP 200 earn token list | 2026-09-15 |
| Bitquery Solana wash detector uses `streaming.bitquery.io/eap` + DEXTrades GraphQL | CONFIRMED docs | docs.bitquery.io wash-trading-detector | 2026-09-15 |
| NestUSD public capacity metrics endpoint verified for FOLIO | REJECTED for now | No verified in-repo endpoint — fail-closed / risk-labeled | 2026-09-15 |
| Raydium v3 pools-by-mint returns AAPLx pools | CONFIRMED live | `api-v3.raydium.io/pools/info/mint` | 2026-09-15 |
| Colosseum World’s Fair requires working MVP + honesty over fake mainnet fills | CONFIRMED (secondary sources) | Colosseum/World’s Fair coverage; FOLIO NETWORK_POLICY | 2026-09-15 |


## Live Stocklana re-check (2026-09-15 16:27 UTC)

Source: https://hackathons.solana.com/hackathons/stocklana (Tavily)

| Claim | Live value | Status |
|---|---|---|
| Prize pool | **$100,000** | Confirmed |
| Registered | **145** | Confirmed (do not invent; re-check at submit) |
| Submissions | **12** | Confirmed at check time |
| Deadline | **Fri 18 Sep 2026, 20:00 UTC** (4:00pm ET) | Confirmed |
| Live since | Fri 11 Sep 2026, 12:00 UTC | Confirmed |
| Judging | through 2 Oct 2026 | Confirmed |

Do **not** quote older ~500/57 registration counts.


## Live Stocklana re-check (2026-09-15 16:45 UTC)

Sources: https://hackathons.solana.com/hackathons/stocklana (jina/WebFetch live page) + Tavily index (may lag)

| Claim | Live value | Status |
|---|---|---|
| Prize pool (hero total) | **$115,000** | Confirmed on live page (main track still lists $100,000 + bounty tracks) |
| Registered | **528** | Confirmed live page (Tavily index still showed 145 — do not invent; prefer live page) |
| Submissions | **67** | Confirmed live page (Tavily index still showed 12) |
| Deadline (hero) | **SEP 25, 2026** | Confirmed on live hero; timeline text may still mention Fri 18 Sep 4pm ET — **re-check at submit** |
| AAPLx multiplier | ≈ **1.00327** | Confirmed via api.xstocks.fi |
| Token program IDs | Tokenkeg… / TokenzQd… | Confirmed executable on mainnet RPC |

Do **not** quote stale 145/12 counts. Prefer live page over search-index lag.

| Stocklana registered **534** / submissions **67** / hero pool **$121k** | CONFIRMED live | hackathons.solana.com/hackathons/stocklana | 2026-09-15 |
| Stocklana deadline conflict: hero SEP 25 vs timeline Fri 18 Sep 20:00 UTC | CONFIRMED conflict — re-check at submit | same page hero + timeline | 2026-09-15 |
| Network matrix NestUSD labeled unavailable (not mainnet-read) | CONFIRMED in-repo | buildNetworkMatrix NestUSD row | 2026-09-15 |
| AAPLx currentMultiplier ≈ 1.0032690125398187 | CONFIRMED live | api.xstocks.fi AAPLx multiplier | 2026-09-15 |
| Stocklana registered **534** / submissions **68** / hero pool **$121k** | CONFIRMED live | hackathons.solana.com/hackathons/stocklana (WebFetch) | 2026-09-15 |
