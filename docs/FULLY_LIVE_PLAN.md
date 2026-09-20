# FOLIO — Fully Live Plan (Henry approval gate)

> Drafted 2026-09-20 · **Do not implement until Henry says go on each phase**  
> Stocklana paste pack: **deferred** (yes later, not now)  
> Doctrine: never claim unhackable · honesty over theater · Web2 polish + Web3 custody

---

## What you asked (locked intent)

| Ask | Status in this plan |
|---|---|
| Swap V2 + **fully live** $10 arm (fills) | **Phase A** — after you approve this plan |
| Capsule / smart account via email | **Phase B** — use **Privy embedded Solana** (not Capsule/Para unless you switch vendors) |
| Connect existing Phantom/Solflare + later link wallet to email account | **Phase B** |
| Backup / password / export key + seed → other wallets | **Phase B** (Privy `exportWallet` / seed docs) |
| Settings = consumer product (no API key theater) | **Phase C** |
| Routes protected · rate limits per user · fast · consistent nav | **Phase D** |
| Partner charts (PreStocks / Tessera) used meaningfully | **Phase E** |
| Closed beta page usable (visible type + Join) | **Phase F** |
| Analytics per page/click/feature + admin | **Phase G** |
| Stocklana paste pack against live prod | **Deferred** until you say yes |
| Research judges / X / Google stock questions | Done below — drives product copy + partner use |

---

## Honest audit (what is true today — not vibes)

### Live / wired
- Jupiter **quote** works — but via **`api.jup.ag/swap/v1/quote`** (legacy), not Swap V2 `/order`+`/execute`.
- Bitquery wash, Scaled UI, Kamino credit reads, PreStocks + Tessera desks exist as routes.
- Privy → httpOnly `folio_session` mint path exists on Settings.
- Netro desk chrome + light TradingView + FOLIO watermark on prod.
- Cookie-gated **Vercel Analytics** only (page views) — not product analytics.

### Not fully live (gaps that would fail a “fully live” claim)
1. **No broadcast / no `/execute`** — Buy still quote-only; `BROADCAST_PAUSED` policy.
2. **No Swap V2 order path** — gasless honesty flags (`gasless`, `signatureFeePayer`) not surfaced from `/order`.
3. **Desk routes are soft-open** — `/desk/*` does not hard-gate on `folio_session` (inspect/demo paths leak by design today).
4. **Settings shows ops keys** (`BITQUERY_API_KEY`, `PYTH_API_KEY`, lab keys) — not a shipped consumer app.
5. **Beta waitlist = `localStorage` only** — no server, no email capture, form contrast issues reported.
6. **No per-user rate limit** on serverFns — Jupiter has TTL/429 cache; user/IP quotas missing.
7. **Partner desks underused** — PreStocks/Tessera are side routes; overview/Buy/markets do not treat them as first-class lanes or truth stories.
8. **Analytics** — no per-user, per-button, feature funnel, or admin dashboard.
9. **Capsule** — not in repo. Capsule → **Para** (MPC). FOLIO is on **Privy**. Plan stays Privy unless you explicitly switch.

### Research that must shape the build (not ignore)

**Jupiter (docs-verified)**  
- Happy path: `GET /swap/v2/order` → user signs → `POST /swap/v2/execute` + `requestId`.  
- Gasless paths: auto (≥~$10 + low SOL), JupiterZ MM, integrator `payer` (skip for beta — we’d sponsor others).  
- Reliable check: `signatureFeePayer == taker` ⇒ user-paid gas.  
- `/execute` has its own RPS bucket — plan rate limits around that.

**Auth / smart account**  
- Privy embedded Solana = email → wallet (TEE / share split). Export via `useExportWallet` (Base58 key) + HD seed export docs.  
- External wallet: Privy `login` / connect Phantom etc.  
- Later link: Privy linked accounts (email user links external wallet).  
- Capsule/Para = different vendor — only if you decide to migrate.

**Stocklana judges (hackathons.solana.com)**  
- “Could this be a real app people use?” · working demo · Solana-native · execution quality.  
- Working happy path > slides. Fake fills hurt.

**Colosseum World’s Fair**  
- Founder criteria: insight, execution, market, communication, traction — not “grade my code.”  
- Build in public; silent teams look abandoned.

**What people actually ask about xStocks (Reddit / guides)**  
- Liquidity / spreads · dividends vs Scaled UI · freeze/mint authority · “is this real shares?” · who can’t use a US broker · 24/7 + DeFi collateral.  
→ FOLIO wedge must answer: **honest share count (Scaled UI)** · **refuse wash** · **clear route** · **borrow without selling** · plain language for Web2.

---

## Phased plan (approve phase-by-phase)

### Phase A — Fully live $10 trade arm (Swap V2)

**Status (2026-09-20):** `/order` in adapter · `/execute` serverFn gated · wallet sign = Phase B · `docs/ECOSYSTEM_FIELD.md` (Uniswap/Ondo/Dinari/…).

**Goal:** One happy path: signed-in user buys ~$10 USDC→xStock on mainnet with honest gas labeling. No FOLIO program. No integrator `payer`.

1. Migrate quote adapter `swap/v1/quote` → `swap/v2/order` (quote+tx assembly).  
2. Surface: out amount, impact, `gasless`, `signatureFeePayer`, router winner.  
3. Wire `/execute` behind explicit **Arm fills** (settings or env) — default still paused until you flip.  
4. Wallet sign via Privy embedded **or** connected Phantom.  
5. Min size honesty: sub-$10 may quote but fail auto-gasless — UI says so.  
6. Tests: quote fail-closed · execute refused when paused · execute path unit with mocked Jupiter.  
7. Threat note: residual MEV/slippage/issuer freeze — never “safe forever.”

**Henry gate before A ships live:** confirm `BROADCAST_PAUSED=false` (or arm flag) on a **preview** first, then prod.

### Phase B — Open App auth (Web2 + Web3)
**Goal:** Open App → Privy modal. Two doors + later link.

| Persona | Flow |
|---|---|
| New / email-first | Email (or social) → Privy creates **embedded Solana wallet** → `folio_session` |
| Already has wallet | Connect Phantom / Solflare / etc. → session |
| Email user later | Advanced: **Link wallet** to same Privy user |
| Custody escape | Advanced: backup / password recovery · **Export private key** · seed if available · warnings before reveal |

Settings/Account becomes the home for: profile, linked wallets, backup, export, network mode — **not** API keys.

### Phase C — Consumer Settings + copy cleanup
- Split **Account** (user) vs **Ops** (you only — hide behind `FOLIO_OPS=1` or role).  
- Remove key names / “fail-closed BITQUERY” from consumer UI.  
- Positions / fills / credit cards: professional copy, no lab jargon.  
- Every settings control audited: if it doesn’t do anything, remove or wire it.

### Phase D — Route protection · rate limits · speed
- Hard-gate private desk actions (buy execute, prefs write, agent) on verified `folio_session`.  
- Public READ (truth multipliers, markets list) can stay soft with labels.  
- Per-user + IP rate limits on: quote, execute, agent, waitlist.  
- Consistent nav (Open App / Desk / Account) — one mental model.  
- Cache + parallel loaders; kill duplicate fetches.

### Phase E — Partner charts (PreStocks + Tessera) — rethink
**Problem:** desks exist; overview doesn’t use them as product story.

Meaningful use (proposal — pick on approve):
1. **Overview lane chips:** Mega / IPO / Meme / **Pre-IPO** / **Tessera** — selecting Pre-IPO loads PreStocks catalog + premium vs mark; Tessera loads T-token loan participation (honest: not share equity).  
2. **Truth strip:** for PreStocks show mark/token/premium; for Tessera show structure label + quote — not fake Scaled UI.  
3. **Buy sheet:** same component, different mint source + honesty footer (“SPV exposure” / “loan participation”).  
4. **Wash + Jupiter** still gate review.  
5. Stocklana bounty tracks: keep desks separate URLs for judges, but **linked from overview** so demos aren’t “orphan pages.”

### Phase F — Closed beta page
- Fix contrast (input + Join visible on cinematic bg).  
- Replace localStorage with server waitlist (Supabase table or email provider).  
- Confirmation state that actually persists.

### Phase G — Product analytics + admin
- Event schema: `page_view` · `cta_click` · `buy_review` · `buy_execute` · `agent_ask` · `wallet_connect` · `export_wallet` · partner lane switches.  
- Identity: hashed user id when sessioned; anonymous id otherwise.  
- Consent-gated.  
- Admin `/desk/admin` (ops role only): funnels, top features, error rates — not raw PII.

### Deferred — Stocklana paste pack
When you say go: live prod checklist + submit URLs against judging criteria (working demo, Solana-native, honesty).

---

## Suggested order (after you approve)

```
A (Swap V2 + arm on preview) 
 → B (Open App / Privy doors / export) 
 → C (consumer settings cleanup) 
 → D (guards + rate limits) 
 → E (partner lanes in overview) 
 → F (beta page) 
 → G (analytics + admin)
 → [later] Stocklana paste pack
```

You can reorder. **Do not skip A’s preview arm** before prod fills.

---

## Explicit non-goals (unless you override)

- Deploying a FOLIO on-chain program  
- Integrator Jupiter `payer` sponsoring other testers’ gas  
- Claiming unhackable / NK-proof  
- Showing API keys in consumer Settings  
- Migrating to Capsule/Para without a vendor decision  

---

## Henry reply needed

Reply with which phases to start (e.g. `A only` · `A+B` · `reorder E before C`) and whether fills arm on **preview only** first.
