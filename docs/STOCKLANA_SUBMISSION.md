# FOLIO — Stocklana submission paste pack

Re-check live counts on https://hackathons.solana.com/hackathons/stocklana before final submit.

**Deadline (re-check live):** hero **SEP 25, 2026** · timeline may still list 18 Sep — confirm on the form.  
**Demo (production):** https://folio-tawny-one.vercel.app  
**Feature branch preview:** use the latest Vercel preview for `cursor/folio-routes-tenancy-depth-f1ec` (PR #15) if markets / Pre-IPO / Tessera are not yet on `main`.

## Form fields (paste)

**Project name:** FOLIO

**One-liner:** Honest stock desk on Solana — live share truth, wash fail-closed, Jupiter quote-only, stock↔stock pairs, PreStocks + Tessera desks, credit reads without fake fills.

**Demo URL:** https://folio-tawny-one.vercel.app  
*(If desk markets/preipo 404 on prod, paste the PR #15 preview URL instead — judges need working HTTPS.)*

**Repo:** https://github.com/henrysammarfo/folio (branch `cursor/folio-routes-tenancy-depth-f1ec` / PR #15)

**Pitch (short paragraph):**
FOLIO is the honest stock desk for tokenized equities on Solana. We read live xStocks Scaled UI multipliers so share counts stay true after corporate actions; if wash tape is missing or dirty, acquire stays fail-closed. Jupiter quotes are mainnet quote-only (broadcast paused on a ≤~$1 budget). Buy organizes Mega / IPO / Meme plus true stock↔stock pairs. Live Markets board shows venue price, liquidity, and session. PreStocks and Tessera each get their own desk so Stocklana bounty tracks stay eligible. Credit surfaces Kamino LTV honestly; NestUSD stays unavailable until verified. Whitepaper + closed beta at `/whitepaper` and `/beta`. We do not claim unhackable security.

**Links judges can open:**
1. Desk: `…/desk`
2. Markets board: `…/desk/markets`
3. Buy + pairs: `…/desk/acquire`
4. PreStocks: `…/desk/preipo`
5. Tessera: `…/desk/tessera`
6. Truth (AAPLx): `…/truth?symbol=AAPLx`
7. Network honesty: `…/network`
8. Whitepaper: `…/whitepaper`
9. Closed beta: `…/beta`
10. Docs: `docs/FOLIO_WHITEPAPER.md` · `docs/DEMO_SCRIPT.md` · `docs/FOUNDER_OPERATING_PLAN.md`

**Track fit:** Investing / credit & yield / infrastructure · PreStocks bounty · Tessera bounty · Pyth if keyed.

## Henry before “production complete”

- [x] Session secret · RPC · lab keys on Vercel (see KEYS_LANDING)
- [ ] Confirm PR #15 preview or merge so `/desk/markets` · `/desk/preipo` · `/desk/tessera` resolve on the URL you paste
- [ ] Record ≤90s demo · add link on submit form
- [ ] Claim Folio X handle · set `src/lib/socials.ts` `xFolio`
- [ ] Submit form · invite teammates · edit until close
- [ ] Rotate any chat-pasted secrets after hackathon

## After submit

1. Post launch thread (LAUNCH_AND_SOCIALS.md)
2. Reach Colosseum / World’s Fair judges for feedback
3. Invite `/beta` waitlist in batches of 25
4. Log traction → Colosseum submission with Stocklana credibility
