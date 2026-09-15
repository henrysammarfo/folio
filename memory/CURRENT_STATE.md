# FOLIO — CURRENT STATE

> Updated: 2026-09-15 · Stocklana deadline **2026-09-18 20:00 UTC**
> Doctrine: honest security only — **never claim unhackable / NK-proof**.

## Product lock

- **One job:** Honest stock desk on Solana (truth · safe route · credit).
- **Pitch order:** (1) honest share counts (2) won’t buy wash (3) buy on Solana (4) borrow without selling (5) guarded agent.
- Soft: FOLIO buys the US stocks you want on Solana — keeps share counts honest, won’t buy in shady pools, and lets you borrow cash without selling.

## Network verdict (Stocklana + Colosseum World’s Fair)

**Mainnet-primary READ + quote-only.** Not full mainnet broadcast-everything. Not “devnet cosplay as mainnet.”

| Layer | Policy |
|---|---|
| xStocks multiplier / mint / Scaled UI | **Mainnet READ** (API + on-chain Token-2022) |
| Jupiter price + swap quote | **Mainnet READ / quote-only** |
| Wash / Bitquery | **Mainnet READ**, fail-closed until keyed+wired |
| Kamino xStocks / Jupiter Lend earn / Raydium pools | **Mainnet READ** (labeled) |
| NestUSD capacity | **Unavailable** until verified endpoint |
| Swap / borrow broadcast | **Disabled** (≤~$1 budget) |
| Borrow CPI proofs | **Local mainnet-fork** when unfunded |
| Custom program mainnet deploy | **Out** (rent ≫ $1) |
| Optional policy harness | Devnet OK if labeled |

World’s Fair still wins on **working honesty**: live multiplier + wash refuse + Jupiter quote + credit reads with mode badges beats fake mainnet fills.

## Repo reality

| Layer | Status |
|---|---|
| Live Block 0 spine (truth / acquire / network) | Wired |
| Positions / credit / activity / settings | Live bundles (paper qty labeled) |
| On-chain Scaled UI reader | Live when `SOLANA_RPC_URL` set |
| Kamino xStocks market reserves | Live mainnet-read |
| Jupiter Lend earn vaults | Live mainnet-read (not xStock borrow) |
| Raydium pool awareness | Live mainnet-read |
| NestUSD | Fail-closed / risk-labeled |
| Privy + Supabase sessions | Mint/verify httpOnly cookie path wired; fail-closed without keys+`FOLIO_SESSION_SECRET` |
| Paper agent + meter stub | Wired on settings |
| Playwright e2e | Green (home / truth / acquire fail-closed / network / lab gate) |
| Vitest unit | Green (15) — market math, wash fail-closed + heuristics + thin-tape, session cookie, paper intent |
| Lovable traces | Removed (`.lovable` deleted; vite config independent) |

## Keys

Present in `.env`: Tavily, TinyFish, AgentRouter, 21st, Shaders, Solana RPC.
Empty / needed later: Privy, Supabase, Bitquery, Jupiter (if gated). `FOLIO_SESSION_SECRET` set locally for watch-wallet + session signing readiness.
**Rotate all chat-pasted keys after hackathon.**

## Live deltas (do not regress)

- AAPLx multiplier ≈ **1.00327** (not fixture 4.0×)
- Mint `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`, decimals **8**
- On-chain effective Scaled UI matches pending API multiplier when timestamp elapsed
- Kamino AAPLx **maxLtv 0.40** on market `5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua`


## Latest progress (2026-09-15)

- Acquire gate: `canReview = truthOk && washOk && quoteOk` — Continue blocked when wash fail-closed.
- Paper qty single source: `paperRawFor()` in `src/lib/market.ts` (truth/positions/credit).
- Wash: Bitquery GraphQL + self-trade / fee-payer / thin-tape heuristics; fail-closed without `BITQUERY_API_KEY`.
- Auth: HMAC `folio_session` mint/verify (`FOLIO_SESSION_SECRET`); settings shows `sessionReady` separately from keys-present.
- Lab `/lab/shaders` + `/lab/ui` remain approve-gated; production hero untouched.
- Broadcast / mentor spam still paused.

## 2026-09-15 honesty pass
- `canReview` requires `divergeOk` as well as truth/wash/quote.
- Quote inspection default $1 / max $25; broadcast remains paused (`isBroadcastPaused`).
- Session UX: tenant list + clear httpOnly cookie; prefs service-role fetch when keyed.
- Yahoo leftovers removed; `/execution` copy softened (no false Pass theater).
- Premium UI still approve-gated on `/lab/*` — awaiting Henry candidate id.
- Keys still empty: Privy / Supabase / Bitquery. `FOLIO_SESSION_SECRET` set locally for watch-wallet + session signing.


## Latest progress (2026-09-15)

- Watch-wallet httpOnly cookie + mainnet SPL/Token-2022 balance reads wired into Positions (qtySource wallet-read | paper).
- Settings: bind/clear watch wallet (requires FOLIO_SESSION_SECRET; **not** Privy multi-tenant auth).
- Stocklana live counts refreshed: **528 registered / 67 submissions / $115k hero pool**; deadline hero SEP 25 (re-check timeline vs hero at submit).
- Broadcast still paused; Privy/Supabase/Bitquery still empty → wash + multi-tenant sessions remain fail-closed.
- Premium UI still approve-gated on `/lab/*`.


## 2026-09-15 wallet-read credit + demo

- Credit collateral math prefers wallet-read qty when watch-wallet/Privy wallet bound; falls back to paper with honest labels.
- `npm run replay` one-command verify (unit + e2e + empire smoke + build).
- Vercel project `folio` linked to GitHub (`prj_pzvYDMnYiSDcJNsv5NCdy5UVeExq`); feature work on `cursor/folio-wallet-read-f1ec`.
- Nitro preset: `vercel` when `VERCEL=1`, else `node-server` for local preview/e2e; `vercel.json` framework `tanstack-start`.
- Verified locally: **31** unit + 7 e2e green; empire smoke live (wash/auth fail-closed; scaled-ui/pools/kamino ok).
- Broadcast still paused; wash/multi-tenant still fail-closed without Bitquery/Privy/Supabase.
- Demo env still needed on Vercel: `SOLANA_RPC_URL`, `FOLIO_SESSION_SECRET`, `BROADCAST_PAUSED=true` (+ keys when landed).

## 2026-09-15 Vercel public demo + RPC fallback

- Preview deploy **READY**: https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app (SSO protection disabled for public demo).
- Nitro `vercel` preset fix shipped; home/`/truth`/`/desk`/`/desk/settings` return 200 publicly.
- `resolveSolanaRpcUrl()` prefers `SOLANA_RPC_URL`, else labeled public mainnet RPC fallback for Scaled UI + wallet-read (still fail-closed on RPC errors).
- Watch-wallet bind on Vercel still needs `FOLIO_SESSION_SECRET` in project env (CLI not authenticated here — set in Vercel dashboard).
- Broadcast remains paused; wash/multi-tenant still fail-closed without Bitquery/Privy/Supabase.
- Premium UI still approve-gated on `/lab/*` until Henry names a candidate id.

## 2026-09-15 Truth SSR

- `/truth` server loader prefetches live bundle; local SSR shows ~1.003269× (not fixture 4.0×).

## 2026-09-15 network honesty + Stocklana refresh

- Network matrix splits Kamino / Jupiter Lend / NestUSD; NestUSD + wash-without-Bitquery + broadcast stay **unavailable/fail-closed** (no false mainnet-read).
- Matrix also surfaces multi-tenant keys, watch-wallet secret, Scaled UI RPC fallback.
- `/network` SSR-prefetches live matrix.
- Stocklana live: **536 registered / 67 submissions / $121k** hero; deadline hero SEP 25 vs timeline 18 Sep 20:00 UTC — re-check at submit.
- Wash matrix row forced `unavailable` when Bitquery key missing (not just detail text).
- Keys still empty: Privy / Supabase / Bitquery. Set `FOLIO_SESSION_SECRET` on Vercel for watch-wallet.
- Premium UI still approve-gated (`ink-ledger` / `ledger-mist` / `aurora-grid` · `desk-density-a` / `desk-density-b` / `gate-chip`).

## 2026-09-15 desk SSR honesty

- `/desk/credit|settings|acquire` SSR-prefetch live bundles.
- NestUSD UI never paints Ready; broadcast policy hard-false until funded.
- Still blocked on Bitquery/Privy/Supabase keys + Henry lab approve + Vercel `FOLIO_SESSION_SECRET`.

## 2026-09-15 positions SSR

- `/desk/positions` SSR-prefetches live bundle.
- Vercel preview READY on honesty push; `/network` live shows NestUSD/wash/broadcast/auth fail-closed; `/truth` ~1.003269×.
- Still need: Bitquery/Privy/Supabase keys, Henry lab approve, Vercel `FOLIO_SESSION_SECRET`.

## 2026-09-15 desk overview SSR

- `/desk/` first paint uses SSR positions+credit.
- Settings shows Auth fail-closed / Broadcast off from live session policy.

## 2026-09-15 activity SSR + smoke honesty

- Desk activity + position detail SSR.
- Empire smoke fails closed if matrix lies about NestUSD/wash/broadcast/auth.
- Still blocked: Bitquery/Privy/Supabase keys, Henry lab approve, Vercel FOLIO_SESSION_SECRET.

## 2026-09-15 lab polish + Stocklana 68 + submit paste pack

- `/lab/ui` candidates differentiated: dense ledger (`desk-density-a`), quiet metric strip (`desk-density-b`), ModeBadge chip row (`gate-chip`) with motion (respects prefers-reduced-motion).
- `/lab/shaders` reply chip lists `ink-ledger` · `ledger-mist` · `aurora-grid`; hero still locked.
- Stocklana live WebFetch: **536** registered / **69** submissions / **$121k** hero; deadline conflict unchanged — re-check at submit.
- Added `docs/STOCKLANA_SUBMISSION.md` paste pack; submit checklist ticks verified honesty items; Vercel `FOLIO_SESSION_SECRET` still Henry-owned.
- Still blocked for full objective: Bitquery / Privy / Supabase keys + lab approve + Vercel session secret.

## 2026-09-15 settings watch-wallet secret honesty

- SessionBundle exposes `sessionSecretPresent` (FOLIO_SESSION_SECRET ≥16).
- `/desk/settings` ModeBadge + Watch wallet panel show secret set/missing; bind disabled when missing (Vercel Henry action still required).

## 2026-09-15 public /credit + /execution live SSR

- Public `/credit` SSR-prefetches `getCreditBundle` — live Kamino LTV, NestUSD fail-closed (never Ready), borrow fork/off.
- Public `/execution` SSR-prefetches `getNetworkBundle` — wash/quote/broadcast honesty badges on first paint.
- Block 0 e2e now 10 tests (added public credit + execution honesty).

## 2026-09-15 ephemeral wallet inspect

- `/desk/positions?inspect=<pubkey>` mainnet-reads balances without `FOLIO_SESSION_SECRET` / watch-wallet cookie.
- Priority: Privy session → watch-wallet cookie → ephemeral inspect. Inspect labeled not-auth / not multi-tenant.
- Stocklana live: **536** registered / **69** submissions / **$121k** hero; deadline conflict unchanged — re-check at submit.
- Still blocked for full objective: Bitquery / Privy / Supabase keys + Henry lab approve + Vercel `FOLIO_SESSION_SECRET`.

## 2026-09-15 credit ephemeral inspect

- `/desk/credit?inspect=` + public `/credit?inspect=` pass through to credit bundle.
- Network matrix lists ephemeral inspect as always-on mainnet-read (not auth).
- Still blocked: Bitquery/Privy/Supabase keys + Henry lab approve + Vercel FOLIO_SESSION_SECRET for watch-wallet bind.

## 2026-09-15 — Visible lab approve path (Henry feedback)

- Home hero now shows **Approve desk UI** + **Approve shaders** CTAs (premium still gated).
- Desk sidebar foot + settings readiness link to `/lab/ui` and `/lab/shaders`.
- Desk overview `?inspect=` + settings production readiness checklist in flight on this branch.
- Stocklana live (jina): **538** registered / **69** submissions / **$121k**; deadline conflict SEP 25 hero vs timeline/stocklana.fun 18 Sep — re-check at submit.
- Vision stub: `docs/COLOSSEUM_VISION.md` (Ghana / why / sustainability — expand after UI approve + keys).
- Still blocked for full objective: Bitquery/Privy/Supabase keys + Henry lab id + Vercel `FOLIO_SESSION_SECRET`.
