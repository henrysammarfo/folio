# FOLIO — Stocklana submission paste pack

Re-check live counts on https://hackathons.solana.com/hackathons/stocklana before final submit.

**Live (2026-09-16):** hackathons.solana.com **596** registered · **81** submissions · prize **$121,000** · hero deadline **SEP 25, 2026** (countdown ~9d). Timeline **Fri 18 Sep 2026, 16:00 ET** · stocklana.fun **18 Sep 23:59 UTC** — treat **18 Sep as conservative**. Demo preview: 21st MCP **connected** · AAPLx ≈ **1.003269×** live.

## Form fields (paste)

**Project name:** FOLIO

**One-liner:** Honest stock desk on Solana — live share truth, wash fail-closed, Jupiter quote-only, credit reads without fake fills.

**Demo URL:** https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app

**Repo:** https://github.com/henrysammarfo/folio (branch `cursor/folio-prefs-agent-honesty-f1ec` / PR #3)

**Pitch (≤ short paragraph):**
FOLIO is a stock desk for tokenized equities on Solana. Token balances lie after corporate actions — we read the live xStocks Scaled UI multiplier (AAPLx ≈ 1.003× today) and surface pending newMultiplier honestly (or none). If wash tape is missing or linked-flow looks dirty, acquire stays fail-closed. Jupiter quotes stay quote-only with short TTL / labeled stale-on-429 and broadcast paused on a ≤~$1 budget. Credit shows live Kamino LTV, Nest.credit vault awareness, and NestUSD labeled unavailable until a verified borrow endpoint exists. Watch-wallet mainnet-read qty is live on the public demo; multi-tenant Privy + Supabase sessions are wired but fail-closed without keys. Lab ships live 21st.dev Plasma WebGL (id 24346) behind an approve gate — production chrome stays locked until Henry picks. We do not claim unhackable security.

**Links judges can open:**
1. Demo: https://folio-git-cursor-folio-netro-desk-approve-f1ec-teamtitanlink.vercel.app
2. Truth: `…/truth?symbol=AAPLx`
3. Network honesty: `…/network`
4. Settings readiness: `…/desk/settings` (secret set · wash/Pyth/Privy/Supabase fail-closed)
5. Demo script: `docs/DEMO_SCRIPT.md`

**Track fit:** Investing / credit & yield / infrastructure (honest price + corporate-action truth + borrow reads). **Pyth bounty:** Equity.US.AAPL/USD · Crypto.AAPLX/USD · Crypto.AAPLON/USD mapped on `/truth` (prices fail-closed until `PYTH_API_KEY`); diverge vs Jupiter venue when both live.

## Henry blockers before “production complete”

- [x] Vercel `FOLIO_SESSION_SECRET` (≥16) + `BROADCAST_PAUSED=true` — settings shows **Watch-wallet secret set** · bind ready (live-verified)
- [x] Vercel `SOLANA_RPC_URL` (public mainnet) for Scaled UI + wallet reads
- [x] Vercel `API_KEY_21ST` (+ `SHADERS_API_KEY`, `AGENTROUTER_*`, `TAVILY_API_KEY`, `TINYFISH_API_KEY`) — `/lab/ui` shows **21st MCP connected** on branch preview (live-verified 2026-09-16)
- [x] Premium desk chrome approved: `FOLIO_APPROVED_LAB_UI=netro-density` on Vercel (prod/preview/dev) — `/desk` overview mounts Netro; home hero stays Aionis brand-plane (live-verified 2026-09-16)
- [ ] Land `BITQUERY_API_KEY` for live wash (fail-closed until then)
- [ ] Land `PYTH_API_KEY` for Hermes equity diverge (fail-closed until then — public Hermes returns 401)
- [ ] Land Privy + Supabase keys for multi-tenant sessions — see `docs/KEYS_LANDING.md`
- [x] GitGuardian tip clean on `cursor/folio-netro-desk-approve-f1ec` (PR #5) — historical mint FP remediates at tip; no Lovable history rewrite. Older stacked PRs may still need Henry **Skip: false positive**.
- [ ] Rotate any chat-pasted Vercel token

## Walkthrough artifacts

- Watch-wallet bind live: `/opt/cursor/artifacts/screenshots/watch-wallet-bind-live.png`
- Truth CA pending: `/opt/cursor/artifacts/screenshots/demo-truth-ca-pending.png`
- Activity CA pending: `/opt/cursor/artifacts/screenshots/demo-activity-ca-pending.png`
- Aionis / FOLIO / Netro / lab screens: `/opt/cursor/artifacts/screenshots/*-final.png`
- Lab approve CTAs + candidates: `/lab/ui` · `/lab/shaders`
