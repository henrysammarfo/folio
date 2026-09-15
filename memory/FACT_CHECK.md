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

| Stocklana registered **536** / submissions **67** / hero pool **$121k** | CONFIRMED live | hackathons.solana.com/hackathons/stocklana | 2026-09-15 |
| Stocklana deadline conflict: hero SEP 25 vs timeline Fri 18 Sep 20:00 UTC | CONFIRMED conflict — re-check at submit | same page hero + timeline | 2026-09-15 |
| Network matrix NestUSD labeled unavailable (not mainnet-read) | CONFIRMED in-repo | buildNetworkMatrix NestUSD row | 2026-09-15 |
| AAPLx currentMultiplier ≈ 1.0032690125398187 | CONFIRMED live | api.xstocks.fi AAPLx multiplier | 2026-09-15 |
| Stocklana registered **536** / submissions **69** / hero pool **$121k** | CONFIRMED live | hackathons.solana.com/hackathons/stocklana (WebFetch) | 2026-09-15 |

## Live Stocklana re-check (2026-09-15 ~18:05 UTC)

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Stocklana registered **536** / submissions **69** / hero pool **$121k** | CONFIRMED live | hackathons.solana.com/hackathons/stocklana (WebFetch) | 2026-09-15 |
| Deadline conflict: hero **SEP 25, 2026** vs timeline **Fri 18 Sep 2026, 16:00 ET (20:00 UTC)**; stocklana.fun shows **18 SEP 2026 · 23:59 UTC** | CONFIRMED conflict — re-check at submit | official + stocklana.fun | 2026-09-15 |
| Ephemeral wallet inspect (no FOLIO_SESSION_SECRET) on `/desk/positions?inspect=` | SHIPPED | mainnet-read only; labeled not auth | 2026-09-15 |

| Ephemeral inspect on `/desk/credit?inspect=` | SHIPPED | same binding priority as positions; labeled not auth | 2026-09-15 |

## Live Vercel session secret (2026-09-15 ~18:48 UTC)

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| `FOLIO_SESSION_SECRET` present on Vercel folio project (all targets) | CONFIRMED | Vercel env API lists encrypted key; settings SSR `sessionSecretPresent:true` | 2026-09-15 |
| `BROADCAST_PAUSED=true` on Vercel | CONFIRMED | env API + settings readiness `broadcastPaused:true` | 2026-09-15 |
| Settings badge **Watch-wallet secret set** | CONFIRMED live | https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app/desk/settings | 2026-09-15 |
| Bitquery / Privy / Supabase on Vercel | MISSING | env API lists only session secret + broadcast; wash + multi-tenant fail-closed | 2026-09-15 |

## Live watch-wallet bind + Stocklana (2026-09-15 ~18:53 UTC)

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Watch-wallet bind works on Vercel preview with session secret | CONFIRMED | Playwright bind Tokenkeg… → success note + Currently Toke…Q5DA | 2026-09-15 |
| Stocklana registered **538** / submissions **69** / prize **$121,000** / deadline hero **SEP 25, 2026** | SUPERSEDED by 539/71 | prior jina snapshot | 2026-09-15 |
| Stocklana registered **539** / submissions **71** / prize **$121,000** / deadline hero **SEP 25, 2026** | SUPERSEDED by 545/72 | prior WebFetch | 2026-09-15 |
| Stocklana registered **545** / submissions **72** / prize **$121,000** / deadline hero **SEP 25, 2026** | CONFIRMED live | hackathons.solana.com/hackathons/stocklana WebFetch (Registered 545 · Submissions 72 · Prize Pool $121,000); timeline still Fri 18 Sep 16:00 ET | 2026-09-15 |
| Timeline Fri 18 Sep 2026 16:00 ET; stocklana.fun HACKATHON CLOSE 18 Sep 2026 23:59 UTC | CONFLICT vs hero SEP 25 — re-check at submit | hackathons page timeline + stocklana.fun | 2026-09-15 |

## Hermes auth (2026-09-15)

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Hermes `/v2/updates/price/latest` returns 401 without API key from this egress | CONFIRMED | curl 401 unauthorized; price_feeds still 200 | 2026-09-15 |
| FOLIO fail-closes Pyth without `PYTH_API_KEY` (no invented price) | CONFIRMED | unit test + adapter early return `pyth_api_key_missing` | 2026-09-15 |
| `SOLANA_RPC_URL` set on Vercel folio project | CONFIRMED | Vercel env API create encrypted all targets | 2026-09-15 |

| Borrow CPI “local fork” shipped | REJECTED as theater | No fork harness in repo — labeled unavailable-until-funded | 2026-09-15 |
| Paper agent live spine (truth/quote) | CONFIRMED in code | `fetchPaperAgentSpine` → xStocks + Jupiter quote-only; caps.broadcast=false | 2026-09-15 |
| Paper agent quote path shares wash/acquire gates | CONFIRMED unit | wash missing key / dirty tape → gates.canReview=false; never fill | 2026-09-15 |
| Active tenant switch invents foreign membership | REJECTED | `setActiveTenant` / mint validate against session.tenants only | 2026-09-15 |
| Strict fail-closed blocks missing Pyth on acquire | CONFIRMED unit | `buildAcquireGateMessages` + prefs load in `getAcquireBundle` | 2026-09-15 |
| Mode badge “Local fork” as shipped CPI mode | SUPERSEDED | Label now **Unfunded CPI**; borrow remains unavailable-until-funded | 2026-09-15 |
| Corporate-action alerts imply a separate CA calendar feed | REJECTED | Activity labels preference + live signal = xStocks multiplier only | 2026-09-15 |
| Public acquire applies tenant strictFailClosed without session | REJECTED | `prefsFromSession=false` → strict off; honesty-only Pyth until session | 2026-09-15 |
| Desk topbar `7vF…2ka` is a real bound wallet | REJECTED | Invented fixture — replaced with Bind wallet / session / watch chip | 2026-09-15 |
| `api.nest.credit/v1/vaults` = NestUSD Solana xStock borrow capacity | REJECTED | Nest.credit indexed vault TVL/OFT — different product; NestUSD stays fail-closed | 2026-09-15 |
| Nest.credit vault list reachable live | CONFIRMED | HTTP 200 vaults with Solana OFT mints + TVL; wired as mainnet-read awareness | 2026-09-15 |
| Jupiter invents quote/price on HTTP 429 | REJECTED | Fail-closed `jupiter_rate_limited` unless prior live ok within 120s stale window; source labeled cached/stale-cache | 2026-09-15 |
| Corporate-action pending invents a calendar event | REJECTED | Truth/activity only surface live xStocks pendingMultiplier / none | 2026-09-15 |
| Paper agent invents pending CA or fill | REJECTED | Truth spine labels pending/none from live multiplier; quote never a fill; wash gates shared | 2026-09-15 |
| AgentRouter WAF fails whole paper agent turn | REJECTED (fixed) | Live spine reply returns with nlExpansion=failed; NL skipped and labeled | 2026-09-15 |
| `smoke:keys` invents wash clear / multi-tenant ok without keys | REJECTED | Baseline skips missing; multi_tenant fail-closed; empty Privy token must fail-closed | 2026-09-15 |
| Blocking keys present in local smoke env | MISSING | smoke:keys → still need bitquery, pyth, privy, supabase | 2026-09-15 |
| Position detail drops ?inspect= wallet-read mid-click | REJECTED (fixed) | Detail loaderDeps + search.inspect; list/overview links pass inspect | 2026-09-15 |
| Truth diverge CheckCircle when pass===null | REJECTED (fixed) | Clock icon + unavailable note until scored | 2026-09-15 |
| Execution wash “Heuristic” when Bitquery missing | REJECTED (fixed) | Badge = Fail-closed | 2026-09-15 |
| Activity CA prefs ModeBadge = mainnet-read | REJECTED (fixed) | Preference → paper mode; Nest.credit ≠ NestUSD events added | 2026-09-15 |
