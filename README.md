# FOLIO

**Buy US stocks on Solana — with share counts you can trust.**

FOLIO is an honest stock desk for tokenized equities (xStocks). We show the real share math after dividends and splits, refuse dirty routes, let you buy and rotate stocks in one place, and borrow cash without selling your position.

## Soft pitch

FOLIO buys the US stocks you want on Solana — keeps share counts honest, won’t buy in shady pools, and lets you borrow cash without selling.

## Live product

| Surface | What you get |
|---|---|
| **Buy** | USDC → stock or stock ↔ stock · searchable token pickers · flip arrow |
| **Markets** | Live board · Jupiter + free-tape venues when Jupiter cools |
| **Borrow** | Deposit & borrow USDC in-desk on Kamino rails (you sign) |
| **Pre-IPO** | PreStocks desk · Tessera T-tokens · buys stay inside FOLIO |
| **Activity** | Live desk events with real icons and logos |
| **Agent** | Guarded chat · **5 messages / account / day** |

**Production:** https://folio-tawny-one.vercel.app

## How we stay honest

- **Mainnet reads** for share counts, prices, pools, and credit metrics  
- **User-signed fills** when armed — FOLIO never invents a fill or a mint  
- **Wash gate** pauses size when the tape looks dirty or missing  
- **NestUSD** shows live LTV metrics; Nest execute is still their app  
- We **never** claim unhackable / nation-state-proof security — see `memory/THREAT_MODEL.md`

## Develop

```bash
npm install
cp .env.example .env   # secrets stay local — never commit .env
npm run dev
```

```bash
npm run build && npm run preview
npm run replay         # tests + e2e + empire smoke + build
```

## Pitch order (demo)

1. **Truth** — live share multiplier after corporate actions  
2. **Wash** — we refuse size when the route isn’t clean  
3. **Buy** — live Jupiter quote · confirm in FOLIO  
4. **Borrow** — keep the shares · get USDC  
5. **Agent** — short, metered answers — never silent fills  

## Docs

| Doc | Purpose |
|---|---|
| [`docs/FOLIO_BIBLE.md`](docs/FOLIO_BIBLE.md) | Product doctrine |
| [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) | ≤8s spoken demo |
| [`docs/STOCKLANA_SUBMIT.md`](docs/STOCKLANA_SUBMIT.md) | Submit checklist |
| [`docs/FOLIO_WHITEPAPER.md`](docs/FOLIO_WHITEPAPER.md) | Long-form whitepaper |
| [`memory/CURRENT_STATE.md`](memory/CURRENT_STATE.md) | Live product state |

## Submit posture

- Stocklana first · Colosseum World’s Fair next  
- Same honesty on both: working live spine beats fake mainnet theater  
- Soft pitch only in user-facing copy  

Built in Accra · shipped for the world.
