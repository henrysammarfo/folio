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

Private names get their own rooms for two separate bounties. Tessera for loan participation T tokens like OpenAI, SpaceX, and Kalshi. PreStocks for SPV backed private companies. Catalogs stay. Buys stay in FOLIO. We never mix issuers. Judges should see clean Tessera and PreStocks desks, not one soup.

And for Meteora DBC, the stock curve does not know NYSE hours. FOLIO refuses weekend size and labels it on the home week strip and the network matrix. We read the DBC program honestly. We do not invent a mainnet pool address when the wallet cannot fund create.

We are building for ten years. Share truth as a habit. Routes that refuse junk. Credit without forced selling. Partner rooms that stay honest when new private products appear.

On Stocklana we compete in three bounty tracks. Best Use of Meteora DBC. Best Use of Tessera Pre IPO stocks. Best Use of PreStocks. Accra is where we build. The beachhead is people outside the US who want US equity exposure without a brokerage that lies about the share count.

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
| 0:00–0:15 | Title card → `/network` | Honesty matrix. Say fail closed. Name three bounty tracks. |
| 0:15–0:50 | `/desk` week strip + `/network` | **Meteora DBC track.** Weekend refuse. Program read. No invented pool. |
| 0:50–1:25 | `/desk/tessera` | **Tessera Pre-IPO track.** Catalog → flip → wash → quote. |
| 1:25–2:00 | `/desk/preipo` | **PreStocks track.** Catalog → flip → wash → quote. No Tessera mix. |
| 2:00–2:40 | Buy + Markets venues | Shared spine under the tracks. Jupiter. Multi venue. |
| 2:40–3:15 | Flaws beat | DBC SSR trap. DBC create cost. Jupiter 429s. Solami Blur GB. Nest execute. |
| 3:15–3:30 | End | Three bounty names + prizes. Repo link. Soft close. |

### Spoken script (technical, still human)

This is the technical walkthrough of FOLIO. Same soft pitch, tighter spine. We compete in three Stocklana bounty tracks. Best Use of Meteora DBC at five thousand. Best Use of Tessera Pre IPO stocks at six thousand. Best Use of PreStocks at ten thousand.

We ship fail closed adapters. No mocks. No silent fallbacks. No fake fills. If a dependency is missing, the UI says so.

**Track one. Best Use of Meteora DBC.**

DBC is the stock curve lane. The curve does not know NYSE hours. FOLIO owns the cash session gate. Weekend size is refused. The home week strip and the network matrix show it. Production reads the mainnet DBC program with RPC account info. The official SDK plus Anchor broke Vercel SSR when statically imported and took the whole desk to five hundred. So the SDK stays behind a flag for tests. Mainnet pool create needs a funded wallet. Comfortable path is about five to eight hundredths of a SOL for config plus pool. We never invent a pool address. Graduation seven hundred fifty USDC is migration cap, not create SOL.

**Track two. Best Use of Tessera, Pre IPO stocks.**

Live Tessera token details API. T OpenAI, T SpaceX, T Kalshi and friends. Catalog list stays on the left. Ticket mirrors Buy. TokenSelect plus flip for USDC or USDT versus the T token. Wash still gates size. Buys confirm inside FOLIO. Loan participation is labeled. We do not pretend Tessera is Scaled UI public equity. We do not mix PreStocks mints onto this desk.

**Track three. Best Use of PreStocks.**

Live PreStocks catalog. Logos from the API. Same hybrid UX. Catalog kept. Flip USDC or USDT versus the PreStock mint. Wash gated. Buys in FOLIO. This desk never mixes Tessera. That separation is deliberate for bounty rules and for user clarity.

**Shared spine under the tracks.**

Share truth still comes from the live xStocks multiplier and Scaled UI compare when the ledger answers. Wash gate pauses thin or missing tape. Buy uses Jupiter quotes. Markets is multi venue with honest cooling labels. Borrow is Kamino LTV. NestUSD is metrics only. That spine supports every bounty room without inventing greens.

**Flaws we found and how we lived with them.**

Meteora DBC official SDK plus Anchor broke Vercel SSR. Production path is config plus RPC. Mainnet create cost is real. We document it instead of faking a pool.

Jupiter Price v3 rate limits under parallel catalog fetch. We stagger probes, cache with TTL, and leave empty cells labeled.

Raydium often has TVL without a mid. Liquidity awareness only.

Solami Blur wants prepaid bandwidth. We use Solami RPC tape and label Blur optional.

Nest execute stays Nest. Partner Pre IPO desks started as text only. We restored catalogs and logos after a bad rewrite. That lesson is in the README.

**Close.**

Three bounty tracks. Meteora DBC. Tessera Pre IPO. PreStocks. One doctrine. Fail closed. Soft pitch. Residual risk documented. Demo folio-tawny-one.vercel.app. Repo henrysammarfo slash folio. Thanks for watching.

### End card text

```
FOLIO · Technical
Meteora DBC · Tessera · PreStocks
fail closed · folio-tawny-one.vercel.app
```

### YouTube / Loom description (Technical)

```
FOLIO technical video. Three Stocklana bounty tracks and what we refused to fake.

Track 1 — Best Use of Meteora DBC ($5k): stock curve doctrine, weekend cash session refuse, program mainnet-read, no invented pool, SSR SDK trap documented.
Track 2 — Best Use of Tessera, Pre-IPO stocks ($6k): live T-tokens, catalog + TokenSelect flip, buys in FOLIO, no PreStocks mix.
Track 3 — Best Use of PreStocks ($10k): live catalog, logos, catalog + flip, wash gated, buys in FOLIO, no Tessera mix.

Flaws covered: DBC SSR 500, DBC create cost, Jupiter 429s, Raydium mid gaps, Solami Blur GB, Nest execute boundary.

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
