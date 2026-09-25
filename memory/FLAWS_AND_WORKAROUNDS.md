# FOLIO — flaws, bugs, workarounds (live research)

> Updated: 2026-09-24 · Honest residual risk. Never claim unhackable.

## Multi-venue markets

| Finding | Severity | Workaround / fix |
|---|---|---|
| Jupiter Price v3 429s under parallel catalog fetch | High (empty board) | Stagger mint probes (~90ms) · free-tape + Solami fallbacks · never invent marks |
| Single-venue UI hid free-tape / Raydium / Solami | High (Henry shot) | `resolveMultiVenuePrice` returns all four · board venue pills |
| Raydium API has TVL/volume but not always a mid price | Med | Show Raydium as **liq awareness** only — no invented mid |
| GeckoTerminal rate / empty pools for thin mints | Med | Label `off` · do not paint Ready |
| Solami Blur requires `DataApi` key (`SOLAMI_API_KEY`) | Med | Key landed · Blur GB optional · **Solami RPC tape is the free live path** |

## Solami Blur (Bible tape)

| Finding | Severity | Workaround / fix |
|---|---|---|
| Solami Blur requires prepaid streaming bandwidth | Med | **Do not buy $25 Blur GB for demo** · Free/Pro **RPC** satisfies Bible Solami track · Blur mark optional when `remaining_bytes>0` |
| REST host is `https://api.solami.dev` (not `.fast` / invent hosts) | — | Documented from official `/docs/api/get_data-token-price` |
| Fractional fields are **decimal strings** | Bug if ignored | `Number(price_usd)` before math |
| Response is bare array · mint may be omitted if no USD-able trade | Med | Match on `mint` · never invent |
| Auth: Bearer + DataApi permission | Key landed | Blur still 402 with 0 bandwidth |
| HTTP 402 / `remaining_bytes: 0` | Expected without prepaid GB | Use `rpc.solami.dev` tape · label Blur optional |
| Docs “which product” | Binding | **read state with RPC** · streams optional · Beam only if sending tx |
| Stocklana signup `st-earn-sep-26` | Optional | 7-day Pro free (RPC/gRPC) · auto-revert Free · no card — still not free Blur GB |

## Meteora DBC (Bible primary)

| Finding | Severity | Workaround / fix |
|---|---|---|
| Official SDK `@meteora-ag/dynamic-bonding-curve-sdk` pulls `@coral-xyz/anchor` — CJS `exports` in ESM breaks Vercel SSR when statically imported | **Critical (500 all desk)** | Production path: config + RPC `getAccountInfo` only · SDK via `FOLIO_DBC_SDK=1` / vitest · never static-import SDK into desk.functions |
| `buildCurveWithMarketCap` with fixed 100bps start=end ≈ stock fee (not meme exponential) | — | FOLIO preset locks linear scheduler equal bps (unit-tested) |
| Mainnet DBC **pool create** needs funded payer (rent ≫ ≤~$1) | Expected | See **DBC create cost** below · After you create: `FOLIO_DBC_POOL` + `FOLIO_DBC_NETWORK=mainnet` — never invent address · Bible allows devnet demo; prices stay mainnet-read |
| Mainnet DBC program `dbcij3…` is executable on public RPC | Verified 2026-09-24 | `programExecutable: true` via JSON-RPC (no web3.js required on SSR) |
| Curve does not know NYSE hours | Bible | FOLIO `session-gate` refuses weekend size |
| Multi-venue × full catalog can timeout Vercel | High | Bounded concurrency (3) · parallel venues per mint |
| Pyth Hermes free trial only | Low | Keep off ship path · Finnhub/Yahoo + CoinGecko remain diverge |

### DBC create cost (mainnet, verified math 2026-09-25)

Not inventable. FOLIO cannot sponsor this on the ≤~$1 Bible budget.

| Line item | SOL (approx) | USD @ ~$121/SOL | Source |
|---|---:|---:|---|
| Pool + vaults rent (typical create) | **~0.022** | **~$2.70** | Community/docs estimate · Solana rent on multi-KB accounts |
| Base mint rent | ~0.0011 | ~$0.13 | `getMinimumBalanceForRentExemption(82)` |
| Quote + base vault ATAs (×2) | ~0.0030 | ~$0.36 | rent on 165-byte token accounts |
| Config account (if you create a new config) | ~0.01–0.02 | ~$1.20–2.40 | rent on ~2–4 KB |
| Optional `poolCreationFee` | **0** or **0.001–100** | $0+ | SDK: `MIN_POOL_CREATION_FEE=1e6` lamports · Meteora 10% / partner 90% |
| Priority fee + buffer | ~0.005–0.015 | ~$0.60–1.80 | congestion-dependent |

**Comfortable funded wallet to create config + pool:** **0.05–0.08 SOL (~$6–10)**.

**Bare minimum (reuse existing config, fee=0):** ~**0.025–0.035 SOL (~$3–4)** — still above ≤~$1.

**Not create cost:** Bible graduation **750 USDC** market cap is the *migration* threshold (curve → DAMM), not the SOL you need to open the pool. Seed liquidity / first buys are separate and optional for a demo mark.

**Wire after create:** paste pool address → `FOLIO_DBC_POOL` + `FOLIO_DBC_NETWORK=mainnet`.

## Overview / Netro depth

| Finding | Severity | Workaround / fix |
|---|---|---|
| Partner Pre-IPO/Tessera were text-only | High | AssetLogo + skeleton (prior pass) |
| Holdings paper “est.” feels demo | Med | Stronger Connect CTA · logos on ownership rows |
| AI rail too quiet vs Netro yellow column | Med | Stronger teal gradient + taller rail |
| Signal/risk was a thin add-on | Med | Gauge + cash-session week strip (weekend refuse honesty) |
| TradingView / Jupiter 429 still leave blank cells | Med | Soft cooling labels · multi-venue pills |

## Credit / NestUSD

| Finding | Severity | Workaround / fix |
|---|---|---|
| NestUSD execute still Nest’s app | Honesty | Metrics-only in FOLIO · never fake Nest CPI |
| Kamino ktx needs `BROADCAST_PAUSED=false` + session | Ops | Labeled fills paused vs live in-desk |

## Tests / endpoints

| Finding | Severity | Workaround / fix |
|---|---|---|
| Preview routes all HTTP 200 (2026-09-24 share cookie) | OK | Re-check after each deploy |
| Unit suite must stay green after SDK install | — | `npm test` · bible-spine hits live RPC for program probe |

## Keys

Research keys only in gitignored `.env`. Rotate after any chat paste. `SOLAMI_API_KEY` on Vercel — use **Solami RPC** for live tape; Blur prepaid GB is optional (not a $25 demo tax).
