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

## 2026-09-15 — Truth SSR prefetch

- `/truth` loader prefetches `getTruthBundle` so first paint shows live xStocks multiplier (verified locally ~1.003269×), not empty placeholders.
- Public Vercel demo remains up; set `FOLIO_SESSION_SECRET` in Vercel for watch-wallet.

## 2026-09-15 — Network matrix honesty + Stocklana fact refresh

- Reworked `buildNetworkMatrix` so NestUSD / multi-tenant auth / broadcast are not painted live when keys/endpoints are missing.
- `getNetworkBundle` probes Kamino, Jupiter Lend, NestUSD, Scaled UI + key presence flags.
- `/network` loader SSR-prefetches matrix; e2e asserts NestUSD fail-closed + broadcast paused + Bitquery missing.
- Wash row mode forced `unavailable` without Bitquery (not just detail string).
- Live Stocklana (official page): **534** registered, 67 submissions, $121k hero pool; deadline conflict SEP 25 hero vs 18 Sep 20:00 UTC timeline.
- Submit pack lists lab candidate ids for Henry approve gate.

## 2026-09-15 — Desk SSR + NestUSD/broadcast honesty

- SSR-prefetch loaders on `/desk/credit`, `/desk/settings`, `/desk/acquire` so fail-closed labels paint before client fetch.
- NestUSD badge never says Ready (probed · risk-labeled / reason / Risk · unverified).
- `networkPolicy.broadcast` hard-false until funded (not merely `!isBroadcastPaused()`).
- Network matrix honesty + Stocklana 534/67/$121k already committed.

## 2026-09-15 — Positions SSR + submit checklist

- `/desk/positions` SSR-prefetches positions bundle (wallet-read vs paper labels on first paint).
- Stocklana submit checklist: mode badges + `/network` honesty ticked against live Vercel preview; Vercel `FOLIO_SESSION_SECRET` still required (matrix shows missing).

## 2026-09-15 — Desk overview SSR + settings auth badge

- `/desk/` SSR-prefetches positions+credit bundles.
- Settings ModeBadges reflect broadcast hard-false + auth fail-closed from session bundle.

## 2026-09-15 — DEMO_SCRIPT live URL

- Added verified Vercel preview URL + honesty beats + Stocklana 534/67/$121k note.

## 2026-09-15 — Activity SSR + empire smoke honesty

- `/desk/activity` + `/desk/positions/$symbol` SSR-prefetch.
- e2e: settings auth fail-closed + positions paper/wallet-read labels.
- `smoke-empire` asserts NestUSD/wash/broadcast/multi-tenant stay unavailable without keys.

## 2026-09-15 — Lab polish + Stocklana 68 + submission paste pack

- Differentiated `/lab/ui` previews + CSS motion (rise/sheen/row-in/drift) behind approve gate only.
- Refreshed Stocklana counts to **68** submissions; added `docs/STOCKLANA_SUBMISSION.md`.
- Keys still empty (Bitquery/Privy/Supabase); Vercel `FOLIO_SESSION_SECRET` still missing on preview; broadcast remains paused.
- Goal not complete — awaiting keys + Henry lab id + Vercel secret.

## 2026-09-15 — Watch-wallet secret honesty on settings

- Surfaced FOLIO_SESSION_SECRET readiness on settings (ModeBadge + panel + bind disable).
- Lab polish + Stocklana 68 submit paste pack already on preview READY.
- Goal still blocked on Bitquery/Privy/Supabase keys + Henry lab approve + Vercel secret.

## 2026-09-15 — Public credit/execution live honesty

- Wired marketing `/credit` and `/execution` to live desk bundles (SSR) so judges see Empire honesty without opening desk.
- NestUSD still never Ready; broadcast paused; wash fail-closed without Bitquery.
- Goal still blocked on Bitquery/Privy/Supabase keys + Henry lab approve + Vercel FOLIO_SESSION_SECRET.

## 2026-09-15 — Ephemeral wallet inspect (no Vercel secret)

- Shipped `?inspect=` on positions (+ credit bundle input) so public Vercel demo can show wallet-read path without `FOLIO_SESSION_SECRET`.
- Unit tests for resolveDisplayWallet priority; e2e covers inspect copy.
- Stocklana counts refreshed to 536 / 69 via official WebFetch.
- Goal still open: keys + UI approve + Vercel session secret.

## 2026-09-15 — Credit inspect + matrix row

- Wired `?inspect=` on desk/public credit; matrix row for ephemeral inspect; demo/submit docs + e2e.
- Goal still open pending keys + lab approve + Vercel session secret.

## 2026-09-15 — Pause for Henry step-by-step + visible approve CTAs
- Henry: no premium UI visible yet (by design); asked stop-for-keys step-by-step + where to approve.
- Shipped home/desk/settings links to `/lab/ui` + `/lab/shaders`; Colosseum vision stub.
- Do not burn autonomously — wait for lab id and Vercel Step 1 screenshot.

## 2026-09-15 — Step 1 Vercel secrets verified + lab/about polish
- Henry pasted Vercel token; set `FOLIO_SESSION_SECRET` + `BROADCAST_PAUSED`; redeploy READY; settings green for secret.
- Shipped clearer lab approve panel + Accra `/about` vision; HENRY_STEPS Step 1 marked done.
- Next Henry gate: lab id (+ rotate token). Then Bitquery → Privy → Supabase one-by-one.
- Goal not complete — multi-tenant + wash green + premium merge still open.

## 2026-09-15 — Live watch-wallet bind + Stocklana 538
- Verified bind on Vercel preview (Playwright); screenshot saved.
- Stocklana: 538 / 69 / $121k; SEP 25 hero deadline conflict unchanged.
- Awaiting Henry lab approve before premium merge; keys still empty for wash + multi-tenant.

## 2026-09-15 — Pyth auth gate + RPC on Vercel
- Shipped PYTH_API_KEY Hermes Bearer path (fail-closed without key); settings/matrix honesty; SOLANA_RPC_URL on Vercel.
- Goal still open — multi-tenant + wash + premium merge need Henry.

## 2026-09-15 — Keys landing runbook + Stocklana pack refresh
- Docs/runbook/seed/e2e for post-key multi-tenant + Pyth/wash landing; Stocklana paste pack unblocked for secret step.
- Awaiting Henry lab id before premium merge.

## 2026-09-15 — Multi-tenant session fail-closed on tenant lookup + lab copy ids
- `buildSessionFromPrivyToken` refuses to mint when tenant lookup errors (no invented empty memberships); empty after successful lookup still OK.
- Unit coverage: happy path + tenant 503 fail-closed + empty memberships (46 tests green).
- Lab approve panel: one-click copy candidate ids; settings points at `docs/KEYS_LANDING.md` / `npm run keys`.
- Still blocked for full objective: Henry lab id · Bitquery · Pyth · Privy · Supabase · funded broadcast.

## 2026-09-15 — Acquire fail-closed naming + Stocklana refresh
- Shipped acquire gate helper + honesty/blocked split; acquire UI next-step to settings/keys runbook.
- Stocklana counts → 539 / 71 / $121k (official hackathons page); deadline conflict unchanged.
- Goal still open — waiting on Henry lab id + Bitquery/Pyth/Privy/Supabase.

## 2026-09-15 — Lab Pick + opt-in desk preview
- Lab approve panel: Pick → localStorage + chat reply copy; Preview on desk is session-only (not a merge).
- DeskShell banner + density/shader data attrs; settings shows picked ids; e2e covers pick→preview→exit.
- Goal still open — Henry must reply with lab id in chat before premium merge; keys still missing.

## 2026-09-15 — Prefs write + tenant enrich + paper spine + borrow honesty
- Softened borrow CPI honesty: unavailable until funded (no fork harness theater).
- Multi-tenant: `saveDeskPreferences` upsert; settings switches when session+tenant; membership shows slug/display/wallet.
- Paper agent always runs live Block 0 truth/quote spine with `broadcast=false`; AgentRouter optional.
- Still waiting on Henry: lab id · Bitquery · Pyth · Privy · Supabase · funded broadcast.

## 2026-09-15 — Active tenant + strict prefs + paper wash gates
- `activeTenantId` on folio_session (membership-validated); settings switch remints cookie via `setActiveTenant`.
- Acquire loads `strictFailClosed` from active-tenant prefs — missing/unresolved Pyth blocks review when strict.
- Paper agent quote path shares wash + acquire gates; RLS honesty note on SessionBundle.
- Softened remaining fork theater (mode badge / about). Vitest 65 green.
- Goal open: Henry lab Pick reply + Bitquery/Pyth/Privy/Supabase; broadcast stays paused.

## 2026-09-15 — Acquire strict surface + activity CA pref honesty
- Surface session vs public strict-fail-closed on acquire; activity labels CA alert preference without inventing a calendar feed.
- E2E + Stocklana/docs URLs on prefs preview. Goal still open for Henry lab id + keys.

## 2026-09-15 — Desk wallet honesty + Nest.credit live read
- Killed fake `7vF…2ka` desk chip; Nest.credit vault TVL live as separate capability; NestUSD borrow remains fail-closed.
- Goal open: Henry lab Pick + Bitquery/Pyth/Privy/Supabase; broadcast paused.

## 2026-09-15 — Jupiter short TTL + CA pending honesty
- Shipping short TTL cache with honest labels, plus live CA surface from xStocks.
- Quote 20s / price 30s; 429 → stale ≤120s or fail-closed `jupiter_rate_limited`.
- Truth metric + activity event for pendingMultiplier; preference row no longer pretends a calendar feed.
- Preview verified: Pending CA **None**; activity “Corporate action · no pending multiplier”; Jupiter price source labeled cached.
- Network matrix details include TTL/stale-429 policy.
- Goal open: Henry lab Pick reply + Bitquery/Pyth/Privy/Supabase; broadcast paused.

## 2026-09-15 — Desk policy CA + acquire Jupiter source + Stocklana refresh
- Desk overview policy: Live · no pending CA, Nest.credit vaults, NestUSD fail-closed.
- Acquire surfaces Jupiter live/cached/stale + pending CA on checks/review.
- Stocklana → **545** registered / **72** submissions / **$121k**.
- Goal open: Henry lab Pick + keys.

## 2026-09-15 — Guarded paper agent CA/Jupiter honesty
- Agent truth facts include pending CA or none; quote facts include cacheLabel.
- Position detail Pending corporate action row; settings copy updated.
- Goal open: Henry lab Pick + Bitquery/Pyth/Privy/Supabase; broadcast paused.

## 2026-09-15 — AgentRouter WAF → spine-only (B002)
- Paper agent never drops live spine when AgentRouter returns WAF HTML / bad JSON.
- Settings readiness + structured agent output include nlExpansion.
- Goal open: Henry lab Pick + keys.

## 2026-09-15 — Post-key smoke harness
- Shipped `src/lib/keys-smoke.ts` + `scripts/smoke-keys.mts` + unit tests; `npm run smoke:keys`.
- Live run (no Bitquery/Pyth/Privy/Supabase): SKIP probes · FC multi_tenant · OK broadcast/session/agentrouter.
- Tenant migration user_id indexes; KEYS_LANDING / STOCKLANA_SUBMIT updated.
- Vitest 76 green. Goal open: Henry lab Pick + Bitquery/Pyth/Privy/Supabase; broadcast paused.
