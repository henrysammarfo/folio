# FOLIO Whitepaper

**Honest stock desk on Solana**  
Version 1.0 · 2026-09-19 · Accra  
Live desk: https://folio-tawny-one.vercel.app · Repo: https://github.com/henrysammarfo/folio

> Doctrine: ship working honesty. Never claim unhackable / nation-state-proof security. Label what is live, paused, or unavailable.

---

## 1. Abstract

Tokenized US stocks on Solana (xStocks and related pre-IPO tokens) already trade at scale — hundreds of millions in AUM and billions in cumulative volume. What is still missing is a **consumer brokerage layer that tells the truth**: honest share counts after corporate actions, refusal of dirty liquidity, borrow without forced selling, and quotes that do not pretend to be fills.

**FOLIO** is that desk. It reads mainnet truth, quotes on Jupiter, gates wash tape fail-closed, surfaces credit honestly, and keeps PreStocks and Tessera on separate bounty-eligible paths. Broadcast of swaps and borrows stays paused until funded and explicitly enabled.

---

## 2. Problem

| Layer | What breaks for users today | Consequence |
|---|---|---|
| **Share truth** | Token balances drift after dividends / Scaled UI rebases | Users misread “how many shares I own” |
| **Liquidity** | Wash / thin / linked-flow tape can look deep | Silent bad fills and ruined trust |
| **Broker UX** | Raw DEX UIs are not a stock desk | Retail never forms a holdings habit |
| **Credit** | Borrow often means sell the position | No “cash without selling” loop |
| **Pre-IPO** | Prestocks vs Tessera are different legal/economic products | Mixing them confuses users and kills bounty eligibility |
| **Agents** | Uncapped bots spray transactions | Capital and reputation loss |

Brokers that invent fills or hide refusals win the demo and lose the decade.

---

## 3. Solution — FOLIO

**One job:** Honest stock desk on Solana (truth · safe route · credit).

**Pitch order (locked):**
1. Honest share counts (Scaled UI / multiplier)
2. Won’t buy wash (fail-closed)
3. Buy on Solana (Jupiter quote → later fill)
4. Borrow without selling (credit reads → later borrow)
5. Guarded agent (paper / session-gated)

### Soft line
FOLIO buys the US stocks you want on Solana — keeps share counts honest, won’t buy in shady pools, and lets you borrow cash without selling.

### Product surface (shipped)
- **Markets** — live Jupiter venue board (price, liquidity, session, vs-ref)
- **Buy** — Mega / IPO / Meme / Pairs (true stock↔stock Jupiter routes)
- **Holdings** — positions with honest qty labels (paper vs wallet-read)
- **Borrow** — Kamino LTV / credit awareness; NestUSD fail-closed until verified
- **Pre-IPO** — PreStocks-only desk (SPV-backed economic exposure)
- **Tessera** — separate T-token desk (loan-participation structure)
- **Account** — wallet / session; ops wall at `?wall=ops`

---

## 4. Market

### Category facts (as of mid/late 2026, public reports)
- xStocks (Backed) ~**$800M AUM**; Solana majority share
- Solana ~**95%** of global on-chain equity DEX volume in recent quarters
- Q2 2026 Solana tokenized-stock DEX volume ~**$5.8B**
- Catalog of hundreds of tokenized stocks/ETFs; DeFi collateral loops growing (e.g. Kamino)

### FOLIO’s wedge inside the category
Issuers (Backed) and wallets (Solflare, Phantom, xStocker) provide **access**. FOLIO provides **desk trust**: truth + refuse + credit + brokerage habit.

**We do not need to issue the stock.** We need to be the place people **hold, rebalance, and borrow** against it.

---

## 5. Architecture (honesty matrix)

| Capability | Posture today | Rule |
|---|---|---|
| xStocks multiplier / Scaled UI | Mainnet **READ** | Fail-closed / labeled if feeds die |
| Jupiter price + swap quote | Mainnet **quote-only** | No silent stale as “live fill” |
| Wash / Bitquery | Mainnet READ, fail-closed without key | Refuse size when dirty/missing |
| Kamino / lend awareness | Mainnet READ | Labeled |
| NestUSD capacity | Unavailable until verified | Never invent Ready |
| Swap / borrow broadcast | **Paused** | Explicit unpause + spend caps |
| Custom program deploy | Out of ≤~$1 demo budget | Honesty > theater |

Network policy and threat model live in `memory/NETWORK_POLICY.md` and `memory/THREAT_MODEL.md`.

---

## 6. Business model

Trading fees alone die in a bear. FOLIO targets a **barbell**:

| Rail | Mechanism | Bull | Bear |
|---|---|---|---|
| Volume | Jupiter referral / desk take-rate on swaps & pairs | High | Low |
| Balances | Earn on idle USDC / collateral | Medium | High |
| Credit | Spread on borrow against xStocks | Medium | High |
| Subscription | FOLIO Pro (alerts, agent, deeper desk) | Steady | Steady |
| Pre-IPO | Higher take on thin private names | High | Medium |
| B2B (later) | White-label desk / API for wallets | Steady | Steady |

**Target mix (Year 2):** ≤50% trading · ≥30% balances/credit · ≥20% subscription/other.

Company value tracks **funded retention + revenue**, not vanity mcap. Token launches are out of scope for this whitepaper unless separately designed with residual risk disclosed.

---

## 7. Go-to-market & traction plan

### Near term (Stocklana → Colosseum)
1. Submit Stocklana with live demo + honesty matrix + PreStocks/Tessera desks
2. Reach Colosseum / World’s Fair judges for **feedback**, not spray pitches
3. Open **closed beta** (mainnet-read + quote; fills when funded)
4. Stand up X + socials; publish weekly honesty demos
5. Convert Stocklana credibility → Colosseum submission with real users

### Acquisition
- Wallet deep links (Phantom / Solflare / Backpack)
- Barbell assets: mega + meme + private names
- Non-US first (respect xStocks geo constraints)
- Referral rebate after first meaningful volume

### Retention
- Holdings-first home
- Weekly “true share count” (Scaled UI)
- Credit line (switching cost)
- Stock↔stock rebalance without cashing out
- Pro alerts + guarded agent

North-star: **funded wallets with ≥1 hold + ≥1 action in 30 days**.

Detailed quarterly targets: `docs/FOUNDER_OPERATING_PLAN.md`.  
Socials + beta runbook: `docs/LAUNCH_AND_SOCIALS.md`.

---

## 8. Competitive posture

| Player | Strength | FOLIO difference |
|---|---|---|
| Solflare Stocks / xStocker | Access + volume UI | Honesty gates + credit desk habit |
| Raw Jupiter / Raydium | Liquidity | Brokerage UX + refuse wash |
| Prestocks.com / Tessera app | Issuer surfaces | Unified desk, separated lanes, share truth on public names |
| Robinhood tokenized rails | Brand + distribution | Solana-native self-custody desk (geo-honest) |

Win on **working honesty** users and judges can audit in seconds — not on fake mainnet theater.

---

## 9. Roadmap (summary)

| Horizon | Outcome |
|---|---|
| **Now** | Stocklana-ready desk: truth, wash, quote, markets, pairs, PreStocks, Tessera |
| **Q4 2026** | Closed beta users, judge feedback loop, social presence, Colosseum submit with traction |
| **2027 H1** | Funded micro-fills + credit path; Pro waitlist; partner wallet links |
| **2027 H2–2028** | Multi-rail revenue (trade + credit + sub); B2B desk API exploration |
| **Years 3–5** | Default honest Solana stock desk for a region — or partner surface inside a major wallet |

Full operating plan: `docs/FOUNDER_OPERATING_PLAN.md`.

---

## 10. Risks & residual honesty

- Regulatory treatment of tokenized equities and pre-IPO exposure varies by jurisdiction; FOLIO must geo-fence and disclose.
- PreStocks ≠ equity ownership; Tessera T-tokens are loan-participation style exposure — always labeled.
- Wash feeds, Pyth, and NestUSD can fail; product stays fail-closed / unavailable rather than greenwashed.
- Security is defense-in-depth with residual risk — **never “unhackable.”**
- Broadcast remains off until capital and policy allow; demos must not imply live fills.

---

## 11. Team

**Henry Sam Marfo** — founder · Accra, Ghana · [@henrysammarfo](https://x.com/henrysammarfo)  
Building in public. Pedigree does not carry the desk — the live product must.

---

## 12. Call to action

- **Judges:** open the live desk, walk Truth → Buy → Markets → Pre-IPO → Network. Ask what still fails closed.
- **Beta users:** join `/beta`, follow socials, use quote-only until fills unlock.
- **Partners:** wallets and issuers who want an honest consumer surface — talk to Henry.

**Contact:** https://x.com/henrysammarfo · https://github.com/henrysammarfo/folio · https://folio-tawny-one.vercel.app

---

*This whitepaper is a living document. Product claims must match `memory/FACT_CHECK.md` and the live `/network` matrix.*
