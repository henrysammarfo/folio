# FOLIO — Launch, socials, beta & judge outreach

> 2026-09-19 · Do this in order. Companion: whitepaper + operating plan.

## Sequence (locked)

1. **Finish desk** (truth / wash / quote / markets / pairs / PreStocks / Tessera) ✅ in progress  
2. **Document** (whitepaper, operating plan, updated Stocklana pack) ← this folder  
3. **Submit Stocklana** (deadline hero **SEP 25, 2026** — re-check live form)  
4. **Create X + socials** · publish whitepaper + demo  
5. **Reach Colosseum / World’s Fair judges** for feedback (not spam)  
6. **Open closed beta** (`/beta`) — mainnet-read + quote; fills when funded  
7. **Gather traction** (funded actives, demos, testimonials)  
8. **Submit Colosseum** with Stocklana credibility + beta numbers  

Winning Stocklana is a **credibility booster**, not the finish line.

---

## A. Create socials (Henry — manual, ~30 min)

### X / Twitter (primary)
1. Create **@folio** if available; else `@tryfolio` / `@folio_desk` / `@folioxyz` (pick one; update `src/lib/socials.ts`).
2. Display name: **FOLIO**
3. Bio (paste):
   > Honest stock desk on Solana. Share counts you can trust. Won’t buy wash. Borrow without selling. Built in Accra. → folio-tawny-one.vercel.app
4. Header: desk / markets screenshot · Avatar: FOLIO mark
5. Pin: whitepaper + 60s demo thread
6. Link in bio: production URL + `/beta`

### Secondary (week 1 optional)
- GitHub org/repo already: `henrysammarfo/folio`
- Linkedin: company page later; personal posts OK
- Discord: only after ≥20 beta users (don’t empty-room it)

Until Folio handle exists, site can keep linking **@henrysammarfo** and switch via `socials.ts`.

---

## B. Content kit (first 14 posts)

| # | Type | Hook |
|---|---|---|
| 1 | Launch | “FOLIO is live for Stocklana — honest share counts on Solana.” |
| 2 | Demo | Screen recording: Truth × → Buy quote → Markets board |
| 3 | Problem | “Token balances lie after corporate actions. Here’s Scaled UI.” |
| 4 | Wash | “If the tape looks dirty, we refuse. Fail-closed > fake green.” |
| 5 | Pairs | “Stock↔stock: AAPLx → MSFTx without cashing to USDC.” |
| 6 | Pre-IPO | “PreStocks desk ≠ Tessera. We keep lanes honest.” |
| 7 | Credit | “Borrow without selling — LTV read, no fake Ready.” |
| 8 | Accra | Founder note — grit, not pity |
| 9 | Beta | “Closed beta open — quote-only until fills unlock.” |
| 10 | Ask | “Judges/builders: what would make you trust an on-chain stock desk?” |
| 11 | Thread | Whitepaper summary (10 tweets) |
| 12 | Compare | Soft vs Solflare access — we sell honesty |
| 13 | Metrics | Weekly: quotes served, wash refuses, beta signups (honest numbers) |
| 14 | Colosseum | “Applying feedback from Stocklana into World’s Fair.” |

**Cadence:** 3–5 posts / week. No engagement bait. No “unhackable.”

### DM / reply templates (judges & mentors)

**Reply (public):**
> Building FOLIO — honest xStocks desk (Scaled UI truth + wash refuse + quote-only). Would love a brutal take on whether this is desk-worthy or still demo theater: [demo]

**DM (short):**
> Hey [Name] — Henry from Accra. Shipping FOLIO for Stocklana/Colosseum: live share truth + fail-closed wash on Solana stocks. Not asking for a yes — asking what you’d break first. Demo: [url] · 90s: [video]

Goal: **advice first**, interest second. Max 1 follow-up.

---

## C. Closed beta (mainnet-close)

### What “beta” means
- Users can **browse, quote, inspect holdings** on mainnet reads
- **Fills/borrows remain paused** until funded + policy unpause
- Every surface labels live / cached / fail-closed / paused

### Activation definition
User is “activated” when they: connect or paste wallet **and** complete ≥1 quote review on Buy or Pre-IPO.

### Waitlist
- Public page: `/beta`
- Capture: email + optional wallet + “how you found us”
- Ops: export weekly; invite in batches of 25 with personal note

### Beta welcome blurb
> Welcome to FOLIO closed beta. You’re on a quote-only desk: live prices and honesty gates are real; fills stay paused on purpose. Start at Markets → Buy AAPLx → check Truth. Tell us what feels broken.

---

## D. Stocklana submit (checklist)

Re-check: https://hackathons.solana.com/hackathons/stocklana  
Paste pack: `docs/STOCKLANA_SUBMISSION.md`

**Judges need HTTPS links that work:**
1. Live demo (production or current PR preview)
2. GitHub repo
3. Pitch / demo video
4. Whitepaper (`/whitepaper` or `docs/FOLIO_WHITEPAPER.md` raw/GitHub)

Tracks to name: Investing · credit & yield · infrastructure · PreStocks / Tessera bounties as applicable · Pyth if keyed.

---

## E. Colosseum / World’s Fair

After Stocklana submit + first beta signals:
1. Collect 3 written judge/mentor notes
2. Update vision pack: `docs/COLOSSEUM_VISION.md`
3. Submit with: demo + traction screenshot (beta count, honest) + whitepaper
4. Interview beats already in vision pack — practice aloud

---

## F. Owner checklist (this week)

- [ ] Claim Folio X handle · update `src/lib/socials.ts`
- [ ] Record ≤90s demo · upload unlisted YouTube/X
- [ ] Submit Stocklana form (edit until close)
- [ ] Post launch thread · pin whitepaper
- [ ] DM/reply 10 judges/builders with demo link
- [ ] Invite first 25 beta users from `/beta`
- [ ] Weekly metrics note in `memory/SESSION_LOG.md`
