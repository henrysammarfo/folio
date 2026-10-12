# FOLIO — Hub keys & IDs (Henry steps)

Paste into Vercel **Preview + Production** (+ local `.env`). Never commit values. Do **not** paste secrets into chat — reply “set” when done.

Vercel env UI: https://vercel.com/teamtitanlink/folio/settings/environment-variables

**Already on Vercel (names only):** Privy, Supabase, Jupiter, Bitquery, session secret, Solana RPC, broadcast paused.  
**Missing for hub sponsors:** `PHANTOM_APP_ID` · `REFLECT_API_KEY` (optional) · `FOLIO_SQUADS_VAULT` · `FOLIO_TREASURY_FUNDED`.

---

## Why Squads / Altitude shows unavailable

FOLIO looks for env `FOLIO_SQUADS_VAULT` (your Squads vault pubkey).  
If it is missing, the matrix stays unavailable on purpose — we never invent a treasury.  
Altitude is Squads’ business account product; same vault idea. After you create a Squad and fund it, paste the vault address and (only when you mean it) set `FOLIO_TREASURY_FUNDED=true`.

---

## Tokens / SOL for deploy

I **cannot** mint or send you mainnet SOL from this agent.  
Custom program deploy stays out of the ≤~$1 budget.  
What you need for **write** paths (you sign, not FOLIO):

| Need | Amount (guide) | Why |
|------|----------------|-----|
| Wallet SOL for gas | ~0.05–0.2 SOL | Phantom connect, Reflect mint, Meteora trade, Squads create |
| Squads vault seed | ~0.05+ SOL | Create Squad + deposit so `FOLIO_SQUADS_VAULT` has balance |
| Reflect mint | USDC in wallet | Earn / mint USDC+ (user-signed) |

Buy SOL on an exchange → send to your Phantom, or use Phantom’s buy flow.

### Email / Open App users (customer loophole — fixed in desk)

Email sign-up creates an **embedded Solana wallet with 0 SOL**.  
Meteora Trade · Reflect earn/mint · Kamino/NestUSD borrow are **their apps + your wallet** — they fail without fees.

Desk now shows a **gas ready** strip on Buy / Borrow / Launches / Account with **Add SOL** (Privy fund) + copy-paste address.  
CTAs label “needs SOL” when balance &lt; ~0.01. FOLIO still does **not** sponsor gas.

**Henry (Privy dashboard) — how to enable Add SOL:**

1. Open https://dashboard.privy.io/ → select the **FOLIO** app (same App ID as `PRIVY_APP_ID`).
2. Left nav → **Funding** (sometimes labeled Account Funding / Onramps).
3. Turn **on** at least one method that can land **SOL on Solana**:
   - **Card onramps** (easiest for email users) — MoonPay / Stripe toggles. Leave on; save.
   - Optional later: Exchange (Coinbase Onramp keys) or Bank (Bridge keys) — not required for Stocklana week.
4. Confirm **Allowed Origins** still include prod + preview (`https://folio-tawny-one.vercel.app` and your Vercel preview URL).
5. Redeploy / hard-refresh desk → Account or Launches → **Add SOL** should open Privy’s fund modal.

If the modal is empty or errors: card onramps aren’t enabled for that app, or origin isn’t allowlisted. Users can still send ~0.05 SOL manually to the address shown under the button (desk always shows that fallback).

Docs: https://docs.privy.io/wallets/funding/configuration · Solana fund hook: https://docs.privy.io/wallets/funding/legacy/solana

---

## 1 — Phantom App ID → **SKIP**

You cannot sign up (Portal new apps paused). That is fine.

- Leave `PHANTOM_APP_ID` unset.
- Desk **Connect Phantom** uses the browser extension (wallet `4HMZ…fWqm` style) — no App ID.
- Google/Apple embedded Phantom waits until Portal reopens. Privy still covers email login.

---

## 2 — Reflect API key → **SKIP for now** (optional later)

Your pasted docs match what we wired:

- **Reads:** open, no key (`curl https://prod.api.reflect.money/stablecoin/apy` / health / types / stats). FOLIO credit rail already uses this.
- **Key:** only after closed-beta integrator setup (`POST /integration/initialize/flow` → sign tx → `POST /integration/api-key/reveal`). That creates a **branded mint** and needs SOL for rent + you as fee payer. Skip until after World’s Fair submit unless you want whitelabel now.
- **Write for users today:** desk **Earn with Reflect** → they open Reflect and sign with their wallet. No FOLIO `REFLECT_API_KEY` required.

Leave `REFLECT_API_KEY` unset.

---

## 3 — Squads vault (you are here — screenshot)

Wallet connected (`4HMZ…fWqm`). Form = **Squad Details** (step 1 of 3).

1. **Squad name:** e.g. `FOLIO` (public onchain — short is fine).  
2. Optional description under 64 chars, or leave blank.  
3. Click **Next**.  
4. **Members & Threshold:** keep yourself as member; threshold `1 of 1` for solo founder (or 2-of-N if you add someone).  
5. **Review** → confirm → **sign** in Phantom (needs a little SOL for rent/gas).  
6. After create: open the Squad → **Vault** or **Info** → copy the **vault address** (long base58 pubkey).  
7. Vercel → Environment Variables → `FOLIO_SQUADS_VAULT` = that address (Preview + Production).  
8. Deposit a little SOL into the vault (Deposit button).  
9. Only when you want FOLIO to treat treasury as funded: also set `FOLIO_TREASURY_FUNDED=true`.  
10. Redeploy. Reply in chat: `Squads vault: set` (no address in chat if you prefer — or paste the vault pubkey only, not seed phrases).

**Altitude:** later at https://altitude.xyz — same family as Squads; not required to green the matrix today.

---

## 4 — Keep these green (already mostly set)

| Env | Dashboard |
|-----|-----------|
| `PRIVY_APP_ID` / `PRIVY_APP_SECRET` | https://dashboard.privy.io/ — add Allowed Origins for prod + preview |
| Supabase quartet + JWT | https://supabase.com/dashboard |
| `JUPITER_API_KEY` | https://portal.jup.ag/ (optional) |
| `BITQUERY_API_KEY` | https://account.bitquery.io/ |
| `SOLANA_RPC_URL` | Helius https://www.helius.dev/ (or keep public fallback) |
| `BROADCAST_PAUSED` | Keep `true` until you want user-signed Jupiter fills armed |

---

## Reply format (no secrets in chat)

```
Phantom: set | skip (no portal app)
Reflect key: set | skip
Squads vault: set
Treasury funded: true | false
SOL for gas: ready (~0.1 SOL in my Phantom)
```

Then ask for a redeploy check on `/desk/settings`, `/desk/dbc`, `/network`.
