# FOLIO — Extreme Win Bible (FINAL · Stocklana · Solana) · EMPIRE

> **Status:** FINAL uniqueness **2026-09-12** · [`stocklana/FOLIO_UNIQUENESS_LOCK.md`](memory/research-raw/hackathons/stocklana/FOLIO_UNIQUENESS_LOCK.md) · [`UNIQUENESS_RELOCK_ALL_2026-09-12.md`](memory/research-raw/hackathons/UNIQUENESS_RELOCK_ALL_2026-09-12.md)  
> **Doctrine:** [`EMPIRE_DOCTRINE.md`](memory/research-raw/hackathons/EMPIRE_DOCTRINE.md) · Plan: [`stocklana/EMPIRE_PLAN.md`](memory/research-raw/hackathons/stocklana/EMPIRE_PLAN.md) · **Network:** [`stocklana/NETWORK_MATRIX.md`](memory/research-raw/hackathons/stocklana/NETWORK_MATRIX.md)  
> **Uniqueness (relocked 2026-09-12):** [`stocklana/FOLIO_UNIQUENESS_LOCK.md`](memory/research-raw/hackathons/stocklana/FOLIO_UNIQUENESS_LOCK.md)  
> **Host:** Solana Foundation · Stocklana, then Crypto World’s Fair  
> **Side tracks (2026-09-24):** **Meteora DBC** primary · **Solami** tape · **Panta** not taken  
> **Funds law (Henry 2026-09-12):** No mainnet deploy budget → **devnet curve + mainnet-READ tape**. Never fake xStocks. Never invent mainnet volume.

---

## Soft (plain — anyone)

FOLIO buys the US stocks you want on Solana — keeps share counts honest, won’t buy in shady pools, and lets you borrow cash without selling.

## Unique job (not “another buy UI”)

**Honest stock desk on Solana.**  
Brokers buy. FOLIO keeps share counts true after dividends, refuses wash fills, opens credit without selling.

> Depth note only (never lead pitch): share truth = raw wallet tokens vs economic shares after splits/dividends.

## 8-second

Pick AAPLx → wallet shows 10 tokens, FOLIO shows the economic shares after the dividend → weekend price is far from Thursday’s close → buy stays blocked → Monday, gap gone, buy goes through.

## Social pain

X scrape for FOLIO timed out. Issuer docs did not.

Firecrawl of [docs.xstocks.fi dividends and splits](https://docs.xstocks.fi/docs/dividends-and-stock-splits): dividends and splits move an onchain **multiplier**. The holder does nothing. A wallet that shows the raw token amount is wrong after that event. Kraken’s FAQ says the same thing and says there is no cash dividend line.

Reddit still has the $109 fill when the stock never traded above $101, and Phantom not moving when Solscan did.

The screen leads with economic shares versus the wallet count, and the on-chain price versus the last cash close. Borrowing is not the complaint.

## Pitch order (judges)

1. Wallet share count is wrong after a dividend · 2. Weekend pool is far from Thursday’s close · 3. The buy stays blocked · 4. The stock curve on Meteora starts at the cash close and does not moon · 5. Solami tape is the proof  

Never lead with borrow, English-DCA, or a meme launchpad.

## World’s Fair side tracks (2026-09-24)

Pasted prizes, not re-verified against a second page.

| Track | Pool | FOLIO |
|---|---|---|
| **Meteora DBC** | 20k USDC · 10k / 5k / 3k / 1.5k / 500 · winners by 31 Oct | **Primary.** |
| **Solami** | 3,000 USDG · 1,200 / 1,000 / 500 / 300 · winners by 28 Oct | **The tape.** Mainnet read. |
| **Panta** | 5,000 USDG · 2k / 1k / 1k / 1k · winners by 27 Oct | Not the product. A prediction-market app is a different job. |

### Meteora (docs read 2026-09-24)

DBC is a virtual pool. Traders move a curve. At the quote threshold it migrates to DAMM v2. Program `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN` on mainnet and devnet. Keepers migrate a USDC quote at **750 USDC**. Curve is a start price plus up to 16 segments. Higher virtual liquidity means price moves slower. Fee scheduler is fixed, linear, or exponential from pool open. It does **not** know NYSE hours.

FOLIO’s stock config, not a meme config:

- Quote is USDC. Graduation target is the 750 USDC keeper path, labeled.
- Start price is the last cash close, not a vanity number.
- Curve is the gentle one (high liquidity), so a thin name does not jump on a small buy.
- Fee is fixed or a short linear anti-sniper. Exponential “fee starts at the moon” is the meme preset. We do not ship that as the stock preset.
- Weekend and closed-session refusal stays in FOLIO. The curve cannot see the bell. Do not claim an on-chain market-hours hook.
- Demo pool can be devnet. Real xStock prices are mainnet **reads**. No fake mainnet volume.

Delete DBC and this sidetrack dies. Delete the cash-close check and it is just another launchpad.

### Solami

Blur or Yellowstone shows trades, launches, and pool changes without FOLIO parsing instructions. The desk plots pool price against Thursday’s close. Signup they named: `https://solami.dev/signup?ref=st-earn-sep-26` (7-day Pro: 2 unmetered gRPC streams, 1 TB Blur, 200 RPC req/s). Beam only if a tx is sent. A read-only mainnet tape satisfies “live” without spending the migration USDC.

Solami judges score: Solami does real work, a 2–3 min mainnet demo, a README someone else can run, usefulness, creativity. At least one of RPC, Yellowstone gRPC, Mirage, Blur, Data API, webhooks, or Beam.

### What “live” means here

| Piece | Where |
|---|---|
| Stock curve config + one devnet pool | Devnet DBC → labeled DAMM v2 path |
| xStock multiplier, cash close, real pool prints | Mainnet read via Solami |
| Weekend buy | Blocked in FOLIO. Not an on-chain clock. |

### Panta

Leave it. Their API can discover, create, and trade YES/NO markets. That is a second product. Do not add it to win the 5,000 USDG.

### Meteora links

- What DBC is: https://docs.meteora.ag/core-products/dbc/what-is-dbc  
- Curve: https://docs.meteora.ag/core-products/dbc/universal-curve  
- Fees: https://docs.meteora.ag/core-products/dbc/fees/fee-scheduler  
- Dev guide: https://docs.meteora.ag/developer-guides/dbc  
- SDK: https://github.com/MeteoraAg/dynamic-bonding-curve-sdk  
- DAMM v2: https://github.com/MeteoraAg/damm-v2  
- Discord: https://discord.com/channels/841152225564950528/864859354335412224  
- Telegram: https://t.me/meteora_dev  
- Closed-source judging: GitHub read for `dannxbt`  

Sponsor ideas we are not building: a config marketplace, a generic stock launchpad, conviction pools as the headline.

## Beachhead

**EU / APAC non-US** Solana users. Accra = build base only.

---

## Network truth (verified)

| Thing | Network |
|---|---|
| Real xStocks / NestUSD / Kamino xStocks market | **Mainnet only** |
| Jupiter DCA execute with liquidity | **Mainnet** (devnet ≈ no routes) |
| FOLIO program · Token-2022 harness · policy | **Devnet OK** (airdrop) |
| xStocks API · Pyth · Jupiter **quote** · pool GETs · **Solami** tape | **Mainnet READ** (no broadcast) |
| FOLIO stock curve (DBC → DAMM v2) | **Devnet** demo · mainnet only if budget exists |
| CPI into Jupiter/Kamino with real accounts | **Local mainnet-fork** (clone) |

Block 0 (new chat, $0 broadcast): multiplier + wash spine + live reads + quote path + fork docs.

---

## Mandatory spine (all still mandatory — serves the wedge)

xStocks multiplier · cash close · closed-session block · **DBC stock config** (USDC, gentle curve, fixed or short linear fee) · **Solami** mainnet tape · DAMM v2 migration labeled at the 750 USDC keeper path.  
Still in the desk, not the sidetrack pitch: Jupiter quote, wash gate, Token-2022.

## Honesty

No demo equity mints · no fake fills · label quote-only vs broadcast · NestUSD risk labeled · never claim ≥10 users until logged.

## Mentors / outreach

Handles + warm drafts: [`stocklana/STOCKLANA_WORLDSFAIR_2026-09-15.md`](memory/research-raw/hackathons/stocklana/STOCKLANA_WORLDSFAIR_2026-09-15.md).  
Key: @kashdhanda (Jupiter) · @y2kappa (Kamino) · @colosseum · @crabbylions · @mattytay · @adamdelphantom.  
**Send only after Block 0 demo link.**

## New-chat handoff

Start **Block 0** per NETWORK_MATRIX + uniqueness lock. Need: RPC · Bitquery · Jupiter if gated · rotate TinyFish if exposed.

## Identity

Henry Sam Marfo · @henrysammarfo · github.com/henrysammarfo
