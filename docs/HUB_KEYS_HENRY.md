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

---

## 1 — Phantom App ID (embedded Google / Apple)

**Portal status:** new Portal apps are **paused**. Injected Phantom extension already works in FOLIO without an App ID.

Only if you already have a Portal app:

1. Open https://phantom.app/portal  
2. Sign in with the **same Google/Apple** used when the app was created.  
3. Open the app → **Set Up** → copy **App ID**.  
4. Vercel → `PHANTOM_APP_ID` = that value (Preview + Production).  
5. Add allowed origins: your prod URL + preview URL.  
6. Redeploy.

If you have **no** Portal account yet: skip App ID. Extension “Connect Phantom” still works. Embedded social waits until Portal reopens.

---

## 2 — Reflect API key (optional)

Public reads already work (no key). Key raises rate limits and unlocks integrator write helpers.

1. Open https://docs.reflect.money/developers and https://reflect.money  
2. Reflect is **closed beta** for integrators — you initialize an integration on-chain, then reveal the key with a signed message (`POST /integration/api-key/reveal`).  
3. If they approve you: copy key → Vercel `REFLECT_API_KEY`.  
4. Desk “Earn with Reflect” already opens Reflect for user-signed mint/earn without FOLIO holding funds.

If beta blocks you: leave key unset. Public credit rail stays live; write stays on Reflect’s site with your wallet.

---

## 3 — Squads vault (+ Altitude later)

1. Open https://app.squads.so/ (mainnet) or https://v4.squads.so/  
2. Connect Phantom → **Create Squad** (name, members, threshold).  
3. Sign the create tx (needs a little SOL for rent/gas).  
4. Open **Info / Vault** → copy the **vault address** (not just the Squad name).  
5. Vercel → `FOLIO_SQUADS_VAULT` = that pubkey.  
6. Deposit SOL/USDC you want as treasury.  
7. Only when you are ready for FOLIO to treat treasury as funded: `FOLIO_TREASURY_FUNDED=true`  
   Optional: `FOLIO_TREASURY_SOL_THRESHOLD=0.05`  
8. Redeploy. Matrix row flips when vault reads and the funded flag is true.

**Altitude:** https://altitude.xyz — business account on Squads rails. Create/login there when you want ops banking; paste that account’s Solana vault the same way if it exposes a vault pubkey. No separate Altitude API key is required for FOLIO’s vault balance read.

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
