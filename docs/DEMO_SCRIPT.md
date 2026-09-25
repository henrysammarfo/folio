# FOLIO — Demo script (≤8 seconds spoken)

**Live product:** https://folio-tawny-one.vercel.app  
**Stocklana:** re-check hero deadline + registered/submission counts on the official page before you speak numbers.

## Pitch order (lock)

1. **Truth** — “Token balances lie after splits. FOLIO shows the live share multiplier — economic shares, not a demo 4×.”
2. **Wash** — “If the tape looks dirty or missing, we pause size. No silent green.”
3. **Buy** — “Live Jupiter quote. Search the token, flip the pair, confirm in FOLIO — your wallet signs.”
4. **Borrow** — “Keep the shares. Unlock USDC inside the desk on Kamino rails.”
5. **Agent** — “Short answers. Five messages a day. Never a silent fill.”

## Soft line (anytime)

FOLIO buys the US stocks you want on Solana — keeps share counts honest, won’t buy in shady pools, and lets you borrow cash without selling.

## Click path

1. `/` — brand hero → **Open desk**
2. `/desk` — overview: live share × · wash status · credit · quote
3. `/desk/acquire` — searchable pay/receive · flip · run checks · confirm
4. `/truth?symbol=AAPLx` — multiplier + on-chain compare
5. `/desk/credit` — deposit / borrow ticket (you sign)
6. `/desk/markets` · `/desk/preipo` · `/desk/tessera` — boards + in-FOLIO buys
7. `/network` — every capability labeled

## Do not say

- Unhackable / nation-state proof
- We filled / minted / borrowed unless the wallet actually signed and confirmed
- Fake registration counts — re-check Stocklana at submit
- NestUSD execute lives in FOLIO (metrics only for now)

## Replay

```bash
npm run replay
# = npm test && npm run test:e2e && npx tsx scripts/smoke-empire.mts && npm run build
```

Paste pack: `docs/STOCKLANA_SUBMISSION.md`
