# FOLIO demo script (spoken)

**Live product:** https://folio-tawny-one.vercel.app  
**Stocklana:** re check hero deadline and registered or submission counts on the official page before you speak numbers.  
**Full video shot lists:** [`VIDEO_SCRIPTS.md`](VIDEO_SCRIPTS.md)

## Pitch order (lock)

1. **Truth** — Token balances lie after splits. FOLIO shows the live share multiplier. Economic shares, not a frozen demo number.
2. **Wash** — If the tape looks dirty or missing, we pause size. No silent green.
3. **Buy** — Live Jupiter quote. Search the token. Flip the pair. Confirm in FOLIO. Your wallet signs.
4. **Borrow** — Keep the shares. Unlock USDC inside the desk on Kamino rails.
5. **Agent** — Short answers. Five messages a day. Never a silent fill.

## Soft line (anytime)

FOLIO buys the US stocks you want on Solana. It keeps share counts honest, will not buy in shady pools, and lets you borrow cash without selling.

## Click path

1. `/` — brand hero → Open desk
2. `/desk` — overview: live share × · wash status · credit · quote
3. `/desk/acquire` — searchable pay and receive · flip · run checks · confirm
4. `/truth?symbol=AAPLx` — multiplier and on chain compare
5. `/desk/credit` — deposit and borrow ticket (you sign)
6. `/desk/markets` · `/desk/preipo` · `/desk/tessera` — boards and in FOLIO buys
7. `/network` — every capability labeled

## Do not say

- Unhackable or nation state proof
- We filled or minted or borrowed unless the wallet actually signed and confirmed
- Fake registration counts. Re check Stocklana at submit
- NestUSD execute lives in FOLIO (metrics only for now)

## Replay

```bash
npm run replay
# = npm test && npm run test:e2e && npx tsx scripts/smoke-empire.mts && npm run build
```

Paste pack: [`STOCKLANA_SUBMISSION.md`](STOCKLANA_SUBMISSION.md)
