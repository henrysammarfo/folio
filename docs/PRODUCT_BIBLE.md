# FOLIO — Product Bible (design · GTM · retention)

> Living doc. Updated 2026-09-18. Research-backed; never claim unhackable.

## Design system (ship)

| Token | Value | Role |
|---|---|---|
| Signal azure | `#0EA5C9` | Primary accent / CTAs (replaces Netro yellow `#f4d014`) |
| Soft | `#B8E8F3` | Rail / soft fills |
| Wash | `#E8F7FB` | Section atmosphere |
| Ink | `#0B1220` | Body on light |
| On-accent | `#ffffff` | Text on azure CTAs |
| Canvas | `#E8EAED` / white layers | Desk density |

**Fonts:** Plus Jakarta Sans (UI) · Instrument Serif (display). Brand FOLIO mark is hero-level on landing.

**Inspo sources (cloned, not brand-cloned):**
1. `manovHacksaw/aionis-app` — landing brand-plane + app navbar / create flows
2. `AbdullahBalfaqih/NetroBNB` — 12-col desk density, header hierarchy, rail cards
3. Flowbite admin / top trading apps (Robinhood / Coinbase patterns) — progressive disclosure, order ticket clarity

**Layers (every surface):** atmosphere → chrome (nav/sidebar) → section frame → card shell → card header → body content → actions. Charts sit in their own card layer with attribution footer.

## Live charts & buy

- **TradingView Advanced Chart widget** — free hosted embed, **no API key**. Wired on Acquire + Position detail for underlying equity (AAPLx → `NASDAQ:AAPL`). Keep TradingView attribution.
- **Self-hosted Charting Library** — needs TradingView partnership/license + your own datafeed. Only if we outgrow widgets. Steps in `docs/KEYS_LANDING.md`.
- **Buy path** — live Jupiter quotes; broadcast stays paused until funded. Ticket UX mirrors paper → real activation research (clear steps, confirmation friction intentional).

## Go-to-market

1. **Show value before commitment** — browse live × and charts without forcing KYC first.
2. **Activation = first meaningful action** — inspect wallet qty or complete a quote review (not account create alone).
3. **Crypto-native first** — Solana wallet users who already hold or want xStocks.
4. **Honesty as moat** — competitors that invent fills / hide wash lose trust; we label fail-closed.

## Retention

- First-week activation predicts D30 (fintech research). Scaffold: see truth → run checks → review quote → (later) first fill.
- Alerts on corporate-action multiplier changes + wash status — not generic spam.
- Credit without selling = reason to return after buy.
- Keep Buy CTA persistent in desk topbar.

## Competition posture

- Win on **working honesty** (live multiplier, wash refuse, labeled quotes) over fake mainnet theater.
- UI must feel like a real app (layers, logos, responsive) so Stocklana / Colosseum judges and retail users both grasp the flow in seconds.
