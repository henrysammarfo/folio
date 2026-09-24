# FOLIO — Fully active keys (2026-09-19)

> Never paste secrets in chat. Put them only in Vercel + local `.env`.

## Decisions

| Item | Decision |
|---|---|
| **Pyth Pro** | **Skip** — no paid entitlement. Ship diverge = Finnhub → Yahoo (free). |
| **Bitquery paid top-up** | **Optional** — free **GeckoTerminal** wash fallback ships when Bitquery is missing/402. |
| **Finnhub** | **Landed** (`.env` + Vercel) — free equity quotes. |
| **Broadcast** | Stay `BROADCAST_PAUSED=true` until funded fill demo. |

## Status board

| Capability | How it stays live (no Pro spend) |
|---|---|
| Equity diverge | `FINNHUB_API_KEY` → else Yahoo chart |
| Wash gate | Bitquery if healthy → else **GeckoTerminal free** signer/thin-tape heuristic |
| Sessions | Privy + Supabase (already keyed) |
| Quotes / markets | Jupiter (already keyed) |
| Pyth | Ignored on ship path |

## Still do once (free)

1. ~~**Privy Allowed origin**~~ ✅ Henry added `https://folio-tawny-one.vercel.app`
2. On production Account: **Log in with Privy** (or **Bootstrap folio-demo session** on ops wall) to confirm cookie mint

## Optional later (only if you get budget)

- Bitquery Personal top-up → richer buy/sell self-trade wash  
- Pyth equity entitlement → Stocklana Pyth bounty only  

## Honesty

Free Gecko wash is a **weaker** heuristic than Bitquery (signer concentration + thin tape, not full buy/sell self-trade pairs). Empty tape still **fail-closes**. Never claim unhackable.
