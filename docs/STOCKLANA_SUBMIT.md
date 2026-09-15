# FOLIO — Stocklana submit checklist

Deadline: **2026-09-18 20:00 UTC** · Budget: ≤~$1 · Broadcast: paused

## Before submit

- [ ] Re-check Stocklana registration counts live (do not invent) — last check 2026-09-15: **528 registered**, **67 submissions**, **$115k** hero pool (main track $100k + bounties), deadline **re-check live** (hero SEP 25 / timeline may still say 18 Sep 20:00 UTC)
- [ ] Demo URL reachable (Block 0 spine) — Vercel project `folio` (`prj_pzvYDMnYiSDcJNsv5NCdy5UVeExq`); preview alias `folio-git-cursor-folio-wallet-read-f1ec-teamtitanlink.vercel.app` after green build; set `SOLANA_RPC_URL`, `FOLIO_SESSION_SECRET`, `BROADCAST_PAUSED=true` in Vercel env (do not commit secrets)
- [ ] Replay green locally:

```bash
npm run replay
# equivalent: npm test && npm run test:e2e && npx tsx scripts/smoke-empire.mts && npm run build
```

- [ ] Pitch order locked (truth → wash → buy → credit → agent) — see `docs/DEMO_SCRIPT.md`
- [ ] Mode badges visible on `/truth`, `/desk/acquire`, `/network`, `/desk/credit`
- [ ] Wash fail-closed without Bitquery (Continue disabled)
- [ ] No “unhackable” / nation-state claims anywhere
- [ ] No claim of mainnet fill / mint / borrow unless actually funded + confirmed
- [ ] `.env` keys never committed; rotate any chat-pasted secrets after hackathon

## Keys to land (Henry)

| Key | Unlocks |
|---|---|
| `BITQUERY_API_KEY` | Live wash tape (still heuristic) |
| `PRIVY_APP_ID` + `PRIVY_APP_SECRET` | Wallet identity |
| `SUPABASE_*` + migration applied | Tenant memberships / prefs |
| `FOLIO_SESSION_SECRET` (≥16) | httpOnly `folio_session` mint/verify + watch-wallet cookie |
| Optional `JUPITER_API_KEY` | If quote/price becomes gated |

## UI approve gate

- Candidates only on `/lab/shaders` and `/lab/ui`
- Reply with a candidate id to merge into production chrome
- Production hero media stays locked until then

## After Stocklana

- Colosseum World’s Fair uses the **same** mainnet-read + quote-only honesty posture
- Still no custom mainnet program deploy on ≤~$1
