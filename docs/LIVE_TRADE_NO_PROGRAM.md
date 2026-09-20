# Live trade without FOLIO custom program

> Updated 2026-09-20 · Research for Henry · **never claim unhackable**  
> Sources verified against Jupiter Swap V2 / Ultra gasless docs, Solana Kora docs, Phantom sponsored-tx recipe, jup-ag/plugin OSS.

## Decision lock

- **Do not deploy a FOLIO on-chain program** for Stocklana / $10 self-test. Program rent alone (~1 SOL class) is out of budget. Compose existing programs only.
- Live path = **xStocks Token-2022 · Jupiter Swap V2 `/order`+`/execute` · (later) Kamino / Kora**.
- Each tester brings **their own ~$10**. FOLIO does **not** sponsor other people's principal. Optional tiny SOL for fees is on each wallet.

## What you asked (USDC-only vs SOL-native)

| Wallet contents | Can they buy / swap / hold? | Verdict for $10 self-test |
|---|---|---|
| **USDC only** (~$0 SOL) | **Yes** via Jupiter **automatic gasless** or **JupiterZ** on `/order` when trade ≈ **≥ $10** and wallet SOL **&lt; 0.01**. Gas taken from swap as fee uplift (`feeBps`). ATA rent covered on auto path. | **Works for onboarding.** Slightly worse fill (gas surcharge). Perfect when you don't want to buy SOL. |
| **USDC + tiny SOL** (~0.02–0.05) | Full Jupiter routes; user pays gas in SOL; no gasless surcharge. | **Best UX / best quotes.** Recommended default for beta testers. |
| **SOL only** (no USDC) | Swap SOL → USDC or SOL → xStock via Jupiter. Still needs ATA rent (SOL or gasless). | **Also cool** for “use my SOL to buy/swap.” One hop more if you want USDC holdings later. |
| **USDC + SOL (comfortable)** | Same as USDC+tiny, with headroom for many small tries. | Ideal if you will hammer every feature with the same $10. |

### Recommendation (rank)

1. **Default ask testers:** hold **USDC + a little SOL** — best execution, no min-size trap on tiny probes.
2. **USDC-only path:** keep as first-class onboarding — Jupiter auto gasless / JupiterZ when we arm fills. Surface `gasless` + `feeBps` honesty in Buy UI. Note: sub-$10 probes may quote but fail execute (`errorCode=3`) on auto gasless; JupiterZ may still land smaller if an MM quotes.
3. **SOL-native buy path:** support as pay-asset option later (SOL → xStock) — no extra infra; same Jupiter `/order`. Nice for people who already hold SOL.
4. **Do not** turn on FOLIO integrator `payer` for closed beta — that would spend **your** SOL sponsoring everyone else's gas. Against “each person brings their own $10.”

## Gas options ranked (no FOLIO program)

### 1. Jupiter built-in gasless — **best first integration** (docs-verified)

- Docs: [Swap V2 gasless](https://developers.jup.ag/docs/swap/advanced/gasless) · [Ultra gasless](https://developers.jup.ag/docs/ultra/gasless) · [Order & Execute](https://developers.jup.ag/docs/swap/order-and-execute)
- Endpoint: `GET https://api.jup.ag/swap/v2/order` (+ `/execute`). Ultra V1 superseded by Swap V2.
- Three independent paths set `gasless: true`:
  1. **Automatic Jupiter sponsorship** — taker &lt; 0.01 SOL · trade ≈ ≥ $10 (dynamic) · Metis · fee uplift from swap · sponsor `gasTzr94…YRpnB`
  2. **JupiterZ RFQ** — MM pays signature + priority; Jupiter gas wallet can fund **output ATA rent** when no referral fees · **no min size** if MM quotes
  3. **Integrator `payer`** — FOLIO wallet co-signs; needs `referralAccount`+`referralFee`; Metis-only; **skip for beta**
- Reliable check: `signatureFeePayer == taker` ⇒ not gasless; else gasless path fired.
- Blog signal (Ultra V3, Oct 2025): Token-2022 + meme↔meme gasless expanded; min trade ~$10; JupiterZ ~$100M/day zero-slippage RFQ.

**FOLIO action when arming fills:** migrate quote path from `swap/v1/quote` → Swap V2 `/order` (quote-only until armed); show gasless + fee honesty on Buy sheet.

### 2. User pays SOL — simplest, best execution

No infra. Checklist copy: “keep ≥0.02 SOL for fees + ATA rent.” Matches $10 self-test where you buy AAPL, sell back to USDC, and only SOL dust moves.

### 3. Solana Foundation **Kora** paymaster — later

- OSS: [solana-foundation/kora](https://github.com/solana-foundation/kora) · docs: [solana.com/docs/tools/kora](https://solana.com/docs/tools/kora/getting-started)
- JSON-RPC paymaster: users pay fees in **USDC** (or fully sponsored). Operator funds signer SOL.
- TS: `@solana/kora` / `createKitKoraClient`. Token-2022 aware.
- **Later** if we want always-on USDC-only without Jupiter min-size rules. Needs ops + funded signer — not for Stocklana week.

### 4. Phantom sponsored tx (embedded) — niche

- [Phantom sponsored-transaction recipe](https://docs.phantom.com/recipes/transactions/sponsored-transaction) — dApp as fee payer via `presignTransaction`.
- Same economics as Jupiter integrator `payer`: **you** fund gas. Skip for “everyone brings their own $10.”

### 5. Jupiter Plugin OSS — optional UX boost, not a gas solution

- [jup-ag/plugin](https://github.com/jup-ag/plugin) — drop-in Ultra swap widget (modal/widget/integrated), RPC-less.
- Useful reference for sheet UX; FOLIO keeps custom Buy for honesty gates (wash / Scaled UI / broadcast pause).

## What is **not** needed

- Custom wash/truth program  
- Custom borrow CPI program  
- Fake mainnet fills  
- FOLIO sponsoring other testers' $10  

Honesty spine stays **mainnet-read + quote-only** until broadcast is intentionally armed with a **hard spend cap**.

## Pyth / oracles

Ship diverge remains **Yahoo/Finnhub + CoinGecko xStock**. Pyth stays off ship path until keyed + product decision. Do not block $10 self-test on Pyth.

## Closed-beta wallet checklist (per person)

1. Fund wallet with **~$10 USDC** (their money).
2. Prefer **+0.02–0.05 SOL** for fees (or rely on Jupiter gasless on ≥~$10 swaps).
3. Connect on Account · quote on Buy · review gates · fills stay paused until armed.
4. Self-test loop: buy AAPLx → hold → optional pair swap → sell back to USDC. Expect SOL dust as only lasting cost if user-pays-gas.

## Open-source / lab refs worth stealing patterns from

| Project | Steal |
|---|---|
| Jupiter Swap V2 gasless + Ultra UX | Order fields, fee honesty, gasless badge |
| jup-ag/plugin | Modal/sheet swap chrome |
| Solana Foundation Kora | USDC fee-token paymaster (later) |
| NetroBNB density (layout only) | Buy sheet depth · markets flow strip · AI modal |
| Phantom sponsored-tx | Only if FOLIO ever funds gas intentionally |
