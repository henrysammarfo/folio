<p align="center">
  <a href="https://folio-tawny-one.vercel.app">
    <img src="./public/folio-readme-banner.png" alt="FOLIO · Honest stock desk on Solana" width="920" />
  </a>
</p>

<p align="center">
  <img src="./public/folio-mark.svg" alt="FOLIO mark" width="56" height="56" />
</p>

<p align="center">
  <a href="https://folio-tawny-one.vercel.app"><img src="https://img.shields.io/badge/Live_Desk-folio--tawny--one.vercel.app-0EA5C9?style=for-the-badge" alt="Live desk" /></a>
  <a href="https://hackathons.solana.com/hackathons/stocklana"><img src="https://img.shields.io/badge/Track-Stocklana-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Stocklana" /></a>
  <a href="https://github.com/henrysammarfo/folio"><img src="https://img.shields.io/badge/Repo-henrysammarfo%2Ffolio-111111?style=for-the-badge&logo=github" alt="GitHub" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solana-Mainnet_read-14F195?style=flat-square&logo=solana&logoColor=black" alt="Solana" />
  <img src="https://img.shields.io/badge/xStocks-Backed-0EA5C9?style=flat-square" alt="xStocks" />
  <img src="https://img.shields.io/badge/Quotes-Jupiter-24A1DE?style=flat-square" alt="Jupiter" />
  <img src="https://img.shields.io/badge/Borrow-Kamino-7C3AED?style=flat-square" alt="Kamino" />
  <img src="https://img.shields.io/badge/Auth-Privy-111111?style=flat-square" alt="Privy" />
  <img src="https://img.shields.io/badge/Stack-TanStack_Start-FF4154?style=flat-square" alt="TanStack" />
</p>

---

## Project description and overview

**FOLIO** is an honest stock desk for tokenized US equities on Solana.

Token balances on chain can lie after dividends and splits. Dirty pools can look green until you size into them. Borrow tools often ask you to sell the thing you wanted to keep. FOLIO is built to fix that stretch of the journey in one place.

You open the desk. You see the live share multiplier. You see whether the tape is clean enough to size. You buy with a live Jupiter quote and your own wallet signature. You can borrow USDC on Kamino rails without selling the shares. PreStocks and Tessera each keep their own room so private names never get mixed into public equity theater.

> Soft pitch we use everywhere: FOLIO buys the US stocks you want on Solana. It keeps share counts honest, will not buy in shady pools, and lets you borrow cash without selling.

We never invent fills. We never invent mints. We never claim the desk is unhackable. Missing feeds fail closed and stay labeled.

**Live product:** https://folio-tawny-one.vercel.app  
**Pitch deck:** https://folio-tawny-one.vercel.app/pitch  
**Video scripts:** [`docs/VIDEO_SCRIPTS.md`](docs/VIDEO_SCRIPTS.md) · Pitch Video + Technical Video

---

## Stocklana · three bounty tracks we compete in

FOLIO is built so judges can score these three sponsored tracks without one soup.

| Track | Prize | What is live on FOLIO | Where to click |
| :--- | :--- | :--- | :--- |
| **Best Use of Meteora DBC** | $5,000 | Stock curve doctrine · DBC program mainnet-read · weekend cash session refuse (curve cannot see the bell) · network matrix labels · pool create cost honesty · no invented pool address | `/desk` week strip · `/network` · Bible DBC notes |
| **Best Use of Tessera, Pre-IPO stocks** | $6,000 | Live Tessera catalog · T tokens · catalog list kept · TokenSelect + USDC/USDT flip · wash gated size · buys in FOLIO · never mixed with PreStocks | `/desk/tessera` |
| **Best Use of PreStocks** | $10,000 | Live PreStocks catalog · logos · catalog list kept · TokenSelect + USDC/USDT flip · wash gated size · buys in FOLIO · never mixed with Tessera | `/desk/preipo` |

Doctrine on every track: fail closed adapters, no mocks, no silent greens, no fake fills, no cross issuer mixing.

```mermaid
flowchart TB
  subgraph T1["Best Use of Meteora DBC · $5k"]
    DBC[DBC stock curve config]
    Sess[Weekend cash session refuse]
    Net[Network matrix labels]
  end
  subgraph T2["Best Use of Tessera Pre-IPO · $6k"]
    TCat[Tessera catalog]
    TBuy[USDC/USDT flip ticket]
  end
  subgraph T3["Best Use of PreStocks · $10k"]
    PCat[PreStocks catalog]
    PBuy[USDC/USDT flip ticket]
  end
  Desk[FOLIO desk] --> T1
  Desk --> T2
  Desk --> T3
  PBuy -.->|never mix issuers| TBuy
```

### How these three tracks were integrated

1. **Meteora DBC.** Bible primary stock curve. Production path is config + RPC `getAccountInfo` for program executable. Official SDK stays behind a flag because static import with Anchor broke Vercel SSR (whole desk 500). Curve does not know NYSE hours, so FOLIO `session-gate` refuses weekend size and the home week strip shows it. Mainnet pool create needs a funded wallet (comfortable ~0.05–0.08 SOL). We never invent a `FOLIO_DBC_POOL` address. Graduation 750 USDC is migration cap, not create SOL.
2. **Tessera (Pre-IPO stocks bounty).** Adapter `fetchTesseraCatalog` · server bundle quotes stable ↔ T mint · UI keeps **catalog list + Buy style ticket** · TokenSelect with partner options only · side buy/sell · no PreStocks mints on this path · loan participation labeled.
3. **PreStocks.** Adapter `fetchPreStocksCatalog` · same hybrid UX · PreStock symbols only · logos from API · wash still gates size · buys confirm inside FOLIO · docs and code keep PreStocks ≠ Tessera on purpose for bounty clarity.
4. **Overview lanes.** Partner lane tabs on home link into Tessera and PreStocks desks. Logos and skeletons. Never bare Loading.
5. **Honesty under load.** Jupiter 429s and thin wash feed pause size with labels. We do not invent clear wash, invent marks, or invent a DBC pool.

---

## Flaws we found · and how we lived with them

Full ledger: [`memory/FLAWS_AND_WORKAROUNDS.md`](memory/FLAWS_AND_WORKAROUNDS.md). Technical video walks these live.

| Flaw | What broke | What we did |
| :--- | :--- | :--- |
| Jupiter Price v3 429s under parallel catalog fetch | Empty board risk | Stagger probes · TTL cache · leave cells labeled · never invent marks |
| Raydium TVL without mid | Fake price temptation | Show as liquidity awareness only |
| Meteora DBC SDK + Anchor in SSR | Whole desk HTTP 500 | Production path config + RPC reads · SDK behind flag for tests |
| Mainnet DBC pool create cost | Cannot sponsor on ≤~$1 budget | Document comfortable 0.05–0.08 SOL · never invent pool address |
| Solami Blur prepaid GB | Demo tax pressure | Solami RPC tape for live path · Blur optional labeled |
| NestUSD execute | Partner boundary | Metrics only in FOLIO · never fake Nest CPI |
| Partner catalog rewrite | Tickets without lists | Restored catalog + flip hybrid · PreStocks and Tessera separate |
| Pyth Hermes free trial | Paywall | Off ship path · free equity refs for diverge |

We document residual risk in [`memory/THREAT_MODEL.md`](memory/THREAT_MODEL.md). We will not say unhackable.

---

## Technology stack and partners

| Layer | Tools | Role on FOLIO |
| :--- | :--- | :--- |
| Desk UI | TanStack Start, React, Vite, TypeScript | Consumer desk shell, Netro style density home, Buy Markets Borrow |
| Auth and tenancy | Privy, Supabase, httpOnly sessions | Wallet and email sign in without stuffing secrets into localStorage |
| Spot markets | Jupiter Price and Swap, free tape, Raydium awareness, Solami when keyed | Live marks and quotes. Fail closed when cool |
| Share truth | xStocks API, Pyth when keyed, on chain Scaled UI compare | Live multiplier and API versus ledger check |
| Credit | Kamino xStocks LTV, NestUSD metrics | Borrow in desk when armed. Nest execute stays on Nest |
| Partners | PreStocks API, Tessera API | Separate desks. Buys stay inside FOLIO |
| Honesty | Wash gate, rate limits, TTL caches, network matrix | Shared boards for concurrent desks without invented greens |

```mermaid
flowchart LR
  subgraph Client
    Desk[Desk UI]
    Privy[Privy wallet]
  end
  subgraph FOLIO["FOLIO server"]
    Spine[Truth · Wash · Quote]
    Buy[Buy prepare]
    Credit[Credit ticket]
    Partners[PreStocks · Tessera]
  end
  subgraph Solana
    Jup[Jupiter]
    XS[xStocks / Scaled UI]
    Kam[Kamino]
  end
  Desk --> Spine
  Desk --> Buy
  Desk --> Credit
  Desk --> Partners
  Privy --> Buy
  Privy --> Credit
  Spine --> XS
  Spine --> Jup
  Buy --> Jup
  Credit --> Kam
  Partners --> Jup
```

---

## How the desk flows

Pitch order we demo out loud: Truth, then Wash, then Buy, then Borrow, then Agent.

```mermaid
flowchart TD
  L[Landing] --> O[Open desk]
  O --> H[Home density]
  H --> T[Truth × live multiplier]
  H --> W[Wash gate]
  H --> B[Buy ticket]
  T --> G{Tape clean?}
  W --> G
  G -->|No| P[Size paused · labeled]
  G -->|Yes| Q[Jupiter quote]
  Q --> S[User signs fill]
  H --> M[Markets board]
  M --> Pre[PreStocks desk]
  M --> Tes[Tessera desk]
  H --> C[Borrow on Kamino]
  C --> N[NestUSD metrics]
  H --> A[Guarded agent · 5 / day]
```

```mermaid
sequenceDiagram
  participant U as User
  participant D as FOLIO desk
  participant X as xStocks / ledger
  participant W as Wash feeds
  participant J as Jupiter
  U->>D: Open Buy · pick stock
  D->>X: Live share multiplier
  D->>W: Wash check
  alt Tape dirty or missing
    D-->>U: Size paused · why labeled
  else Tape clear
    D->>J: Quote USDC → stock
    J-->>D: Live quote
    D-->>U: Review buy
    U->>D: Confirm · wallet signs
    D->>J: Execute signed order
  end
```

---

## Core capabilities

### 1. Share counts you can trust

Corporate actions change what a token balance means. FOLIO reads the live share multiplier from xStocks and compares it to on chain Scaled UI when the ledger answers. Economic shares are qty times multiplier. Paper estimates stay labeled until a wallet is bound.

### 2. Wash refuse before size

If the tape looks thin, missing, or dirty, the desk pauses size. The UI says why. There is no silent green. Wash results share process cache so many concurrent users do not thrash upstream RPM.

### 3. Buy and rotate in one desk

USDC to stock or stock to stock. Searchable token pickers. Flip the legs. Live Jupiter quote. Confirm inside FOLIO. Your wallet signs when fills are armed. Broadcast stays paused until policy turns it on.

### 4. Markets without invented marks

Curated Mega IPO and Meme lanes on the board. Search expands into the full Solana xStocks universe with Jupiter batch marks. Venue and stock ref labels stay honest. Partner private names live on PreStocks and Tessera, not jammed into the public board tabs.

### 5. Borrow without selling

Keep the shares. Unlock USDC on live Kamino LTV inside the desk. Deposit and borrow are user signed. NestUSD shows live risk metrics. Nest execute is still Nest’s app.

### 6. Partner rooms kept separate

PreStocks private SPV names and Tessera T tokens each get their own catalog and ticket. Cross issuer mixing is refused on purpose so bounty lanes stay clean.

```mermaid
flowchart LR
  subgraph Public["Public equity"]
    Mega[Mega]
    IPO[IPO]
    Meme[Meme]
  end
  subgraph Private["Private rooms"]
    PS[PreStocks catalog]
    TT[Tessera T-tokens]
  end
  Buy[Buy ticket] --> Mega
  Buy --> IPO
  Buy --> Meme
  PS --> BuyPS[PreStocks Buy · USDC/USDT flip]
  TT --> BuyTT[Tessera Buy · USDC/USDT flip]
  BuyPS -.->|no cross issuer| BuyTT
```

### 7. Guarded agent

Short answers about truth, wash, quotes, and credit. Five messages per account per day. The agent never pretends a fill happened.

---

## Honest limits

- Mainnet read and quote first. Custom program mainnet deploy is out of a tiny wallet budget.
- Fills and Kamino sign paths stay paused until `BROADCAST_PAUSED` is false and keys are live.
- NestUSD is metrics only in FOLIO today.
- Multi tenant wallet qty needs Privy plus Supabase session keys. Inspect and watch wallet still do mainnet reads.
- Jupiter and upstream feeds can rate limit. Stale cache is labeled. Gaps fail closed.
- We document residual risk in `memory/THREAT_MODEL.md`. We will not say unhackable.

---

## Repository map

```
folio/
├── src/
│   ├── routes/                 # Marketing pages and /desk surfaces
│   ├── components/             # Desk shell, Buy ticket, Netro density, logos
│   ├── lib/
│   │   ├── adapters/           # Jupiter, xStocks, wash, Kamino, wallets
│   │   ├── auth/               # Privy session, tenants, rate limits
│   │   └── desk.*.ts           # Server functions for each desk surface
│   └── styles.css              # FOLIO tokens plus Netro density chrome
├── docs/                       # Bible, demo scripts, submit pack, video scripts
├── memory/                     # Current state, session log, fact check, threats
├── public/                     # OG banner, FOLIO mark, Netro gear assets
└── scripts/                    # Smoke, keys, replay helpers
```

---

## Getting started

### Prerequisites

- Node.js 20 or later
- Git
- A local `.env` copied from `.env.example` (never commit secrets)

### Install and run

```bash
git clone https://github.com/henrysammarfo/folio.git
cd folio
npm install
cp .env.example .env
npm run dev
```

Open the local URL Vite prints. Production desk is already live at https://folio-tawny-one.vercel.app

### Useful scripts

```bash
npm run build && npm run preview
npm test
npm run test:e2e
npm run replay          # unit + e2e + empire smoke + build
npm run smoke:keys      # labeled key readiness
```

---

## Demo videos

Stocklana Links form wants two URLs. Scripts are human and shot listed in [`docs/VIDEO_SCRIPTS.md`](docs/VIDEO_SCRIPTS.md).

| Form field | Length | Script |
| :--- | :--- | :--- |
| **Pitch Video** | about 2 min 15 sec | Wow · impress · intrigue · ten year vision · three bounty tracks · soft pitch |
| **Technical Video** | about 3 min 30 sec | Meteora DBC · Tessera · PreStocks integration · flaws · fail closed spine |

Pitch deck to follow while recording: https://folio-tawny-one.vercel.app/pitch

Record with Loom or YouTube. Paste both links on the Stocklana form. Keep voice soft. Never say you filled unless the wallet actually signed.

---

## Docs judges and builders use

| Doc | Purpose |
| :--- | :--- |
| [`docs/FOLIO_BIBLE.md`](docs/FOLIO_BIBLE.md) | Product doctrine |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | Short spoken pitch |
| [`docs/VIDEO_SCRIPTS.md`](docs/VIDEO_SCRIPTS.md) | Pitch + Technical video scripts |
| [`docs/STOCKLANA_SUBMISSION.md`](docs/STOCKLANA_SUBMISSION.md) | Form paste pack |
| [`docs/FOLIO_WHITEPAPER.md`](docs/FOLIO_WHITEPAPER.md) | Long form writeup |
| [`memory/CURRENT_STATE.md`](memory/CURRENT_STATE.md) | Live product state |
| [`memory/FLAWS_AND_WORKAROUNDS.md`](memory/FLAWS_AND_WORKAROUNDS.md) | Flaws ledger |
| [`memory/THREAT_MODEL.md`](memory/THREAT_MODEL.md) | Residual risk |
| Live pitch deck | https://folio-tawny-one.vercel.app/pitch |

---

## Submit posture

Stocklana first. Colosseum World’s Fair next. Same honesty on both. A working live spine beats fake mainnet theater. Soft pitch only in user facing copy. Accra is the build base. Beachhead ICP is EU and APAC non US.

Built in Accra. Shipped for the world.
