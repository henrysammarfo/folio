# FOLIO — BUGS / RELIABILITY

## Open

| ID | Severity | Note |
|---|---|---|
| B002 | Med | AgentRouter may return Aliyun WAF HTML from some cloud IPs — treat non-JSON as fail-closed. |
| B003 | Med | TinyFish Agent automation needs credits; Search path preferred. |
| B004 | Med | Public Solana RPC may rate-limit — prefer dedicated `SOLANA_RPC_URL` when provided. |
| B006 | Med | Privy/Supabase/Bitquery/Pyth keys still empty — wash + Hermes diverge + multi-tenant sessions stay fail-closed until Henry lands keys. Watch-wallet mainnet-read qty path works with FOLIO_SESSION_SECRET alone (not multi-tenant auth); secret is set on Vercel. |
| B007 | Low | Premium UI candidates remain on `/lab/*` until Henry approves an id. |
| B013 | Med | Fixed: Privy session mint no longer treats tenant lookup errors as empty memberships — fail-closed instead.\n| B011 | Med | Hermes `/v2/updates/price/latest` requires `PYTH_API_KEY` since Aug 2026 — adapter fail-closes without it. |

## Closed

| ID | Note |
|---|---|
| B001 | Live adapters replace fixture multipliers on desk/truth/acquire (paper qty still labeled paper). |
| B005 | Yahoo Finance path removed (`prices.functions` / `use-prices`) — not xStocks truth. |
| B008 | Acquire `canReview` now requires divergeOk in addition to truth/wash/quote. |
| B009 | Broadcast pause unified via `isBroadcastPaused()` for network + session bundles. |
| B010 | Positions auth badge uses `sessionReady`, not keys-only. |
| B012 | Vercel `FOLIO_SESSION_SECRET` + `BROADCAST_PAUSED` + `SOLANA_RPC_URL` set; watch-wallet bind live-verified. |
