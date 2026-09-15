# FOLIO — SESSION LOG

## 2026-09-15 — Plan lock + execution start

- Read FOLIO_BIBLE, EMPIRE_PLAN, FOLIO_UNIQUENESS_LOCK, STOCKLANA_WORLDSFAIR (uploads).
- Live checks: Tavily OK; TinyFish Search OK (Agent credits were 0 earlier); xStocks API needs `network=Solana`; Jupiter `api.jup.ag` quote OK; Pyth Hermes OK; AgentRouter WAF from some cloud egress.
- Repo was fixture UI ( plan said fixtures-only). Yahoo `getPrices` existed but desk used hardcoded numbers.
- User choices locked: strongest defaults (Privy+Supabase httpOnly); full Empire plan; pause broadcast until keys; ≤~$1 mainnet; no unhackable claims; UI from Aionis + NetroBNB + 21st + Shaders with approve gate.
- Started: memory/, .cursor rules+skills, .env (gitignored), live adapters.

## Open

- Privy / Supabase / Bitquery keys from Henry.
- Shader/21st visual candidates → `/lab/*` → approve before merge to marketing.
- Mentor DMs only after Block 0 demo link.

## 2026-09-15 (exec) — live spine + de-prior scaffold

- Network lock for Stocklana + Colosseum World’s Fair: **mainnet-primary READ**, Jupiter **quote-only**, local **fork** for CPI, **no** custom mainnet program deploy on ≤~$1.
- Live adapters smoke: xStocks AAPLx multiplier ≈1.00327; mint `XsbEhL…JzJp`; Jupiter Price+Quote OK; Pyth Hermes price updates **401** on this egress (fail-closed); wash fail-closed without Bitquery.
- Wired `/truth`, `/desk/acquire`, `/network` to live bundles.
- Removed  vite package, telemetry hook, README/AGENTS marketing; hero media preserved.
- Lab routes `/lab/shaders` + `/lab/ui` for approve gate.


## 2026-09-15 — Empire depth + desk de-fixture

- Confirmed Colosseum/World’s Fair network posture: **mainnet-read + quote-only + fork**, not full broadcast; documented in CURRENT_STATE / NETWORK_POLICY.
- Deep live research: Token-2022 Scaled UI effective-multiplier rules; Bitquery wash detector docs; Kamino xStocks market reserves (AAPLx maxLtv 0.40); Jupiter Lend earn tokens; Raydium mint pools; NestUSD left fail-closed pending verified metrics endpoint.
- Added adapters: `scaled-ui`, `kamino`, `jupiter-lend`, `pools`, `nestusd`; auth session scaffold; paper agent.
- Wired `desk.empire` bundles into positions / credit / activity / settings / desk index — removed fixture `4.0000×` positions export.
- Vitest: market math, wash fail-closed, paper intent — 8/8 green.
- Removed `.lovable/` directory; Lovable package already gone from package.json.
- Broadcast / mentor DMs still paused until Block 0 demo URL.

## 2026-09-15 — Acquire honesty + session mint/verify

- Fixed acquire Continue to require wash clear (`canReview` includes washOk); UI surfaces pressure / sampleSize / notes.
- Collapsed paper qty SoT via `paperRawFor`; removed duplicate DEMO_RAW/PAPER_RAW maps.
- Auth session: mint+HMAC verify for `folio_session`; fail-closed without Privy/Supabase/`FOLIO_SESSION_SECRET`.
- Wash scoring uses notional vs sampled USD (thin tape → elevated).
- Tests: 15 green (session cookie + thin-tape added). `tsc --noEmit` clean.
- Docs: `docs/DEMO_SCRIPT.md`; SQL stub `supabase/migrations/*_folio_tenants.sql`.
- Still open: live Bitquery/Privy/Supabase keys; premium UI merge only after Henry approves lab candidate; Playwright e2e; broadcast remains off.

## 2026-09-15 — Privy exchange + Playwright smoke

- Added `verifyPrivyAccessToken` + `createSessionFromPrivyToken` serverFn (fail-closed without keys / bad token).
- Playwright Block 0 smoke: home, truth (no 4.0×), acquire wash fail-closed (Continue disabled), network badges, lab approve gate — 5/5 green.
- Vitest 17/17; `tsc --noEmit` clean; build green.
- Still waiting on Bitquery / Privy / Supabase live keys and Henry lab UI approval before production visual merge / broadcast.

## 2026-09-15 — Tenant resolve + submit checklist

- `resolveTenantMemberships` fail-closed Supabase service-role lookup; wired into Privy→folio_session mint (empty tenants if unresolved).
- Settings binds Privy token → httpOnly Set-Cookie.
- `docs/STOCKLANA_SUBMIT.md` checklist.
- Tests: 19 unit + 5 e2e green.

## 2026-09-15 — Honesty gates + session UX

- Acquire: divergeOk wired into canReview; default spend $1; quote cap 25; broadcast still off.
- Broadcast single-source `isBroadcastPaused()` shared by network + settings.
- Positions badge: sessionReady vs keys-present.
- Settings: tenant membership list + clear httpOnly session.
- Prefs: service-role desk_preferences fetch when keys+tenant present.
- Removed Yahoo leftovers; softened /execution copy (no false Pass theater).
- Tests: broadcast helper + diverge gate unit coverage.

## 2026-09-15 — Wallet-read positions + Stocklana fact refresh

- Added `wallet-balances` adapter (SPL + Token-2022 via SOLANA_RPC_URL) and signed `folio_watch_wallet` cookie.
- Positions prefer Privy session wallet, else watch-wallet, else paper qty — labeled honestly.
- Settings UI bind/clear watch wallet; unit tests for merge + cookie HMAC.
- Live Stocklana: 528 registered, 67 submissions, $115k hero prize pool; deadline hero SEP 25 (verify at submit).

## 2026-09-15 — Credit wallet-read + Vercel project + replay

- Credit bundle uses wallet-read qty when bound (else paper), labeled honestly.
- Added `npm run replay` / `npm run smoke`.
- Created Vercel git project `folio` (team teamtitanlink) for demo URL path.
- Still blocked on Bitquery/Privy/Supabase keys + Henry lab approve for premium chrome merge.

## 2026-09-15 — Vercel Nitro preset + verify

- Fixed preview deploy `STATIC_BUILD_NO_OUT_DIR`: Nitro uses `vercel` preset under `VERCEL=1` (writes `.vercel/output`); local keeps `node-server`.
- Added `vercel.json` framework `tanstack-start` (project was `tanstack-start-lovable`).
- Desk home labels wallet-read vs paper; demo script mentions watch-wallet + `npm run replay`.
- Verified: vitest 28, playwright 7, smoke-empire live adapters, VERCEL=1 build emits Build Output API.

## 2026-09-15 — Public demo URL + RPC fallback

- Disabled Vercel Authentication on project `folio` so Stocklana judges can open the preview without SSO.
- Preview READY: `https://folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app`.
- Added `resolveSolanaRpcUrl()` public mainnet fallback when `SOLANA_RPC_URL` unset (labeled source; still fail-closed on errors).
- Henry still needs to set `FOLIO_SESSION_SECRET` (+ Bitquery/Privy/Supabase when ready) in Vercel env for watch-wallet / multi-tenant.
- Broadcast still paused; lab UI still approve-gated.
