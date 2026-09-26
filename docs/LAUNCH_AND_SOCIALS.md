# FOLIO — Launch, socials, beta & judge outreach

> 2026-09-26 · Do this in order. Companion: whitepaper · operating plan · `docs/GTM_PLAYBOOK.md` · `docs/GROK_DISTRIBUTION_BOT.md`.

## Sequence (locked)

1. **Finish desk** (truth / wash / quote / markets / pairs / PreStocks / Tessera) ✅  
2. **Document** (whitepaper, operating plan, Stocklana pack, GTM) ✅  
3. **Submit Stocklana** (re-check live form counts before claims)  
4. **Buy domain + claim X** · wire Vercel alias · update `socials.ts`  
5. **Grok/GTM bot drafts** · Henry posts · mentor feedback loop  
6. **Reach Colosseum / World’s Fair** (submit by **2026-10-12**)  
7. **Open closed beta** (`/beta`) — mainnet-read + quote; fills when funded  
8. **Traction** (funded actives, demos, written mentor notes)  
9. **Submit Colosseum** with Stocklana credibility + beta numbers  

Winning Stocklana is a **credibility booster**. Colosseum World’s Fair is the next gate.

---

## A0. Domain shortlist (Vercel registrar · 2026-09-26)

Do **not** buy until Henry picks one. Then quote → confirm → `buy_domain` → add to project.

| Domain | ~1y USD | Note |
|---|---:|---|
| **honestfolio.com** | 11.25 | Soft-pitch brand · recommended cheap primary |
| **honestfolio.app** | 14.99 | App TLD twin |
| **foliohq.dev** | 13.00 | Builder-native · good for Colosseum |
| **wearefolio.app** | 14.99 | Community / “we” tone |
| **solfolio.app** | 14.99 | Solana-native |
| **folioaccra.com** | 11.25 | Origin story · secondary |
| **solstocks.app** | 14.99 | Category, weaker brand |
| **folio.trade** | 385 | Premium · only if budget allows |

Taken (skip): folio.xyz · folio.so · tryfolio.com · getfolio.com · folio.fi · folio.finance · folio.markets …

After purchase: point DNS to Vercel project `folio` · keep `folio-tawny-one.vercel.app` as fallback · update bio + `SOCIALS.demo`.

---

## A. Create socials (Henry — manual, ~30 min)

### X / Twitter (primary)
1. Create **@folio** if available; else `@tryfolio` / `@folio_desk` / `@folioxyz` / `@honestfolio` (pick one; update `src/lib/socials.ts`).
2. Display name: **FOLIO**
3. Bio (paste):
   > Honest stock desk on Solana. Share counts you can trust. Won’t buy wash. Borrow without selling. Built in Accra. → folio-tawny-one.vercel.app
4. Header: home hero `/opt/cursor/artifacts/folio-x-post.png` · Avatar: FOLIO mark
5. Pin: soft-pitch launch + demo thread
6. Link in bio: production URL (or new domain) + `/beta`
7. Distribution drafts: `npx tsx scripts/gtm-draft.mts` → `memory/gtm-queue.json` (see `docs/GROK_DISTRIBUTION_BOT.md`)

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

**Deadline:** product submission **2026-10-12** · https://colosseum.com/worldsfair  
**Prizes:** overall + Solana ecosystem track · Accelerator interview path for winners.

### Feedback that actually works
Colosseum does **not** guarantee written feedback to every team. Earn it:
1. Join Colosseum Discord · RSVP livestream workshops  
2. Superteam / office hours when available  
3. Advice-first public replies + ≤10 thoughtful DMs (templates above)  
4. Mentors already listed in Bible: `@kashdhanda` · `@y2kappa` · `@colosseum` · `@crabbylions` · `@mattytay` · `@adamdelphantom`  
5. Collect ≥3 written notes → paste into `docs/COLOSSEUM_VISION.md`  
6. Submit: demo + 2–3 min video + GitHub + honest traction (beta count) + soft story  

### Hype = system (not spam)
From Solana GTM: brand first · replies as free marketing · don’t launch alone · amplify milestones only · team is first distribution. FOLIO maps this in `docs/GTM_PLAYBOOK.md`. Grok bot drafts; Henry posts.

---

## F. Owner checklist (this week)

- [ ] Pick + buy domain from A0 · alias on Vercel
- [ ] Claim Folio X handle · update `src/lib/socials.ts`
- [ ] Add `XAI_API_KEY` (or use AgentRouter) · run `npx tsx scripts/gtm-draft.mts`
- [ ] Record ≤90s demo · upload unlisted YouTube/X
- [ ] Post launch + reply thread · pin soft pitch
- [ ] Join Colosseum Discord · RSVP 1 workshop
- [ ] DM/reply 10 judges/builders with demo link (advice first)
- [ ] Invite first 25 beta users from `/beta`
- [ ] Draft Colosseum portal answers · deadline **2026-10-12**
- [ ] Weekly metrics note in `memory/SESSION_LOG.md`
