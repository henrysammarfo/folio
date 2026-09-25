# Henry desk doctrine — creative depth (binding)

> Updated: 2026-09-24 · Source: Henry voice + NetroBNB overview screenshots + FOLIO live desk shots.

## Always factorize (every feature)

Before shipping any desk/markets/credit/buy/partner change:

1. **Read the Bible** (`docs/FOLIO_BIBLE.md`) — soft pitch · pitch order · World’s Fair side tracks · honesty.
2. **Read memory** — `CURRENT_STATE.md` · `FACT_CHECK.md` · this file · `THREAT_MODEL.md`.
3. **Compare screenshots** — Henry’s FOLIO shots vs NetroBNB reference. Gap = work.
4. **Research** with Tavily / Firecrawl / TinyFish when unsure — never invent venue or design “facts.”
5. **Do not rush.** Take 4K time. Soft pitch only in user-facing copy. No ops jargon on consumer surfaces.
6. **Screenshot-verify** after UI work. If you did not refresh and look, you did not finish.

## What “creative” means here (not AI slop)

- **NetroBNB depth:** modular bento · high-contrast dark/light cards · logo strips · live clock · yellow/teal AI rail energy · floating swap sheet · signal/risk visuals · skeleton loaders · motion with purpose.
- **Not:** bare `Loading…` text · text-only PreStocks/Tessera rows · truncated headlines · faint venue dots · flat card soup without faces · purple-glow generic AI kits.
- **FOLIO tokens stay FOLIO** (ink/ledger · soft pitch). Derive *patterns* from Netro/Aionis — do not clone NetroBNB brand, yellow fox mascots, or Binance copy.
- Lab approve gate still binds: experimental chrome on `/lab/*` until Henry-approved (`FOLIO_APPROVED_LAB_UI=netro-density` already arms production desk Netro canvas).

## Screenshot gap ledger (2026-09-24 Henry pack)

| Henry shot | Gap vs NetroBNB / vs polish bar |
|---|---|
| Tessera “T-tokens / Loading…” | Bare text loader — need skeleton rows + logos when live |
| Tessera hero truncated (“quot” / “bu”) | Headline + sub too long for viewport — shorten soft copy |
| Buy “YOU PAY” dropdown | Functional but generic — deepen sheet (faces, search presence, motion) |
| Credit “AVAILABLE TO BORROW” | Clean but thin — add visual hierarchy / confidence cue without fake fills |
| NestUSD collateral cards | Logos OK · still flat list — richer rate rail |
| Markets LIQ / VENUE | Venue column faint (`• live · Jupiter`) — need stronger venue identity |
| Markets board cooling / http error | Honest labels OK · still feel unfinished without faces + density |
| Holdings “est.” / 0 verified | Honesty OK · presentation feels paper-demo — connect CTA stronger |
| Overview Pre-IPO / Tessera lists | **No logos** next to ANDURIL / OPENAI / T-SpaceX — Netro strip has logos; partner lanes do not |
| Overview agent rail | Present but quieter than Netro yellow intelligence column |
| NetroBNB full overview | Missing FOLIO analogues: signal-health grid, risk gauge, 3D/hero art depth, floating swap mascot energy (FOLIO-branded, not fox clone) |

## Gap close pass (2026-09-25)

| Gap | Status |
|---|---|
| Buy token sheet depth | Popular chips + deeper pop |
| Credit LTV hierarchy | Max LTV conic ring |
| NestUSD rate rail | Dual borrow/liq bars |
| Markets venue identity | Letter-mark pills J/G/R/S |
| Holdings paper-demo | Banner + Connect → |
| Partner Pre-IPO logos | API `image` + 40px faces |
| Overview AI rail quiet | Yellow sheen + live gate chips |
| DBC “how much SOL” | Documented — **0.05–0.08 SOL** comfortable create |

## Bible path audit (2026-09-24)

Bible **World’s Fair side tracks** added 2026-09-24:

| Track | Bible job | Repo reality | Usefulness if unfinished |
|---|---|---|---|
| **Meteora DBC** | Stock curve config · USDC · gentle · fixed/short linear fee · cash-close start · weekend refuse in FOLIO · devnet demo pool | **Live SDK** — `buildCurveWithMarketCap` + program executable on RPC · demo pool env pending | High when demo pool + Solami keyed |
| **Solami** | Mainnet tape proof (Blur/Yellowstone/RPC read) · pool vs Thursday close | **Live Blur REST** with DataApi key · else labeled RPC | High with key; medium without |
| **Panta** | Not taken | Correct — leave out | N/A |
| Cash-close + closed-session block | Mandatory spine with DBC | **Wired** — session-gate + acquire + overview week strip | Done |
| Multi-venue markets | Jupiter + free tape honesty | **Four venues** on board pills | Done |

**Honest stance:** syncing the Bible text without wiring DBC/Solami/cash-close was incomplete. Plan: ship labeled fail-closed adapters + desk/network surfaces first; real devnet DBC pool when RPC + rent allow — never fake mainnet volume.

## Research keys

Keys live only in gitignored `.env` (`FIRECRAWL_API_KEY` · `TINYFISH_API_KEY` · `TAVILY_API_KEY`). Rotate after any chat paste. Never re-echo values in commits or chat.
