# FOLIO

Honest stock desk on Solana for **xStocks** — truth (Scaled UI multiplier) · safe route (wash fail-closed) · credit without selling.

## Soft pitch

FOLIO buys the US stocks you want on Solana — keeps your share count honest, won’t buy in shady pools, and lets you borrow cash without selling.

## Network policy (Stocklana + Colosseum World’s Fair)

- **Mainnet READ** for xStocks / Jupiter price / pool & credit reads  
- **Quote-only** Jupiter swaps (labeled; no silent broadcast)  
- **Local mainnet-fork** for borrow CPI proofs when unfunded  
- **No custom mainnet program deploy** on a ≤~$1 test budget  
- See [`memory/NETWORK_POLICY.md`](memory/NETWORK_POLICY.md)

## Develop

```bash
npm install
cp .env.example .env   # fill keys; never commit .env
npm run dev
```

```bash
npm run build
npm run preview
```

## Live Block 0 spine

Server functions in `src/lib/desk.functions.ts` call fail-closed adapters:

- `src/lib/adapters/xstocks.ts` — live multiplier (`network=Solana`)
- `src/lib/adapters/pyth.ts` — Hermes (may be unavailable on some egress → labeled)
- `src/lib/adapters/jupiter.ts` — Price v3 + swap quote
- `src/lib/adapters/wash.ts` — Bitquery gate (fail-closed until keyed)

## Security honesty

We do **not** claim unhackable / nation-state-proof security. Residual risk is tracked in `memory/THREAT_MODEL.md`.

## Keys

All secrets live in gitignored `.env`. Rotate anything pasted into chat after the hackathon.
