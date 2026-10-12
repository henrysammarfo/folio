# FOLIO video scripts

Two form videos for Stocklana Links: **Pitch Video** and **Technical Video**. Keep tone human and calm. Soft pitch only. Never say unhackable. Never claim a fill or borrow unless the wallet really signed on screen.

**Production URL (show in first three seconds):** https://folio-tawny-one.vercel.app  
**Pitch deck (follow along):** https://folio-tawny-one.vercel.app/pitch  
**Repo:** https://github.com/henrysammarfo/folio

Record 1080p. Captions on. Dismiss cookie banner before line one. Hide full wallets and emails.

---

## Pitch Video (about 2 minutes 15 seconds)

**Form field:** Pitch Video URL  
**Goal:** Wow · impress · intrigue. Judges should feel FOLIO is inevitable for ten years, not a weekend toy.  
**On screen companion:** `/pitch` slides advance with your voice, or cut to live desk when the script says **CUT**.

### Shot list

| Time | Screen | Action |
| :--- | :--- | :--- |
| 0:00–0:08 | Landing or `/pitch` title | FOLIO mark + soft pitch line. URL on screen. |
| 0:08–0:28 | `/pitch` problem → insight | Speak the pain. Slow. |
| 0:28–0:48 | **CUT** `/desk` home | Point at live ×, wash Clear, trading days. |
| 0:48–1:10 | **CUT** `/desk/acquire` | Search AAPLx. Show quote. Flip once. Pause label if fills paused. |
| 1:10–1:25 | **CUT** `/desk/credit` | Kamino LTV. NestUSD metrics labeled. |
| 1:25–1:45 | **CUT** `/desk/preipo` then `/desk/tessera` | Catalog kept. Separate rooms. One beat each. |
| 1:45–2:05 | `/pitch` vision + tracks | Ten year line. Three tracks named. |
| 2:05–2:15 | End card | URL + soft pitch. Silence one beat. |

### Spoken script (read like a founder, not a bot)

Hi. I’m Henry. This is FOLIO.

We buy the US stocks you want on Solana.

That sounds simple until you live with the pain. After a dividend or a split, a raw token balance is not the share story. Dirty pools can look deep until you try to size. And most borrow tools ask you to sell the thing you wanted to keep.

FOLIO is the desk that fixes that stretch of the journey in one place.

**CUT to desk home.**

Here is the live share multiplier. Economic shares are quantity times that multiplier. If the tape looks thin or missing, we pause size. No silent green. Weekend buys stay blocked. The curve cannot see the NYSE bell, so we refuse instead of pretending.

**CUT to Buy.**

Buy stays inside FOLIO. Search the name. Pay with USDC or USDT. Flip if you want stock to stock. The quote is live from Jupiter. When fills are armed, your wallet signs. When fills are paused, you still see an honest quote and a clear pause. We never invent a fill.

**CUT to Borrow.**

You wanted the stock. You may still need cash. Keep the shares. Unlock USDC on live Kamino LTV inside the desk. NestUSD risk metrics stay visible. Nest execute stays on Nest until we can do it inside FOLIO without theater.

**CUT to PreStocks, then Tessera.**

Private names get their own rooms. PreStocks for SPV backed private companies. Tessera for loan participation T tokens like OpenAI, SpaceX, and Kalshi. Catalogs stay. Buys stay in FOLIO. We never mix issuers. Judges should see three clean tracks, not one soup.

We are building for ten years. Share truth as a habit. Routes that refuse junk. Credit without forced selling. Partner rooms that stay honest when new private products appear. Accra is where we build. The beachhead is people outside the US who want US equity exposure without a brokerage that lies about the share count.

We will not claim the desk is unhackable. We label what is live, what is paused, and what still lives on a partner’s rails. That honesty is the brand.

FOLIO. folio-tawny-one.vercel.app. Soft pitch one more time. We buy the US stocks you want on Solana. We keep share counts honest. We will not buy in shady pools. We let you borrow cash without selling.

Thanks for watching. Demo and deck links are in the description.

### End card text

```
FOLIO
Honest stock desk on Solana
folio-tawny-one.vercel.app
```

### YouTube / Loom description (Pitch)

```
FOLIO pitch. Honest stock desk for tokenized US equities on Solana.

Live share multipliers. Wash refuse. Jupiter buys in desk. Kamino borrow without selling. PreStocks and Tessera on separate desks.

Demo: https://folio-tawny-one.vercel.app
Pitch deck: https://folio-tawny-one.vercel.app/pitch
Repo: https://github.com/henrysammarfo/folio
```

---

## Technical Video (about 3 minutes 30 seconds)

**Form field:** Technical Video URL  
**Goal:** Prove how partner tracks were integrated, what broke, what we refused to fake, and why the architecture survives.  
**On screen:** Prefer live desk + `/network` + repo README Mermaid. Optional brief `/pitch` architecture slide.

### Shot list

| Time | Screen | Action |
| :--- | :--- | :--- |
| 0:00–0:15 | Title card → `/network` | Honesty matrix. Say fail closed. |
| 0:15–0:45 | `/truth?symbol=AAPLx` + home × | Multiplier + Scaled UI compare. Label gaps. |
| 0:45–1:15 | Buy ticket + Markets venues | Jupiter quote. Multi venue pills. 429 cooling labeled. |
| 1:15–1:45 | `/desk/preipo` | Catalog API → TokenSelect flip → wash → quote. No Tessera mix. |
| 1:45–2:15 | `/desk/tessera` | Tessera API → catalog → flip USDC/USDT ↔ T token. Separate desk. |
| 2:15–2:45 | Credit + session week | Kamino LTV. NestUSD metrics only. Weekend refuse. |
| 2:45–3:15 | Flaws beat | Jupiter 429s. DBC SDK SSR trap. Solami Blur GB. Nest execute. |
| 3:15–3:30 | End | Three tracks named. Repo link. Soft close. |

### Spoken script (technical, still human)

This is the technical walkthrough of FOLIO. Same soft pitch, tighter spine.

We ship fail closed adapters. No mocks. No silent fallbacks. No fake fills. If a dependency is missing, the UI says so.

**Track one. Investing and credit on public xStocks.**

Share truth comes from the live xStocks multiplier. We compare API currentMultiplier to on chain Token 2022 Scaled UI when the ledger answers. Economic shares are qty times multiplier. Paper estimates stay labeled until a wallet is bound. Full ATA wallet scan maps mints when you are signed in. We do not invent a match.

Wash gate scores free tape and concentration heuristics. Thin or missing tape pauses size. Results share process cache so concurrent desks do not thrash upstream RPM.

Buy uses Jupiter Swap V2 quotes. USDC or USDT to stock, or stock to stock. Searchable TokenSelect. Flip. Prepare, Privy sign, execute when `BROADCAST_PAUSED` is false. Markets board is multi venue. Jupiter marks, free tape, Raydium as liquidity awareness, Solami RPC tape when keyed. Marks are never invented. Search expands the Solana xStocks universe with batched Jupiter Price v3 and honest cooling labels when we hit 429s.

Borrow is Kamino xStocks LTV inside the desk. You sign deposit and borrow. NestUSD is metrics only in FOLIO today. We do not fake Nest CPI.

Cash session is FOLIO owned. The Meteora curve does not know NYSE hours, so weekend size is refused in our session gate and shown on the home week strip.

**Track two. PreStocks.**

Live PreStocks catalog. Logos from the API. Catalog list stays on the left. Ticket on the right mirrors Buy. TokenSelect plus flip for USDC or USDT versus the PreStock mint. Wash still gates size. Buys confirm inside FOLIO. This desk never mixes Tessera mints. That separation is deliberate for bounty rules and for user clarity.

**Track three. Tessera.**

Live Tessera token details API. T OpenAI, T SpaceX, T Kalshi and friends. Same hybrid UX. Catalog kept. Flip USDC or USDT versus the T token. No PreStocks cross issuer path. Loan participation is labeled. We do not pretend Tessera is Scaled UI public equity.

**Flaws we found and how we lived with them.**

Jupiter Price v3 rate limits under parallel catalog fetch. We stagger probes, cache with TTL, and leave empty cells labeled instead of inventing prices.

Raydium often has TVL without a mid. We show it as liquidity awareness, not a fake mark.

Meteora DBC official SDK plus Anchor broke Vercel SSR with a five hundred on the whole desk when statically imported. Production path is config plus RPC account reads. SDK stays behind a flag for tests. Mainnet pool create needs a funded wallet. Comfortable path is about five to eight hundredths of a SOL. We do not invent a pool address.

Solami Blur wants prepaid bandwidth. We use Solami RPC tape for the live Bible path and label Blur optional. We did not buy a demo tax just to paint a green Blur chip.

Pyth Hermes free trial is not the ship path. Diverge uses free equity refs. Pyth stays keyed when available, never faked.

Nest execute stays Nest. Partner Pre IPO and Tessera started as text only. We restored catalogs and logos after a bad rewrite. That lesson is in the README. UI honesty beats clever tickets that delete the catalog.

**Close.**

Three tracks. Public investing and credit. PreStocks. Tessera. One doctrine. Fail closed. Soft pitch. Residual risk documented. Demo folio-tawny-one.vercel.app. Repo henrysammarfo slash folio. Thanks for watching.

### End card text

```
FOLIO · Technical
Truth · Wash · Buy · Borrow
PreStocks · Tessera · fail closed
folio-tawny-one.vercel.app
```

### YouTube / Loom description (Technical)

```
FOLIO technical video. How we integrated Stocklana partner tracks and what we refused to fake.

Track 1 — Investing and credit: xStocks truth, wash gate, Jupiter buy, Kamino borrow, weekend refuse.
Track 2 — PreStocks: live catalog, TokenSelect flip, buys in FOLIO, no Tessera mix.
Track 3 — Tessera: live T-tokens, separate desk, USDC/USDT flip, labeled loan participation.

Flaws covered: Jupiter 429s, Raydium mid gaps, Meteora DBC SSR trap, Solami Blur GB, Nest execute boundary.

Demo: https://folio-tawny-one.vercel.app
Network matrix: https://folio-tawny-one.vercel.app/network
Repo: https://github.com/henrysammarfo/folio
```

---

## Optional shorter clips (social or B roll)

Keep the earlier surface clips in git history if you need B roll. For the Stocklana form, record **only** Pitch Video and Technical Video above.

---

## Recording checklist

1. Production URL unless you intentionally show a preview.
2. Cookie banner gone before line one.
3. Hide personal emails and full wallet strings.
4. If Jupiter cools, keep rolling and point at the labeled pause. That is the product.
5. Advance `/pitch` with arrow keys while talking, or cut to live desk on **CUT** lines.
6. Export 1080p. Upload unlisted. Paste both URLs on the Stocklana Links form.
7. Re check Stocklana registered and submission counts on the official page before saying any number out loud.
