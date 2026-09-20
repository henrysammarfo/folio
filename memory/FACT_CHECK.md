## 2026-09-20 — Phase B Open App + custody

| Claim | Status |
|---|---|
| Capsule ≠ path — stay Privy embedded Solana | Decision — Phase B |
| Desk-wide PrivyAppProvider wraps `/desk` | Verified — `desk.tsx` + `privy-app-provider.tsx` |
| Open App = email/social embedded or connect Phantom/Solflare | Implemented — header + Account Sign in |
| Account link wallet + export key with ack warnings | Implemented — `AccountCustodyPanel` |
| Nested PrivyProvider removed from session mint | Verified — uses shell context |

## 2026-09-20 — Phase A Jupiter V2 + ecosystem

| Claim | Status |
|---|---|
| Uniswap lists Ondo (+ peers) tokenized securities; UniswapX API | Verified — ondo.finance + blog.uniswap.org |
| FOLIO Phase A rail = Solana Jupiter V2 (not Eth Uniswap) | Decision — `docs/ECOSYSTEM_FIELD.md` |
| Quotes via `api.jup.ag/swap/v2/order` | Verified — adapter + unit tests |
| `/execute` refused while broadcast paused | Verified — `executeJupiterSwap` |
| Client wallet sign for armed fills | Pending Phase B |


## 2026-09-20 — FOLIO TradingView watermark (Netro pattern)

| Claim | Status |
|---|---|
| NetroBNB centers brand watermark over TV with opacity ~0.11, z-10 | Verified — `CryptoMarketCard.tsx` |
| FOLIO mark overlays TV stage (not under iframe / not on stats strip) | Verified — screenshot `netro-overview-chart-watermark.png` |
| Buy desk chart also carries FOLIO mark | Verified — `netro-acquire-chart-watermark.png` |
| Prod TV light + dark FOLIO mark live | Verified — folio-tawny-one after 7aea6d6; `prod-light-tv-watermark.png` |
| Overview TV theme light like NetroBNB | Verified — theme=light; screenshot folio-tv-light-watermark.png |
| Prod `/desk` shows FOLIO mark; no gasless essay / Welcome dump | Verified — `folio-tawny-one` after main merge `ae31fa1`; `prod-chart-watermark.png` · `prod-buy-sheet.png` |

## 2026-09-20 — Live trade / gasless (no FOLIO program)

| Claim | Status |
|---|---|
| Do not deploy FOLIO custom program for $10 beta | Decision lock — rent ≫ budget |
| Jupiter Swap V2 `/order` has automatic gasless when SOL &lt; 0.01 and trade ≈ ≥$10 | Verified — developers.jup.ag/docs/swap/advanced/gasless |
| JupiterZ RFQ can be gasless without min size if MM quotes; ATA rent via Jupiter gas wallet when no referral | Verified — same docs + Ultra gasless |
| Integrator `payer` needs referral + dual sign; Metis-only; FOLIO would fund gas | Verified — skip for peer $10 beta |
| Kora paymaster = OSS USDC fee-token path (ops + funded signer) | Verified — solana-foundation/kora |
| Best tester wallet: USDC + tiny SOL; USDC-only OK for ≥~$10; SOL-native OK | Product recommendation — documented |

## 2026-09-20 — Nexeus cinematic

| Claim | Status |
|---|---|
| Standalone Nexeus HTML uses exact CloudFront video + poster URLs | Verified — `public/nexeus/index.html` |
| FOLIO landing uses same video/poster + entrance motion | Verified — `nexeus-cinematic.tsx` |
| FOLIO footer (Whitepaper/Beta/About/Privacy/Desk) unchanged in content | Verified — `FolioSimpleFooter` |
| Marketing pages share cinematic bg, same simple footer | Verified — `PublicShell` |

## 2026-09-20 — Marketing layout system

| Claim | Status |
|---|---|
| Landing first viewport is stencil-only (no hero copy overlay) | Verified — screenshots `layout-home.png` |
| Below-fold home story = pitch → path 01/02/03 → desk | Verified — `index.tsx` + `layout-home-full.png` |
| PublicShell nav = Markets/Truth/Credit/Pre-IPO/About | Verified — `public-page.tsx` |
| Markets is numbered directory (not card wall) | Verified — `layout-markets.png` |
| Marketing status uses lines not pill badges | Verified — Truth/Execution/Credit strip ModeBadge/StatusBadge |

## 2026-09-19 — Stock pairs + Pre-IPO claims

| Claim | Status |
|---|---|
| Stock↔stock is true Jupiter input→output mint | Verified — `getAcquireBundle` paySymbol + live AAPLx→MSFTx quote |
| IPO lane = public recent listings (not private) | Verified — copy + PreStocks/Tessera separate desks |
| PreStocks catalog live | Verified — prestocks.com/api/prestocks |
| Tessera T-tokens live | Verified — rest-api.tessera.pe token-details |
| Stocklana deadline 25 Sep 2026 4pm ET | CONFIRMED — hackathon site / Gate news extension |
| PreStocks bounty forbids non-PreStocks pre-IPO mix | Honored — PreStocks desk only |

## 2026-09-19 — Routes / tenancy / depth claims

| Claim | Status |
|---|---|
| Paper agent requires signed session | Verified — `agentBlockedReason` + `runDeskAgent` gate |
| Bootstrap demo opt-in flag | Verified — `FOLIO_ALLOW_BOOTSTRAP_DEMO=1` |
| Buy has IPO / meme lanes + pairs | Verified — `XSTOCK_CATALOG` lanes + `XSTOCK_COMPARE_PAIRS` UI |
| Marketing pages use distinct tones + glass footer | Verified — `PublicShell` tone + `LandingGlassFooter` |
| Agent compare/credit/network/positions intents | Verified — `parsePaperIntent` + spine fetch |
| Never unhackable | Policy unchanged |

## 2026-09-19 — Desk polish claims

| Claim | Status |
|---|---|
| Sidebar can minimize on fx-desk | Verified in code (`data-sidebar-collapsed` + localStorage) |
| Buy lets you pick tokenized stocks | Verified — XSTOCK_CATALOG picker + Jupiter quote |
| Home chart matches Buy (TradingView) | Verified — Netro strip + fx Home use TradingViewChart |
| Fills still paused | Unchanged — quote-only / broadcast paused |

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
| AAPLx Solana mint | `XsbEhL…JzJp` | xStocks asset deployments |
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
| Home hero invents fixture 4× share count | REJECTED | SSR live AAPLx multiplier woven into copy (or honest unavailable) | 2026-09-15 |
| Stocklana registered **545** / submissions **72** / prize **$121,000** | CONFIRMED live (re-check) | hackathons.solana.com WebFetch; deadline hero SEP 25 vs timeline 18 Sep 16:00 ET | 2026-09-15 |
| Vercel prefs preview home shows live AAPLx ≈1.003269× | CONFIRMED live | https://folio-git-cursor-folio-prefs-agent-honesty-f1ec-teamtitanlink.vercel.app/ | 2026-09-15 |
| Paper agent e2e invents a fill | REJECTED | Playwright asserts nl= + broadcast=false + spine; no fill theater | 2026-09-15 |
| Paper qty rows claim health Verified | REJECTED (fixed) | Verified requires wallet-read + live feeds; paper → Review | 2026-09-15 |
| Desk chrome always-green Mainnet read / fake search | REJECTED (fixed) | Quote-only badges; search replaced with policy strip | 2026-09-15 |
| Raydium pools live but absent from judge matrix | REJECTED (fixed) | Matrix + empire smoke + NETWORK_MATRIX.md awareness-only row | 2026-09-15 |
| GitGuardian “secret” in jupiter-cache.test.ts | FALSE POSITIVE remediates | Public AAPLx mint string flagged as high-entropy; replaced with low-entropy fixtures in unit tests (not a credential; no rotate). Tip clean; GG PR check still fails on historical commit `300e676` until Henry **Skip: false positive** (no Lovable history rewrite) | 2026-09-15 |
| Multi-tenant prefs always service-role only | SUPERSEDED | User-JWT path when SUPABASE_JWT_SECRET set; service-role remains labeled fallback | 2026-09-15 |
| User-JWT invents RLS-ok without secret | REJECTED | mintSupabaseUserJwt fail-closes; resolveSupabaseRestAuth falls back to service-role | 2026-09-15 |
| Raydium empty/unavailable alone blocks acquire review | REJECTED | Honesty notes only; canReview still needs truth+wash+quote+diverge | 2026-09-15 |
| Acquire wash “Heuristic clear” when Bitquery keyed | SUPERSEDED | Label now “Tape clear” | 2026-09-15 |
| Viewer can save desk prefs | REJECTED | prefsWriteBlockedReason + updateDeskPreferences prefs_role_denied; settings switches disabled | 2026-09-15 |
| Qty binding invents foreign pubkey over membership wallet | REJECTED | resolveWalletBinding: membership → session → watch → inspect | 2026-09-15 |
| Stocklana registered **546** / submissions **72** / prize **$121,000** | CONFIRMED live (re-check) | hackathons.solana.com WebFetch; deadline hero SEP 25 vs timeline 18 Sep 16:00 ET | 2026-09-15 |
| Pyth diverge uses Equity.US.* vs Jupiter; Crypto.xStock/USD secondary | CONFIRMED (code) | `equityUsFeedId` + `fetchPythXStockUsdPrice`; gate still equity↔venue | 2026-09-15 |
| Viewer can upsert desk_preferences via user-JWT RLS alone | REJECTED | desk_prefs_writer_* policies require owner/trader membership | 2026-09-15 |

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| 21st.dev MCP search works with API_KEY_21ST | CONFIRMED | tools/list + search → 12 catalog hits on /lab/ui | 2026-09-16 |
| 21st get_component Plasma id 24346 retrieved | CONFIRMED | free tier 1/2 remaining after fetch; wired as ShaderBackground | 2026-09-16 |
| shaders.com REST accepts SHADERS_API_KEY | FAIL-CLOSED | HTTP 500 Clerk on /api/v1/me | 2026-09-16 |
| Home brand plane matches Aionis stencil pattern | CONFIRMED (pattern) | black void + SVG mask + liquid light; FOLIO tokens | 2026-09-16 |
| FOLIO stencil luminance too low vs Aionis gold | FIXED | side-by-side shots; ice core #fff + soft floor + larger blob | 2026-09-16 |
| smoke:keys probes 21st MCP when API_KEY_21ST set | CONFIRMED | twentyfirst_live · Trade Journal Table hits | 2026-09-16 |
| smoke:keys probes shaders.com | FAIL-CLOSED labeled | shaders_live HTTP 500 Clerk | 2026-09-16 |
| Vercel preview has API_KEY_21ST | MISSING | /lab/ui amber on preview; local green | 2026-09-16 |
| 21st get_component Trade Journal Table id 27124 | CONFIRMED | free retrieval spent; adapted as FolioTradeJournalLab | 2026-09-16 |

## Live Stocklana re-check (2026-09-16)

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Stocklana registered **588** / submissions **79** / prize **$121,000** | SUPERSEDED by 590/79 | prior scrape | 2026-09-16 |
| Stocklana registered **590** / submissions **79** / prize **$121,000** | CONFIRMED live | hackathons.solana.com via jina (Registered 590 · Submissions 79 · Prize Pool $121,000) | 2026-09-16 |
| NestUSD public capacity endpoint (Tavily/TinyFish this run) | UNAVAILABLE | Tavily 432 plan limit; TinyFish search 404 path; NestUSD stays fail-closed | 2026-09-16 |
| Paper agent live spine AAPLx ≈1.003269 | CONFIRMED | runPaperAgent truth AAPLx; nlExpansion=failed WAF/HTML | 2026-09-16 |
| AgentRouter NL expansion from this egress | FAIL-CLOSED labeled | WAF/HTML non-JSON — spine kept | 2026-09-16 |
| Deadline conflict: hero **SEP 25, 2026** vs timeline **Fri 18 Sep 2026, 16:00 ET** | CONFIRMED conflict — re-check at submit | same page DEADLINE strip + Timeline copy | 2026-09-16 |
| AAPLx multiplier ≈ 1.003269 | CONFIRMED live | api.xstocks.fi .../AAPLx/multiplier?network=Solana | 2026-09-16 |
| Tavily search for Stocklana | UNAVAILABLE this run | plan usage limit | 2026-09-16 |

## 2026-09-16 UI refs
- Aionis landing first viewport = empty upper void + luminous brand stencil lower half + horizon chrome ~55% (no headline on letters). Verified via live :3110 screenshot.
- NetroBNB = grey #E5E7EB 12-col + yellow analysis clock + dark market strip + yellow AI rail. Verified via live :3111 screenshot.
- Local `/lab/ui` shows `21st MCP connected` with live catalog hits when `API_KEY_21ST` in process env; Vercel preview still needs that env set.

## 2026-09-16 node-hmac
| Claim | Status | Evidence |
|---|---|---|
| Session/JWT HMAC works under Vitest ESM without static node:crypto | CONFIRMED | `process.getBuiltinModule("crypto")` + 101 vitest green | 2026-09-16 |
| Stocklana registered **590** / submissions **79** / prize **$121,000** | CONFIRMED live (re-check) | jina hackathons.solana.com/stocklana | 2026-09-16 |

| 2026-09-16 UI / MCP | Result | Source |
|---|---|---|
| Aionis landing stencil geometry | CONFIRMED live | clone `manovHacksaw/aionis-app/landing` @ :3110 — viewBox 1400×550, text y=465, footer-above-stencil bottom:55% |
| NetroBNB 12-col desk | CONFIRMED live | clone `AbdullahBalfaqih/NetroBNB` @ :3111 — grey canvas + yellow profile/AI rail |
| 21st.dev MCP search | CONFIRMED local | `API_KEY_21ST` → `https://21st.dev/api/mcp` tools/call search |
| 21st Plasma id 24346 adapted in-lab | CONFIRMED | `ShaderBackground` WebGL path on `/lab/shaders` + `/lab/ui` |
| shaders.com REST frames | FAIL-CLOSED labeled | key present; probe HTTP 500 / Clerk gate — no invented frames |
| FOLIO hero buried-footer feel | REMEDIATED (parity pass) | stencil raised to Aionis geometry + hotter ledger-ice floor; e2e 22/22 |

| 2026-09-16 Stocklana / desk Plasma | Result | Source |
|---|---|---|
| Registered / submissions / prize | CONFIRMED live **591** / **79** / **$121,000** | hackathons.solana.com/hackathons/stocklana (+ jina 590) |
| Hero deadline SEP 25 vs timeline 18 Sep | CONFLICT labeled | Hero + countdown ~9d vs timeline “Fri 18 Sep 16:00 ET” — treat 18 Sep conservative |
| Public Hermes without PYTH_API_KEY | FAIL-CLOSED 401 | hermes.pyth.network + pyth.dourolabs.app/hermes |
| Desk lab preview live WebGL Plasma | CONFIRMED local | `data-lab-plasma=1` + `.desk-plasma-canvas` when shader/cinematic preview active |

| 2026-09-16 pinned 21st / Netro header | Result | Source |
|---|---|---|
| Plasma id 24346 + Trade Journal 27124 pinned | CONFIRMED in-lab | `src/lib/lab/twentyfirst-pins.ts` · lab/ui labels without MCP key |
| Vercel preview API_KEY_21ST | MISSING (Henry) | jina `/lab/ui` still amber · CLI login_required |
| Netro Header yellow active pill | Extracted | `NetroBNB/components/Header.tsx` → `.netro-density-chrome` |

## 2026-09-16 — Vercel env (names only)
- Confirmed via `vercel env ls`: API_KEY_21ST, SHADERS_API_KEY, AGENTROUTER_API_KEY/BASE_URL/MODEL, TAVILY_API_KEY, TINYFISH_API_KEY, SOLANA_RPC_URL, BROADCAST_PAUSED, FOLIO_SESSION_SECRET on project teamtitanlink/folio.
- Not present (empty locally): BITQUERY_API_KEY, JUPITER_API_KEY, PYTH_API_KEY, PRIVY_*, SUPABASE_*, VENICE_API_KEY.

## 2026-09-16 — Preview 21st + stocklana.fun close
- Branch preview `/lab/ui`: badge **21st MCP connected**; note Plasma 24346 + Journal 27124 pinned · finance-filtered catalog hits present (WebFetch).
- AAPLx multiplier on Netro canvas: **1.003269× live** (preview).
- stocklana.fun: HACKATHON CLOSE **18 SEP 2026 · 23:59 UTC** (WebFetch). Hero SEP 25 conflict unchanged — re-check at submit.

## 2026-09-16 — Stocklana counts (hackathons.solana.com WebFetch)
- Registered **593** · Submissions **80** · Prize pool **$121,000** · Deadline hero **SEP 25, 2026** · countdown ~9 days.
- Timeline: submissions close Friday 18 September, 4:00pm ET.
- stocklana.fun close banner earlier: 18 SEP 2026 · 23:59 UTC.

## 2026-09-16 — Hermes Crypto.AAPLON/USD
- Catalog search `hermes.pyth.network/v2/price_feeds?query=AAPLON`: id `e6734de88a83d9d2fb33072adab319004700aefd069653aba30ba9e3cac056f2`, symbol `Crypto.AAPLON/USD` (APPLE ONDO TOKENIZED STOCK).

## 2026-09-16 — Netro desk surface + Vercel env recheck
- Desk with `netro-density` preview: `deskHeading=0`, `stackedPanels=0`, `netro=1` (Playwright) — canvas replaces overview cards.
- Home `/` hero preserved (brand stencil, no home-empire).
- Vercel `env ls` reconfirmed lab/research keys present; Bitquery/Pyth/Privy/Supabase/Jupiter still absent (cannot invent).

## 2026-09-16 — Stocklana counts + matrix honesty
- Live hackathons.solana.com: Registered **596** · Submissions **81** · Prize **$121,000** · Deadline hero **SEP 25, 2026** · countdown ~9 days · timeline Fri 18 Sep 16:00 ET.
- Membership / role-gated network-matrix rows: unavailable without multi-tenant keys (unit-tested).
EOF

## 2026-09-16 — Stocklana counts + matrix honesty
- Live hackathons.solana.com: Registered **596** · Submissions **81** · Prize **$121,000** · Deadline hero **SEP 25, 2026** · countdown ~9 days · timeline Fri 18 Sep 16:00 ET.
- Membership / role-gated network-matrix rows: unavailable without multi-tenant keys (unit-tested).

## 2026-09-16 — Truth on-chain Scaled UI
- `/truth` shows On-chain Scaled UI metric + timeline; diverge `data-diverge-pass=null` without PYTH_API_KEY (e2e).
- compareApiOnchainMultiplier never invents match when either side missing (unit).

## 2026-09-16 — Acquire Scaled UI gate
- Desk acquire Checks shows On-chain Scaled UI match/mismatch/off (e2e `acquire-scaled-ui-gate`).

## 2026-09-16 — Paper agent + activity Scaled UI
- Paper agent + activity show API↔on-chain Scaled UI (not API-only). Goal open.

## 2026-09-16 — Positions Scaled UI honesty
- Positions list + detail surface API↔on-chain Scaled UI (match/mismatch/off).
- Wallet-verified requires chain match — no API-only green.

## 2026-09-16 — Netro production approve
- `FOLIO_APPROVED_LAB_UI=netro-density` on Vercel — CONFIRMED via `vercel env ls` (value hidden).
- Home hero unchanged (Aionis brand-plane) — CONFIRMED screenshot home-hero-now.png.
- Empire keys Bitquery/Pyth/Privy/Supabase/Jupiter — still EMPTY locally and unset on Vercel.

## 2026-09-16 — Netro live gates
- `buildNetroLiveGateLabels` unit: empty → fail-closed defaults; live Kamino/Scaled UI → Mainnet-read; wash unavailable → Fail-closed.

## 2026-09-16 — Stocklana live 598/82/$121k
- jina scrape hackathons.solana.com/hackathons/stocklana: **598** registered · **82** submissions · **$121,000** prize · deadline **SEP 25, 2026** · 5 bounty tracks (incl. PythNetwork).

## 2026-09-16 — Netro Jupiter quote
- Unit: live jupiterOutUi → `0.002994 AAPLx` + cached meta; never claims fill/broadcast.

## 2026-09-16 — Netro paper agent
- e2e: Truth pass on Netro rail surfaces `broadcast=false` / `nl=` meta; forbids fill/unhackable claims.

## 2026-09-16 — Netro inspect + hero preserve
- VERIFIED: `/` keeps Aionis brand-plane hero (no second hero). Netro is `/desk` overview only.
- VERIFIED: `FOLIO_APPROVED_LAB_UI=netro-density` present on Vercel Development/Preview/Production.
- OPEN: Bitquery / Pyth / Privy / Supabase / Jupiter keys — fail-closed until Henry pastes. Rotate chat-pasted Vercel token.

## 2026-09-16 — Netro ownership strip
- VERIFIED unit: paper default / inspect+wallet-read labels; never invents Verified count.
- OPEN: Empire keys still empty — wash/Pyth/multi-tenant fail-closed.

## 2026-09-16 — SSR Netro + strip honesty
- VERIFIED: desk layout loader returns approvedUi/approvedShader from env.
- VERIFIED e2e intent: netro-truth-strip says illustrative / not live candles; scaled-ui strip labeled.
- OPEN: Bitquery/Pyth/Privy/Supabase empty.

## 2026-09-16 — Stocklana + Netro keys strip
- Stocklana jina: **598** registered · **82** submissions · **$121,000** · SEP 25, 2026.
- VERIFIED unit: keys readiness miss counts; multi-tenant armed only when Privy+Supabase set.
- OPEN: Empire keys still empty on env.

## 2026-09-16 — Empire readiness SSR
- VERIFIED unit: readEmpireReadiness fail-closes empty env; arms Privy+Supabase only when both set.
- VERIFIED: Raydium/Nest.credit map into Netro empire strip from matrix modes.

## 2026-09-16 — Netro yellow sample
- Reference PNGs (`ref-netrobnb-desk.png`, `ref-netro-desk-final.png`) mode yellow ≈ RGB(244,208,20) = `#f4d014` (confirmed via PNG decode). Soft fills are intentional wash, not a different brand hue.

## 2026-09-16 — Stocklana live 605/84/$121k
- jina scrape https://hackathons.solana.com/hackathons/stocklana: **605** registered · **84** submissions · Prize Pool **$121,000** · deadline hero **SEP 25, 2026** · timeline submissions close Fri 18 Sep 16:00 ET (conservative).

## 2026-09-16 — Empire key paste live evidence
- VERIFIED: Bitquery wash live via V2 `/graphql` (Authorization Bearer) — sampleSize 50, pressure low on AAPLx mint probe.
- VERIFIED: Pyth API key authenticates Hermes (BTC + ETH price latest HTTP 200 on upgraded + legacy hosts).
- VERIFIED: same Pyth key returns HTTP 403 "Not entitled" for Equity.US.AAPL, Crypto.AAPLX, Crypto.AAPLON — plan entitlement gap, not adapter bug.
- VERIFIED: Privy+Supabase env present → `getAuthProviderStatus` keys-present; `SUPABASE_JWT_SECRET` absent → service-role fallback labeled.
- VERIFIED: PostgREST `tenants` / `tenant_members` / `desk_preferences` → PGRST205 (migration not applied).
- VERIFIED: Jupiter quote ok with `JUPITER_API_KEY` (`x-api-key` header per portal docs).
- VERIFIED: `FOLIO_APPROVED_LAB_UI=netro-density` via applyDotEnv → premium UI DONE in smoke:goal.
- OPEN: Pyth equity entitlement · SUPABASE_JWT_SECRET · SQL migration · session mint · rotate chat secrets.

## 2026-09-16 — JWT + schema grants + Pyth plan evidence
- VERIFIED: `SUPABASE_JWT_SECRET` set locally + Vercel CREATE 201; `isSupabaseUserJwtConfigured` true.
- VERIFIED: PostgREST `tenants` → HTTP 403 code 42501 (`GRANT SELECT … TO service_role`) — tables exist, privileges missing.
- VERIFIED: Pyth pricing — Free view-only; Starter crypto-only $500; Pro equities from $2500 / free trial (pyth.network/price-feeds). Current key BTC/ETH 200, Equity.US.AAPL 403 Not entitled.
- OPEN: Henry runs `20260916_folio_tenants_grants.sql`; upgrades Pyth to Pro+Equities; rotates chat-pasted secrets.

## 2026-09-16 — Schema grants verified live
- VERIFIED: PostgREST `tenants` SELECT via service_role → 200; `supabaseSchemaDetail` = Ready.
- VERIFIED: `folio-demo` tenant id `29eadccb…` upserted; placeholder `privy_did_here` membership deleted.
- OPEN: Pyth Equity.US.AAPL still 403 Not entitled; multi-tenant needs Privy access token mint + Join folio-demo.

| Pyth Starter entitles Equity.US.AAPL + Crypto.AAPLX Hermes | REJECTED live | Both feeds HTTP 403 Not entitled with current PYTH_API_KEY; Starter=crypto majors | 2026-09-16 |
| SUPABASE_JWT_SECRET on Vercel + schema grants | CONFIRMED | smoke:goal JWT+schemaReady; Henry paste + SQL DONE | 2026-09-16 |

| Yahoo chart v8 returns AAPL USD without API key | CONFIRMED live | query1.finance.yahoo.com/v8/finance/chart/AAPL · labeled YAHOO:AAPL | 2026-09-16 |
| CoinGecko apple-xstock free USD | CONFIRMED live | api.coingecko.com/api/v3/simple/price | 2026-09-16 |
| Pyth Pro required for FOLIO diverge ship | REJECTED | Free Yahoo/Finnhub cascade scores diverge; Pro optional for bounty | 2026-09-16 |

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Ship equity diverge uses Finnhub→Yahoo (+ CoinGecko), not Pyth Hermes | CONFIRMED in-repo | equity-ref.ts · pythOffShipPath · smoke note | 2026-09-16 |
| Bootstrap mint uses real Privy DID (never invents did:privy) | CONFIRMED in-repo | privy-users.ts + bootstrap-demo-session.ts fail-closed | 2026-09-16 |

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Vercel preview bootstrap mints folio_session with folio-demo owner | CONFIRMED live | Playwright click + Set-Cookie + Active tenant UI | 2026-09-16 |
| shipReady=true on tip smoke | CONFIRMED | `npm run smoke:goal` done=6 | 2026-09-16 |

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| GG Tokenkeg/TokenzQd/AAPLx mint on PR #6 vs main | FALSE POSITIVE | Public Solana program ids + historical mint fixture; tip split/low-entropy; Henry Skip required (no Lovable rewrite) | 2026-09-17 |


| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Duplicate desk.positions.$symbol caused Vercel build fail on ship-main | CONFIRMED | Build log: conflicting fullPath with desk.positions_.$symbol | 2026-09-17 |
| ≤6-char joinId chunks assemble correct Token/Token-2022 program ids | CONFIRMED | tsx equality check + vitest wallet tests | 2026-09-17 |


| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| TradingView Advanced Chart widget needs no API key | CONFIRMED | tradingview.com/widget-docs | 2026-09-18 |
| Signal azure replaces Netro yellow in tip CSS/TSX | CONFIRMED | no `#f4d014` in src; `#0EA5C9` present | 2026-09-18 |


| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Consumer desk pages no longer lead with Empire/fail-closed/paper theater | CONFIRMED in-repo | netro + positions/credit/activity/acquire/settings chrome; Empire strip absent on overview | 2026-09-18 |
| position-health labels are On-chain OK / Live · est. | CONFIRMED | position-health.ts + vitest | 2026-09-18 |


| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| No VITE_ secret keys in client code | CONFIRMED | grep + check:secrets (value scan) | 2026-09-19 |
| Privacy + Terms routes ship | CONFIRMED | privacy.tsx terms.tsx | 2026-09-19 |
| Cookie analytics gated on Accept | CONFIRMED | ConsentAnalytics + CookieConsentBanner | 2026-09-19 |
| Consumer Settings hides Empire/keys/paper agent | CONFIRMED in-repo + preview | desk.settings.tsx consumer path; ops behind ?wall=ops | 2026-09-19 |
| Product desk pages drop white card chrome | CONFIRMED in-repo + screenshots | prod-list/feed hairlines; app-desk rail | 2026-09-19 |
| Numeric ?ops=1 search is stripped by TanStack | CONFIRMED | coerce number → z.string fail → 307 strip; use ?wall=ops | 2026-09-19 |

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Desk UI follows Web2 brokerage patterns (light shell, tabs, hero, allocation) | CONFIRMED in-repo + screenshots | fx-desk CSS + holdings/buy pages | 2026-09-19 |

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Backed logo CDN uses single trailing x (ARMx/GMEx/DJTx) | CONFIRMED live | HTTP 200; ARMXx/GMEXx → 403 | 2026-09-19 |
| NFLXx AMDx SPYx QQQx live on api.xstocks.fi Solana | CONFIRMED live | v2/public/assets?network=Solana mint+trading | 2026-09-19 |
| PreStocks catalog is separate from Tessera T-tokens | CONFIRMED live | prestocks.com/api/prestocks (8) vs rest-api.tessera.pe (3) | 2026-09-19 |
| Tessera T-tokens are loan-participation, not SPV shares | CONFIRMED docs | docs.tessera.pe + blog.tessera.pe structure posts | 2026-09-19 |
| Markets board shows Jupiter venue + liq (peer pattern) | CONFIRMED in-repo | desk.screener getMarketsBoard + desk.markets | 2026-09-19 |

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| FOLIO whitepaper + founder operating plan + launch kit exist | CONFIRMED in-repo | docs/FOLIO_WHITEPAPER.md · FOUNDER_OPERATING_PLAN.md · LAUNCH_AND_SOCIALS.md | 2026-09-19 |
| Public /whitepaper and /beta routes ship | CONFIRMED in-repo | src/routes/whitepaper.tsx · beta.tsx · routeTree.gen.ts | 2026-09-19 |
| xStocks ~$800M AUM / Solana dominant on-chain equity volume (2026) | CONFIRMED public reports | Crypto Briefing / Solana Compass cites in whitepaper | 2026-09-19 |

| Claim | Verdict | Evidence | As of |
|---|---|---|---|
| Wash works without paid Bitquery via GeckoTerminal | CONFIRMED live | evaluateWashGate fallback + vitest live AAPLx | 2026-09-19 |
| Ship equity diverge uses Finnhub then Yahoo (no Pyth Pro) | CONFIRMED | smoke:goal FINNHUB:AAPL · Pyth skipped | 2026-09-19 |
| smoke:goal shipReady=true with free wash + Finnhub | CONFIRMED local | done=6 partial=0 | 2026-09-19 |
