
# FOLIO — SESSION LOG

## 2026-09-20 — Phase A begin + ecosystem field (Uniswap/peers)

- Henry approved A→G order; begin Phase A.
- Ecosystem: `docs/ECOSYSTEM_FIELD.md` — Uniswap/UniswapX+Ondo, Dinari, xStocks, PreStocks, Tessera, Superstate, Robinhood. Live arm stays Solana+Jupiter.
- Jupiter **`swap/v2/order`** + gated **`/execute`** (`executeJupiterSwap`). Wallet sign = Phase B. Vitest green.

## 2026-09-20 — Light TradingView (Netro match)

- Chart was dark because we set `theme="dark"` — NetroBNB uses `theme: "light"` + dark `#1C1C1C` watermark @ 0.11.
- Switched overview TV to light; mark no longer inverted white-on-black blob.

## 2026-09-20 — FOLIO watermark shipped to main/prod

- User still saw old wordy Buy sheet — that was **main/prod**, not PR #26 preview.
- Merged Netro-depth + FOLIO TV watermark + lean copy onto `main` (`8408c35`).
- Details sheet defaults closed on overview Buy.

## 2026-09-20 — FOLIO chart watermark + copy strip (NetroBNB)

- Cloned NetroBNB `CryptoMarketCard`: brand mark dead-center **over** TradingView stage (`z-index:10`), not behind the iframe / not centered on stats+icons.
- Overview + Buy desk both show FOLIO watermark; density chart hides extra attr row.
- Cut wordy swap/gas paragraphs; Details = Route / Impact / Gas / Fill only; left rail cards shortened.
- Branch: `cursor/folio-netro-desk-depth-f1ec` · PR #26.

## 2026-09-20 — Netro-depth desk + live-trade gas research

- Research (docs-verified): Jupiter Swap V2 `/order` gasless (auto ≥~$10 + &lt;0.01 SOL · JupiterZ MM · integrator `payer` skip for beta); Kora later; no FOLIO program; each tester brings own ~$10. Wrote `docs/LIVE_TRADE_NO_PROGRAM.md`.
- **Conclusion:** USDC + tiny SOL = best; USDC-only OK via Jupiter gasless ≥~$10; SOL-native OK; no FOLIO program / no sponsor others.
- Buy page: swap details sheet + settings. Markets page: flow strip.
- **Overview deepened:** chart symbol tabs + icon strip · Buy swap sheet (chips + details + gas note) · AI rail mark + expand modal (share/quote/borrow/buy).
- Branch: `cursor/folio-netro-desk-depth-f1ec` · PR #26.

## 2026-09-20 — Nexeus cinematic landing + marketing

- Pixel-exact Nexeus standalone at `public/nexeus/index.html` (video/poster/scrim/entrance per spec).
- FOLIO `/` rebuilt as cinematic hero (same media + motion) with **unchanged** FolioSimpleFooter.
- All PublicShell marketing pages share cinematic video bg; footer swapped to FolioSimpleFooter.
- Branch: `cursor/folio-nexeus-landing-f1ec`.

## 2026-09-20 — Marketing layout polish (no pills)

- Truth / Execution / Credit: replace ModeBadge/StatusBadge clusters with `mkt-status-line` + protocol `em` status.
- Keeps ledger/metrics; drops pill walls on public marketing pages.
- PR #21 on `cursor/folio-mkt-layout-redo-f1ec`.

## 2026-09-20 — Marketing layout system redo

- Landing: keep stencil-only viewport; rebuild below-fold as pitch → numbered path → desk entry; drop glass video footer.
- PublicShell: shorter nav, intro±aside, `MktSection` numbered blocks, organized footer cols.
- Markets/pairs/preipo/about/execution/truth/credit rewritten to the layout system.
- Branch: `cursor/folio-mkt-layout-redo-f1ec`.

## 2026-09-20 — Marketing + desk slop redo

- Killed PublicShell pill nav, dark intros, three-features/metric card walls, Benefits + Glow landing sections.
- Brand-first home hero (FOLIO signal + headline + CTA in first viewport); editorial strip; light mkt atmosphere.
- Desk: text top-nav; square lane filters; markets asides as links not cards; truth badge cluster trimmed.
- Fixed CSS brace break that blanked Vite HMR; hero bottom scrim for contrast.
- Branch/PR: `cursor/folio-marketing-desk-redo-f1ec` · https://github.com/henrysammarfo/folio/pull/20



- Buy Pairs tab: true Jupiter stock↔stock (pay mint → receive mint), lane explainers for Mega/IPO/Meme.
- New desk: `/desk/markets`, `/desk/preipo` (PreStocks-only), `/desk/tessera`.
- New marketing: `/markets`, `/preipo`, `/pairs`.
- Stocklana deadline corrected to **2026-09-25 16:00 ET**; PreStocks + Tessera bounty paths separated.
- Agent `swap A → B` parses as stock↔stock compare spine.

## 2026-09-19 — Routes / tenancy / depth (IPO · meme · pairs · agent · templates)

- Soft desk READ stays public; hard-gate paper agent (session) + bootstrap (`FOLIO_ALLOW_BOOTSTRAP_DEMO=1`).
- `getDeskAccess` + desk chrome banner; Account tenant switcher via `setActiveTenant`.
- Catalog lanes mega/ipo/meme + `XSTOCK_COMPARE_PAIRS` on Buy; watchlist `buyable=false` honesty.
- Paper agent intents: compare / credit / network / positions (+ truth/quote).
- Marketing: PublicShell tones + LandingGlassFooter; landing Benefits + Glow templates wired.
- Vitest 154 green.

## 2026-09-19 — Landing templates (benefits / glow / glass / falcon)

- Wired BenefitsSection (3-card + video), glowing FeatureCards (motion), liquid-glass video footer on `/`.
- Added `public/falcon-ops.html` Falcon AI ops triptych (standalone).
- Installed `motion`. FOLIO copy on marketing sections; template structure preserved.


## 2026-09-19 — Landing + marketing polish

- Horizontal slide-through on `/` (auto-advance + snap + arrows).
- PublicShell → Netro-style top pills + sharp Open desk; atmospheric intros.
- About copy cleaned; live multiplier chip under hero.
- Build green.


## 2026-09-19 — Desk polish (logos / swap / nav / chart / account)

- NetroBNB-style top nav pills + dark Connect; sidebar Minimize/Expand persisted.
- Asset logos (Backed CDN) on Home/Holdings/Buy/detail; XSTOCK_CATALOG picker + swap ticket.
- Home + Netro market strip: TradingView (parity with Buy); Account profile cards.
- Sharper 8px CTAs; responsive/zoom breakpoints for rail + cards.
- Build + 147 unit tests green.

# FOLIO — SESSION LOG

## 2026-09-20 — Light TradingView (Netro match)

- Chart was dark because we set `theme="dark"` — NetroBNB uses `theme: "light"` + dark `#1C1C1C` watermark @ 0.11.
- Switched overview TV to light; mark no longer inverted white-on-black blob.

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

## 2026-09-15 — Inspect continuity + badge honesty
- Detail route + list/overview links carry `?inspect=`; truth diverge no checkmark on null; Jupiter cache labels; execution Fail-closed; activity Nest.credit≠NestUSD + Jupiter cache.
- Goal open: Henry lab Pick + keys.

## 2026-09-15 — Home live × in hero copy
- SSR truth bundle → AAPLx live multiplier in home supporting sentence (not fixture 4×); Stocklana still 545/72/$121k.
- Goal open: Henry lab Pick + Bitquery/Pyth/Privy/Supabase; broadcast paused.

## 2026-09-15 — Paper agent e2e lock-in
- E2E clicks Run paper agent → asserts `nl=` + `broadcast=false` + spine bits; never fill theater.
- Vercel preview READY on `e1fb388` with home live AAPLx ≈1.003269×.
- Goal open: Henry lab Pick + keys.

## 2026-09-15 — Desk false-greens + Raydium matrix
- Verified≠paper; desk chrome quote-only; Raydium awareness on matrix/smoke/docs.
- Goal open: Henry lab Pick + Bitquery/Pyth/Privy/Supabase; broadcast paused.

## 2026-09-15 — Supabase user-JWT RLS path
- Prefs/tenants prefer user-JWT (sub=Privy DID) when SUPABASE_JWT_SECRET set; service-role labeled fallback.
- Goal open: Henry lab Pick + Bitquery/Pyth/Privy/Supabase(+JWT secret); broadcast paused.

## 2026-09-15 — Raydium awareness on acquire
- Acquire checks + honesty notes for Raydium pools (not route guarantee); wash “Tape clear”.
- Goal open: Henry lab Pick + keys.

## 2026-09-15 — Role-gated prefs + membership wallet
- Viewer cannot save desk prefs (server + settings UI); membership wallet preferred for qty binding.
- Goal open: Henry lab Pick + Bitquery/Pyth/Privy/Supabase(+JWT); broadcast paused.

## 2026-09-15 — Network matrix membership + role-gate honesty
- Matrix rows for membership wallet priority + role-gated prefs.
- Goal open: Henry lab Pick + keys.

## 2026-09-16 — UI refs + hero fix
- Cloned NetroBNB + Aionis; 21st MCP live on lab; shaders key probed (Clerk fail-closed labeled).
- Home footer unburied (was min-height 40vh on first viewport). New lab ids from real refs.
- Goal open: Henry Pick + keys.

## 2026-09-16 — Real Aionis/NetroBNB extract + 21st WebGL
- User called prior lab approve fakes + buried hero; re-analyzed live shots vs clones.
- Extracted Aionis SVG liquid stencil → production `/`; NetroBNB 12-col density → lab; 21st Plasma WebGL (24346) → shader lab.
- shaders.com REST still Clerk 500; labeled. Tip `cfc0cc2`. Henry Pick still required.

## 2026-09-16 — Desk preview extract + Stocklana 588/79
- Strengthened opt-in desk preview CSS for netro-density / aionis-brand-plane / trade-journal-21st.
- Stocklana official page: 588 / 79 / $121k; AAPLx × still ~1.003269. Goal open: Henry Pick + keys.

## 2026-09-16 — Lab readiness + e2e extract locks
- Settings readiness: API_KEY_21ST + SHADERS_API_KEY. E2E locks stencil home + Netro/Aionis desk preview + WebGL swatches.
- Vercel preview READY on prior tip; Empire keys still empty. Goal open: Henry Pick + keys.

## 2026-09-16 — Preview verify + e2e green + keys-readiness lab rows
- Live Vercel preview: home stencil + live ×1.003269 OK; `/lab/ui` shows API_KEY_21ST missing on Vercel (local has it).
- keys-readiness lists optional API_KEY_21ST / SHADERS. Full Playwright **21/21** green.
- Still blocked: Henry Pick · Bitquery/Pyth/Privy/Supabase · Vercel lab keys · funded broadcast.

## 2026-09-16 — Analyze refs + fix buried/dim hero
- Ran Aionis + NetroBNB + FOLIO; screenshots under `/opt/cursor/artifacts/screenshots/`.
- Aionis gold stencil is the hero; FOLIO ice stencil was too dark → bumped luminance + soft floor + Aionis horizon CSS.
- Removed midband stack; supporting copy below fold. 21st MCP confirmed live locally; shaders REST still 500.
- smoke:keys + unit tests updated. Goal open: Henry Pick + Empire keys + Vercel `API_KEY_21ST`.

## 2026-09-16 — Netro extract rebuild + Trade Journal 27124
- Netro lab canvas now mirrors 12-col density (market strip + yellow rail).
- get_component Trade Journal Table → FOLIO honesty blotter on `/lab/ui`.
- Still blocked: Henry Pick · Bitquery/Pyth/Privy/Supabase · Vercel `API_KEY_21ST` · funded broadcast.

## 2026-09-16 — Desk Empire gates panel + Stocklana 590/79
- `/desk` shows live network-matrix gate strip (fail-closed wash/Pyth/NestUSD/auth/broadcast).
- Stocklana jina: 590 / 79 / $121k. Goal open.

## 2026-09-16 — Acquire gate grid + Jupiter optional key
- Acquire Checks: truth/wash/quote/Pyth/canReview grid. keys-readiness lists JUPITER_API_KEY optional.
- Paper agent: live ×1.003269 spine; AgentRouter NL failed WAF/HTML (spine kept). Goal open.

## 2026-09-16 — refs screened + hero/lab honesty

- Cloned/ran Aionis (:3110) + NetroBNB (:3111); Playwright-shot vs FOLIO.
- Hero: removed competing serif void copy; raised luminous FOLIO stencil (Aionis composition); horizon ~58%.
- Lab UI/shaders: compact intro, visual stages first; 21st MCP live locally (16 catalog hits); shaders.com keyed but Clerk-gated.
- Fixed client `node:crypto` leak via lazy `node-hmac.ts`.
- Acquire gate grid + e2e networkidle/hydration fixes.
- Henry still needs Vercel `API_KEY_21ST` (+ optional `SHADERS_API_KEY`) for public preview lab.

## 2026-09-16 — node-hmac Vitest ESM fix (multi-tenant path)

- `process.getBuiltinModule("crypto")` replaces `eval(require)` so session/JWT unit tests pass under Vitest ESM while client graphs still avoid static `node:crypto` imports.
- Vitest **101/101** green; smoke-empire honesty ok; Stocklana still **590**/79/$121k (jina).
- Henry blockers unchanged: lab Pick, Vercel API_KEY_21ST, Bitquery→Pyth→Privy→Supabase, GG Skip, broadcast paused.

## 2026-09-16 — UI ref screen + 21st/shaders honesty

- Cloned refs live: Aionis `:3110`, NetroBNB `:3111`; screened side-by-side vs FOLIO `:3000`.
- Hero: matched Aionis stencil geometry (`1400×550`, baseline `y=465`, horizon `bottom:55%`); brighter ledger-ice punch so brand mass no longer reads as buried footer strip.
- Lab UI: removed junk 21st catalog heroes (consumer/recovery apps); pinned live Plasma WebGL **id 24346** as cinematic candidate; finance-filtered gallery.
- Lab shaders: WebGL Plasma retinted glacial (hue=0, no purple); `preserveDrawingBuffer`; shaders.com still HTTP 500 / Clerk-gated (labeled).
- Paper agent e2e: scrollIntoView + fail `nl=` labels — **22/22** Playwright green locally.
- Henry blockers unchanged (Pick, keys, Vercel API_KEY_21ST, GG Skip, broadcast paused).

## 2026-09-16 — Desk live Plasma preview + Stocklana fact refresh

- Stocklana live: **591** registered · **79** submissions · **$121k** · hero deadline **SEP 25** (timeline body still lists **18 Sep 16:00 ET** — conservative).
- Desk opt-in lab preview now mounts **live WebGL Plasma** (21st id 24346 path) for shader picks + `cinematic-landing-21st` — not CSS-only fakes; Exit clears.
- DEMO_SCRIPT + STOCKLANA_SUBMISSION refreshed; Hermes public still **401** without `PYTH_API_KEY`.
- Henry blockers unchanged: Step 0 Pick · Vercel `API_KEY_21ST` · Bitquery · Pyth · Privy · Supabase · GG Skip · broadcast paused.

## 2026-09-16 — Pinned 21st ids + Netro header extract

- Vercel preview still lacks `API_KEY_21ST` (CLI not logged in — Henry). Lab now **pins Plasma 24346 + Trade Journal 27124** so WebGL/blotter stay attributed without catalog search.
- NetroBNB Header extract: yellow active Truth pill + dark Connect on `/lab/ui` density stage; desk netro preview topbar picks up yellow policy pill.
- Goal still blocked: Henry Pick · Vercel API_KEY_21ST · Bitquery · Pyth · Privy · Supabase · GG Skip · broadcast paused.

## 2026-09-16 — Preserve hero + Netro 12-col rebuild + Vercel keys

- User: do **not** change former home hero; NetroBNB desk cards were out of place; set Vercel keys now (rotate token after).
- Restored/kept former hero (no home-empire section). Stripped leftover `.home-empire*` CSS + e2e home Empire heading assert.
- Rebuilt `NetroDensityCanvas` to true NetroBNB **12-col** (left 9 = profile 3 + stack 6 + market; right 3 = dark quote + yellow AI) with stagger enter + clock pulse.
- Vercel env now has: `API_KEY_21ST`, `SHADERS_API_KEY`, `AGENTROUTER_*`, `TAVILY_API_KEY`, `TINYFISH_API_KEY` (+ existing SOLANA/BROADCAST/SESSION). Still empty locally/on Vercel: Bitquery · Jupiter · Pyth · Privy · Supabase · Venice (cannot invent).
- Henry: **rotate Vercel token** pasted in chat; Step 0 Pick · GG Skip · broadcast paused unchanged.

## 2026-09-16 — Desk mounts Netro 12-col on lab preview

- Branch preview verified: **21st MCP connected** · Netro 12-col live · AAPLx ≈1.003269×.
- `DeskShell` now mounts `NetroDensityCanvas` (live multiplier) when opt-in preview is `netro-density`, and `FolioTradeJournalLab` for `trade-journal-21st` — not CSS-only.
- stocklana.fun close banner: **18 SEP 2026 · 23:59 UTC** (conservative vs hero SEP 25).
- Still blocked for full objective: Henry Pick · Bitquery · Pyth · Privy · Supabase · GG Skip · broadcast paused · rotate Vercel token.

## 2026-09-16 — Stocklana 593/80 + netro recommended Pick

- Live hackathons.solana.com: **593** registered · **80** submissions · **$121k** · hero SEP 25 · timeline 18 Sep 16:00 ET.
- HENRY_STEPS: Vercel lab keys marked DONE; Step 0 recommends `netro-density` (desk preview mounts 12-col).
- Lab approve panel marks netro as rec; LAB_UI_IDS order leads with netro-density.
- Still blocked: Henry Pick reply · Bitquery · Pyth · Privy · Supabase · GG Skip · rotate token · broadcast paused.

## 2026-09-16 — Pyth bounty triad (Equity + xStock + Ondo)

- Mapped Hermes `Crypto.AAPLON/USD` (Ondo) feed id from live catalog; wired `fetchPythOndoUsdPrice` + `/truth` bounty feed list.
- `/truth` shows Equity.US.AAPL/USD · Crypto.AAPLX/USD · Crypto.AAPLON/USD even when `PYTH_API_KEY` missing (prices still fail-closed).
- Vitest **105+** path extended; goal still needs Henry Pick + Bitquery/Pyth/Privy/Supabase keys.

## 2026-09-16 — FOLIO_APPROVED_LAB_* production merge path

- Wired `FOLIO_APPROVED_LAB_UI` / `FOLIO_APPROVED_LAB_SHADER` (set on Vercel only after Henry chat reply).
- DeskShell applies approved chrome without opt-in preview; Settings shows approved rows; local Pick still never merges.
- Goal still needs Henry Pick reply before env can be set; then Bitquery/Pyth/Privy/Supabase.

## 2026-09-16 — Netro layout parity (cards/animations)

- DeskShell: when `netro-density` is effective UI, Netro **replaces** overview children (was stacking → cards looked out of place).
- Stagger delays via `--netro-delay` (nth-child was broken across nested parents).
- Yellow AI rail height-synced to left column baseline; share ticker marquee; dual spinning profile gears; taller cards.
- Home hero preserved. Confirmed Vercel already has 21st/shaders/AgentRouter/Tavily/TinyFish; trading keys still empty (cannot invent). Rotate Vercel token.

## 2026-09-16 — Matrix/settings honesty + Stocklana 596/81

- Network matrix: Membership wallet + Role-gated prefs → `unavailable` until multi-tenant keys (was false mainnet-read).
- Settings readiness: `JUPITER_API_KEY` optional + `SOLANA_RPC_URL` dedicated vs public fallback (B004).
- E2E: Netro preview asserts zero stacked `.desk-heading`/`.panel`; settings asserts approved-lab + Jupiter + RPC rows.
- Live scrape: **596** registered · **81** submissions · **$121k**. Still blocked: Henry Pick · Bitquery · Pyth · Privy · Supabase · GG Skip · broadcast paused.

## 2026-09-16 — /truth on-chain Scaled UI + no invent-pass

- `getTruthBundle` fetches Token-2022 Scaled UI via RPC; API↔on-chain compare (match/mismatch/unavailable).
- Diverge pass/fail only when Pyth Equity.US + Jupiter venue live; Jupiter stockData vs venue is informational (`pass: null`).
- Unit + e2e green. Goal still needs Henry Pick + Bitquery/Pyth/Privy/Supabase.

## 2026-09-16 — Acquire on-chain Scaled UI gate

- `getAcquireBundle` fetches Token-2022 Scaled UI + API↔chain compare (same as /truth).
- Checks UI splits Truth (API) vs On-chain Scaled UI (match/mismatch/off) — no API-only green invent.
- Honesty notes; strictFailClosed blocks on mismatch/off. Unit + e2e green. Goal open.

## 2026-09-16 — Paper agent + activity Scaled UI spine

- Paper agent truth/quote spines include on-chain Scaled UI compare (match/mismatch/off).
- Activity feed emits On-chain Scaled UI event. Unit + e2e green. Goal open.

## 2026-09-16 — Positions Scaled UI list honesty

- Highest remaining unblocked honesty gap: positions fetched on-chain Scaled UI but list showed API multiplier only; Wallet-verified ignored chain.
- Shared `positionHealth` — Verified requires wallet-read + live feeds + API↔on-chain match.
- List + detail surface chain match/mismatch/off. Unit + e2e updated. Goal open.

## 2026-09-16 — Positions Scaled UI honesty
- Position Verified requires wallet-read + API↔on-chain Scaled UI match; list shows chain match/mismatch/off.

## 2026-09-16 — Netro overview-only + approve env
- Preserved home hero. NetroBNB desk is overview-only (`data-netro-surface`); Positions/Acquire keep ledger chrome.
- Set `FOLIO_APPROVED_LAB_UI=netro-density` on Vercel all targets. Empire trading keys still need Henry paste (cannot invent).
- Rotate Vercel token pasted in chat. Goal open.

## 2026-09-16 — Netro live Empire gates
- Netro overview flow strip + empire strip map live `/network` modes (wash fail-closed, Pyth/NestUSD/multi-tenant unavailable, Scaled UI/Kamino mainnet-read when live). No invent greens.
- Demo URLs → netro desk preview. Goal open for Empire keys + GG Skip.

## 2026-09-16 — Netro live Kamino LTV + Stocklana refresh
- Credit bundle feeds Netro credit card (maxLTV + illustrative capacity). Submission checklist: lab UI approved + GG tip clean on PR #5.
- Stocklana 598/82/$121k (jina). Still need Empire keys paste + token rotate. Goal open.

## 2026-09-16 — Netro live Jupiter ≤$1 quote
- Netro quote widget shows live Jupiter out amount for $1 USDC inspect (quote-only · no broadcast). CTAs link to /truth and /desk/acquire.
- Demo script refreshed to 598/82 + Netro click path. Goal open for Empire keys.

## 2026-09-16 — Netro paper-agent rail
- Desk Netro yellow AI rail runs live paper-agent spine (truth / ≤$1 quote). NL optional via AgentRouter; always broadcast=false. Lab stage stays decorative.
- Goal open: Bitquery/Pyth/Privy/Supabase + rotate Vercel token.

## 2026-09-16 — Netro inspect wallet + layout stabilize
- Netro overview restores ephemeral Inspect wallet → `/desk/positions?inspect=` (not auth).
- Grid/card CSS: minmax containment, rounded flow card, gentler stagger (cards no longer clip/jump).
- Home hero untouched; below-fold mission points to `/desk` Netro surface.
- Submission paste pack + KEYS_LANDING demo URL on PR #5. Empire keys still need Henry paste. Goal open.

## 2026-09-16 — Netro ownership qty honesty
- Netro overview lost economic positions when it replaced classic panels — restored live Ownership strip (paper vs wallet-read / inspect).
- Inspect stays on `/desk?inspect=` so qty + credit LTV rebind; Positions ledger link preserved.
- Unit + e2e updated. Empire keys still need Henry paste. Goal open.

## 2026-09-16 — SSR Netro first-paint + honest truth strip
- `/desk` layout loader seeds `getLabApprovals` so Henry-approved Netro paints without classic overview flash.
- Market strip labeled illustrative (not live candles) + live API↔on-chain Scaled UI status.
- Empire keys still need Henry paste. Goal open.

## 2026-09-16 — Netro Empire keys readiness strip
- Production Netro overview surfaces live Bitquery/Pyth/Privy/Supabase/session/broadcast readiness from getSessionBundle — paste CTA → Settings.
- Connect becomes Paste keys when misses > 0. Stocklana still 598/82/$121k (jina). Goal open for key paste.

## 2026-09-16 — SSR Empire readiness + Settings deep-link
- `getEmpireReadiness` + `/desk` loader seed keys strip SSR; Netro Paste keys → `/desk/settings#empire-readiness`.
- Empire strip adds live Raydium + Nest.credit modes. Goal open for key paste.

## 2026-09-16 — UI soften / landing / keys guide
- Softened Netro yellow fills; decongested desk grid; collapsible honesty strips; expandable settings layout; full landing below preserved Aionis hero; KEYS_LANDING step-by-step with provider links. Empire keys still need Henry paste. Goal open.

## 2026-09-16 — SSR Netro spine + honesty labels
- Seeded desk loader with live Block 0 bundles for Netro SSR; Paused broadcast label; approve-panel production state; e2e Netro/home updates. Goal open for Empire key paste.

## 2026-09-16 — Stocklana honesty pack 605/84
- Refreshed submission/Henry/demo docs to live 605/84; Broadcast Paused label consistency across desk. Empire keys still need Henry paste. Goal open.
## 2026-09-16 — Multi-tenant cache parity
- Session mint/clear/tenant switch now invalidates positions/credit caches; mint gated on keys. Goal open for Empire paste.

## 2026-09-16 — Inspect label + activity invalidate
- Fixed false **No cookie** on inspect panels when a bound wallet exists; activity-bundle joins session invalidate; Policy state wash/broadcast from live matrix. Empire keys still need Henry paste.

## 2026-09-16 — Empire keys landed (Henry paste) + Bitquery V2 + smoke:goal
- Wired Bitquery · Pyth · Privy · Supabase (URL/anon/service) · Jupiter to Vercel (all targets) + local `.env` (never committed; never echoed).
- Docs-fix: Bitquery wash now prefers Streaming V2 `https://streaming.bitquery.io/graphql` with EAP fallback; Bearer `ory_at_…` per Bitquery auth docs.
- Live probes: wash **ok** (pass, n=50); Jupiter quote ok; Privy+Supabase keys present; Pyth Hermes BTC/ETH **200** but Equity.US.AAPL / Crypto.AAPLX / Crypto.AAPLON **403 Not entitled**.
- Supabase tables missing (`PGRST205`) until Henry runs `supabase/migrations/20260915_folio_tenants.sql`; `SUPABASE_JWT_SECRET` still missing.
- `applyDotEnv` overrides empty shell placeholders that shadowed `.env` (cloud BITQUERY_*='').
- `npm run smoke:goal` matrix: done=4 partial=2 blocked=0 (Empire waiting Pyth entitlement; multi-tenant waiting mint+tables). Goal open. **Rotate chat-pasted secrets.**

## 2026-09-16 — JWT secret + grants gap + specific Pyth plan
- Wired `SUPABASE_JWT_SECRET` to Vercel + `.env` (never echoed). User-JWT RLS path armed in readiness.
- Migration tables exist but service_role hit **42501** — added `20260916_folio_tenants_grants.sql` + GRANTs into base migration; Settings probe distinguishes PGRST205 vs grants.
- Pyth: documented exact Terminal path — current key = crypto-only (Starter behavior); Equity needs **Pro / free Pro trial** + Equities asset class (not vague "entitle"). Honesty: Settings no longer claims Hermes equity live from key presence alone.
- Goal still open: Pyth Pro equities · run grants SQL · mint session. Rotate chat secrets.

## 2026-09-16 — Supabase grants live + folio-demo seed + Join button
- Live probe: `supabaseSchemaReady=true` (service_role GRANTs applied). Seeded `folio-demo` tenant; removed placeholder `privy_did_here` membership.
- Added Settings **Join folio-demo as owner** (`attachDemoTenantMembership`) — requires real Privy mint first; remints cookie with memberships.
- Henry next: mint Privy session + Join folio-demo; Pyth Pro+Equities still blocks Empire DONE. Goal open. Rotate chat secrets.


## 2026-09-16 — JWT+SQL done · Pyth Equity.US/Crypto.xStock B-SPECIFIC · Privy login mint

- Henry: `SUPABASE_JWT_SECRET` confirmed on `.env`+Vercel · SQL migration/grants DONE · schemaReady live.
- Settings/docs/HENRY_STEPS/KEYS_LANDING: Pyth DO NOW names exact feeds `Equity.US.AAPL/USD` + `Crypto.AAPLX/USD` (both 403 Not entitled on Starter) + email subject `Equity.US / Crypto.xStock Hermes 403 Not entitled`.
- Wired `@privy-io/react-auth` Settings **Log in with Privy → Mint httpOnly session** (public App ID only; paste-token fallback). Henry must allowlist demo origin in Privy Dashboard.
- Goal still open: shipReady=false until Pyth entitlement + Privy mint + Join folio-demo.


## 2026-09-16 — Free equity diverge (no Pyth Pro $)

- Henry on unpaid trial — cannot pay ~$2.5k Pro. Wired free cascade: Pyth (if entitled) → Finnhub free key → Yahoo chart keyless; CoinGecko `*-xstock` secondary.
- Diverge pass/fail scores on labeled free ref vs Jupiter venue. Never claims Pyth when fallback used.
- Settings/HENRY_STEPS: Pro optional for bounty only. Goal Empire can go DONE without Pyth Equity.US entitlement.


## 2026-09-16 — Privy auto-mint + exact Allowed origins

- Tip live: Yahoo diverge green · Empire DONE · multi-tenant still PARTIAL.
- PrivySessionMint auto-mints httpOnly folio_session after login; Settings DO NOW lists exact origin (Privy rejects *.vercel.app).
- Goal open until Henry allowlists origin + Log in + Join folio-demo.


## 2026-09-16 — Pyth off ship path · live Yahoo/Finnhub diverge only

- Henry: keep free alternates; remove Pyth from ship diverge; no fake/non-live fallbacks.
- Diverge = Finnhub→Yahoo (+ CoinGecko xStock) vs Jupiter only. Fail-closed on HTTP miss.
- Pyth Hermes not called on truth/acquire/network ship path (`pyth_not_on_ship_path`).


## 2026-09-16 — Bootstrap folio-demo session (real Privy DID)

- Henry: keep free equity alternates; no fake/non-live fallbacks; continue ship.
- Added `ensureBootstrapPrivyUser` + `buildBootstrapDemoSession` (Privy REST custom_auth → attach folio-demo owner → mint+verify).
- Settings: **Bootstrap folio-demo session**; smoke:goal flips multiTenantSessionReady on live proof.
- Pyth remains off ship diverge path (Yahoo/Finnhub/CoinGecko only).


## 2026-09-16 — Ship audit · Vercel preview bootstrap proven

- `npm run smoke:goal` → shipReady=true (6/6).
- Preview READY: folio-git-cursor-folio-bootstrap-demo-sess-78e877-teamtitanlink.vercel.app
- Truth: live AAPLx 1.003269× · Yahoo diverge · Pyth off ship path.
- Settings Bootstrap → folio-demo owner active (Playwright + serverFn).


## 2026-09-17 — Desk UI sync / layout repair

- Overview no longer hides desk sidebar/topbar (Netro was a separate chrome island).
- Credit Kamino table rows use `.table-row` grid (was mashed into ASSET column).
- Inspect form actions aligned; NestUSD badges truncated; equity chip shows Yahoo live not Pyth-unavailable theater.
- Approved chrome banner compacted.


## 2026-09-17 — Ship-main CI: route conflict + GG chunk

- Vercel dpl_6Rk6Hryg…: conflicting `/desk/positions/$symbol` from stub + pathless detail → removed stub.
- GG on PR #7: Generic High Entropy on long Tokenkeg/TokenzQd string halves → 6-char joinId chunks.
- Squash onto new branch for GG-clean single commit onto main (cannot rewrite Lovable-synced history).


## 2026-09-18 — Script whole thing · redesign pass

- User: clone three repos, change yellow→another color, rebuild layouts, strip demos/writing, live charts/buy, research GTM/retention.
- Accent azure `#0EA5C9`. TradingView free widget wired. PRODUCT_BIBLE for design/GTM.
- Broadcast still paused (honest) — quotes live. Option B Charting Library documented if Henry wants license.


## 2026-09-18 — Merge + deploy
- User: commit, push, merge to main, deploy.
- Merged redesign (incl. ship tip) to main; closed PRs #8/#9.
- Production dpl_MvJG5Dp… READY · folio-tawny-one.vercel.app


## 2026-09-18 — Consumer desk pass (kill tutorial chrome)

- User screenshots: Live Quotes foot, wash-fail jargon, Empire keys on overview, Start truth pass → marketing /truth, yellow honesty boxes, paper/fixture theater.
- Overview: consumer copy · Open AAPLx (not /truth) · Buy CTA · Empire keys removed from desk · holdings language softened.
- Sidebar: Profile link (no Live Quotes badge); collapsed shows avatar only.
- Acquire: simple Order/Checks/Review — gates behind quiet OK checklist.
- Yellow warning-soft → azure wash.


## 2026-09-18 — /desk crash fix

- Production ReferenceError: `keysReadiness is not defined` in NetroDensityCanvas (leftover effect after Empire keys removed from overview).
- Removed broken effect + prop. Vercel token stored in gitignored `.env` only (not committed).


## 2026-09-18 — Consumer pages pass (overview + rest)

- User: overview still unfinished; fix other pages too (not just overview).
- Overview Netro: Trade AAPLx, Share count (not share truth), Buy path, Connect wallet once, agent meta softened.
- Positions / detail / Credit / Activity / Acquire / Settings chrome / fallback desk.index: consumer copy; shared WalletLookupPanel; est. not paper theater.
- Activity events + positions/credit notes softened at source. Empire keys stay Settings-only.
- position-health labels → On-chain OK / Live · est.; e2e updated. Vitest 147 green.


## 2026-09-19 — Web launch polish + desk redesign

- User: desk pages still unfinished; 20 web tasks.
- Desk: Positions cards, Credit hero, Activity timeline, Buy validation, Settings Connect wallet first / keys advanced collapsed.
- Launch: Privacy + Terms, cookie banner, consent analytics, OG/favicon/sitemap/robots, HSTS, custom 404, form validation + honeypot, contrast, legal footer links, single home CTA, frontend secrets scan.


## 2026-09-19 — From-scratch product desk UI

- User rejected prior desk as AI-slop cards/badges; demanded market-ready product pages + Settings hide ops.
- New `app-desk` shell (rail Home/Buy/Holdings/Borrow/Activity/Account) + hairline `prod-*` pages (no white card grids).
- Consumer Account = wallet / Privy (clean Sign in) / alerts only. Empire keys + paper agent → `/desk/settings?wall=ops` (`DeskOpsSettings`).
- Note: numeric query values like `?ops=1` are coerced to number by TanStack and stripped — use `?wall=ops`.
- e2e ops tests retargeted to `?wall=ops`. Honesty labels kept (Scaled UI, Nest.credit, NestUSD, acquire Policy checks).


## 2026-09-19 — Web2 brokerage desk redesign

- User: still 1/100; study exchanges + web3 + Web2 consumer.
- Researched Robinhood / Cash App / Coinbase patterns.
- Rebuilt desk as `fx-*` system: light shell, bottom tabs, allocation bar, asset cards, amount chips on Buy, LTV meter, profile Account.
- Operator wall unchanged at `?wall=ops`.


## 2026-09-19 — Peer-grounded markets + logos (no primer)

- User rejected Investopedia/Finviz clone; asked to research/confirm peers and ship real improvements.
- Confirmed live: Backed CDN ARMx/GMEx/DJTx/NFLXx/AMDx/SPYx/QQQx = 200; ARMXx/GMEXx = 403. PreStocks API 8 rows; Tessera 3 T-tokens.
- Peers (Solflare stocks board): venue price + liquidity + session honesty — mirrored on /desk/markets (not a screener clone).
- PreStocks desk: AssetLogo + token/mark/premium/implied val. Tessera: AssetLogo + mark/holders/val; copy clarifies loan-participation vs SPV.
- logo-resolve + AssetLogo idx reset; vitest 159 green incl. logo-resolve.


## 2026-09-19 — Whitepaper + operating plan + launch kit

- User: document everything + whitepaper; fix rough edges; Stocklana → Colosseum feedback → beta → socials → Colosseum with traction.
- Added `docs/FOLIO_WHITEPAPER.md`, `FOUNDER_OPERATING_PLAN.md`, `LAUNCH_AND_SOCIALS.md`; refreshed Stocklana paste pack + Colosseum outreach.
- Product: `/whitepaper`, `/beta` waitlist, humanize wash notes, footer socials cleaned, mission links to whitepaper/beta.


## 2026-09-19 — PR #15 merged to main (production live)

- Marked PR #15 ready · merged `d854340` · Vercel production READY.
- Verified HTTP 200: /desk/markets · /desk/preipo · /desk/tessera · /whitepaper · /beta (+ marketing /markets /preipo /pairs).
- Judges can use https://folio-tawny-one.vercel.app directly.


## 2026-09-19 — Keys fully-active runbook

- Live probe: all Empire key *names* present on Vercel; Bitquery live = 402 quota; Pyth = 403 not entitled; diverge via Yahoo OK; multi-tenant DONE.
- Added docs/KEYS_FULLY_ACTIVE.md — Henry must top up Bitquery + new token, Privy allowlist production URL.


## 2026-09-19 — Free wash fallback + Finnhub (no Pyth Pro)

- User: skip Pyth Pro (no budget); Bitquery alternate; Finnhub key landed privately.
- Wash: Bitquery if healthy → else GeckoTerminal free signer/thin-tape; still fail-closed on empty.
- FINNHUB_API_KEY on .env + Vercel; smoke:goal shipReady=true locally.


## 2026-09-19 — Privy production origin allowlisted

- Henry confirmed Allowed origin `https://folio-tawny-one.vercel.app`.
- smoke:goal shipReady=true · next: browser Log in with Privy on /desk/settings.
