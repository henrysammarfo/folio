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
