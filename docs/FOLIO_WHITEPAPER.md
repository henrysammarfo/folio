# FOLIO Whitepaper

**Buy US stocks on Solana — with share counts you can trust.**  
Version 1.1 · 2026-09-24 · Accra  
Live desk: https://folio-tawny-one.vercel.app · Repo: https://github.com/henrysammarfo/folio

> Ship working honesty. Never claim unhackable security. Say what is live, what is paused, and what still lives on a partner’s rails.

---

## 1. Abstract

Tokenized US stocks on Solana already trade at scale. What is still missing is a **desk that tells the truth** before you buy, borrow, or automate.

**FOLIO** is that desk. We show the real share math after dividends and splits, refuse dirty routes, let you buy and rotate stocks in one place, and borrow cash without selling your position. PreStocks and Tessera each keep their own room. NestUSD risk stays visible; Nest execute stays on their app until we can do it inside FOLIO without inventing a fill.

---

## 2. Problem

| Layer | What breaks for users today | Consequence |
|---|---|---|
| **Share truth** | Wallet balances drift after dividends and splits | People misread how many shares they own |
| **Liquidity** | Dirty or thin pools can look deep | Silent bad fills and ruined trust |
| **Broker UX** | Raw swap screens are not a stock desk | Retail never forms a holdings habit |
| **Credit** | Borrow often means sell the position | No “cash without selling” loop |
| **Pre-IPO** | PreStocks and Tessera are different products | Mixing them confuses users |
| **Agents** | Uncapped bots spray transactions | Capital and reputation loss |

Brokers that invent fills or hide refusals win the demo and lose the decade.

---

## 3. Solution — FOLIO

**One job:** Honest stock desk on Solana.

**Pitch order (locked):**
1. Honest share counts
2. Won’t buy wash
3. Buy on Solana
4. Borrow without selling
5. Guarded agent

### Soft line
FOLIO buys the US stocks you want on Solana — keeps share counts honest, won’t buy in shady pools, and lets you borrow cash without selling.

### Product surface (live)
- **Buy** — USDC → stock or stock ↔ stock · searchable token pickers · flip arrow
- **Markets** — live board · Jupiter + free-tape venues when Jupiter cools
- **Borrow** — deposit & borrow USDC in-desk on Kamino rails (you sign)
- **Holdings** — positions with honest qty labels
- **Pre-IPO** — PreStocks desk · Tessera T-tokens · buys stay inside FOLIO
- **Activity** — live desk events with real icons and logos
- **Agent** — guarded chat · 5 messages / account / day
- **Truth** — live share multiplier after corporate actions
- **Network** — every capability labeled live, paused, or unavailable

---

## 4. Market

### Category facts (as of mid/late 2026, public reports)
- xStocks (Backed) near **~$800M AUM**; Solana majority share
- Solana ~**95%** of global on-chain equity DEX volume in recent quarters
- Q2 2026 Solana tokenized-stock DEX volume ~**$5.8B**
- Growing DeFi collateral loops (e.g. Kamino)

### FOLIO’s wedge
Issuers and wallets provide **access**. FOLIO provides **desk trust**: truth + refuse + buy + borrow + brokerage habit.

**We do not need to issue the stock.** We need to be the place people **hold, rebalance, and borrow** against it.

---

## 5. How we stay honest

| Capability | Posture today | Rule |
|---|---|---|
| Share multiplier (xStocks) | Mainnet **read** | Labeled if feeds die |
| Jupiter price + swap | Mainnet quotes · user-signed fills when armed | Never invent a fill |
| Wash gate | Mainnet read · pauses size when dirty/missing | Refuse, don’t greenwash |
| Kamino borrow | In-desk deposit/borrow · user signs | No fake borrow theater |
| NestUSD | Live risk metrics | Execute still Nest’s app |
| Custom program deploy | Out of tight demo budget | Honesty beats theater |

Network policy and residual risk: `memory/NETWORK_POLICY.md` · `memory/THREAT_MODEL.md`.

---

## 6. Business model

Trading fees alone die in a bear. FOLIO targets a **barbell**:

| Rail | Mechanism | Bull | Bear |
|---|---|---|---|
| Volume | Desk take-rate on buys & pairs | High | Low |
| Balances | Earn on idle USDC / collateral | Medium | High |
| Credit | Spread on borrow against xStocks | Medium | High |
| Subscription | FOLIO Pro (alerts, agent, deeper desk) | Steady | Steady |
| Pre-IPO | Higher take on thin private names | High | Medium |
| B2B (later) | White-label desk / API for wallets | Steady | Steady |

**Target mix (Year 2):** ≤50% trading · ≥30% balances/credit · ≥20% subscription/other.

Company value tracks **funded retention + revenue**, not vanity mcap.

---

## 7. Go-to-market

### Near term (Stocklana → Colosseum)
1. Submit Stocklana with a working live desk
2. Reach judges for **feedback**, not spray pitches
3. Grow closed beta (`/beta`)
4. Publish weekly honesty demos
5. Convert credibility → Colosseum / World’s Fair

### Acquisition
- Wallet deep links
- Barbell assets: mega + meme + private names
- Non-US first (respect xStocks geo constraints)
- Referral rebate after first meaningful volume

### Retention
- Holdings-first home
- Weekly true share count
- Credit line (switching cost)
- Stock↔stock rotate without cashing out
- Pro alerts + guarded agent

North-star: **funded wallets with ≥1 hold + ≥1 action in 30 days**.

Operating plan: `docs/FOUNDER_OPERATING_PLAN.md`.  
Socials + beta: `docs/LAUNCH_AND_SOCIALS.md`.

---

## 8. Competitive posture

| Player | Strength | FOLIO difference |
|---|---|---|
| Solflare Stocks / xStocker | Access + volume UI | Honesty gates + credit desk habit |
| Raw Jupiter / Raydium | Liquidity | Brokerage UX + refuse wash |
| Prestocks.com / Tessera app | Issuer surfaces | Unified desk, separated rooms, share truth on public names |
| Robinhood tokenized rails | Brand + distribution | Solana-native self-custody desk (geo-honest) |

Win on **working honesty** anyone can audit in seconds — not on fake mainnet theater.

---

## 9. Roadmap

| Horizon | Outcome |
|---|---|
| **Now** | Live desk: truth, wash, buy, borrow, markets, pairs, PreStocks, Tessera |
| **Q4 2026** | Closed beta, judge feedback, social presence, Colosseum submit |
| **2027 H1** | Deeper credit path · Pro waitlist · partner wallet links |
| **2027 H2–2028** | Multi-rail revenue · B2B desk API exploration |
| **Years 3–5** | Default honest Solana stock desk for a region — or inside a major wallet |

---

## 10. Risks we name out loud

- Regulatory treatment varies by jurisdiction — FOLIO must geo-fence and disclose.
- PreStocks ≠ equity ownership; Tessera T-tokens are loan-participation style — always labeled.
- Wash feeds and NestUSD can fail; we pause or label rather than paint green.
- Security is defense-in-depth with residual risk — **never “unhackable.”**
- Fills require a signed wallet step; demos must not imply silent fills.

---

## 11. Team

**Henry Sam Marfo** — founder · Accra, Ghana · [@henrysammarfo](https://x.com/henrysammarfo)  
Building in public. Pedigree does not carry the desk — the live product must.

---

## 12. Call to action

- **Judges:** open the live desk. Walk Truth → Buy → Markets → Borrow → Pre-IPO → Network.
- **Beta users:** join `/beta`, follow socials, try the desk.
- **Partners:** wallets and issuers who want an honest consumer surface — talk to Henry.

**Contact:** https://x.com/henrysammarfo · https://github.com/henrysammarfo/folio · https://folio-tawny-one.vercel.app

---

*Living document. Product claims must match `memory/FACT_CHECK.md` and the live `/network` page.*
