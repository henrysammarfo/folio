# FOLIO — Stocklana submission paste pack

Re-check live counts on https://hackathons.solana.com/hackathons/stocklana before final submit.

**Deadline (re-check live):** hero **SEP 25, 2026** · timeline may still list 18 Sep — confirm on the form.  
**Demo (production — MERGED):** https://folio-tawny-one.vercel.app  
PR #15 merged to `main` · production deploy READY · `/desk/markets` · `/desk/preipo` · `/desk/tessera` · `/whitepaper` · `/beta` all **HTTP 200**.

## Form fields (paste)

**Project name:** FOLIO

**One-liner:** Honest stock desk on Solana — live share truth, wash fail-closed, Jupiter quote-only, stock↔stock pairs, PreStocks + Tessera desks, credit reads without fake fills.

**Demo URL:** https://folio-tawny-one.vercel.app

**Repo:** https://github.com/henrysammarfo/folio (`main`)

**Pitch (short paragraph):**
FOLIO is the honest stock desk for tokenized equities on Solana. We read live xStocks Scaled UI multipliers so share counts stay true after corporate actions; if wash tape is missing or dirty, acquire stays fail-closed. Jupiter quotes are mainnet quote-only (broadcast paused on a ≤~$1 budget). Buy organizes Mega / IPO / Meme plus true stock↔stock pairs. Live Markets board shows venue price, liquidity, and session. PreStocks and Tessera each get their own desk so Stocklana bounty tracks stay eligible. Credit surfaces Kamino LTV honestly; NestUSD stays unavailable until verified. Whitepaper + closed beta at `/whitepaper` and `/beta`. We do not claim unhackable security.

**Links judges can open:**
1. Desk: https://folio-tawny-one.vercel.app/desk
2. Markets board: https://folio-tawny-one.vercel.app/desk/markets
3. Buy + pairs: https://folio-tawny-one.vercel.app/desk/acquire
4. PreStocks: https://folio-tawny-one.vercel.app/desk/preipo
5. Tessera: https://folio-tawny-one.vercel.app/desk/tessera
6. Truth (AAPLx): https://folio-tawny-one.vercel.app/truth?symbol=AAPLx
7. Network honesty: https://folio-tawny-one.vercel.app/network
8. Whitepaper: https://folio-tawny-one.vercel.app/whitepaper
9. Closed beta: https://folio-tawny-one.vercel.app/beta
10. Docs: `docs/FOLIO_WHITEPAPER.md` · `docs/DEMO_SCRIPT.md` · `docs/FOUNDER_OPERATING_PLAN.md`

**Track fit:** Investing / credit & yield / infrastructure · PreStocks bounty · Tessera bounty · Pyth if keyed.

## Henry before submit

- [x] PR #15 merged · production routes live
- [ ] Record ≤90s demo · add link on submit form
- [ ] Claim Folio X handle · set `src/lib/socials.ts` `xFolio`
- [ ] Submit form · invite teammates · edit until close
- [ ] Rotate any chat-pasted secrets after hackathon

## After submit

1. Post launch thread (LAUNCH_AND_SOCIALS.md)
2. Reach Colosseum / World’s Fair judges for feedback
3. Invite `/beta` waitlist in batches of 25
4. Log traction → Colosseum submission with Stocklana credibility
