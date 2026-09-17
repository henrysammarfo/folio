---
name: folio-block0-spine
description: Build FOLIO Block 0 live spine — xStocks multiplier, Pyth diverge, wash gate, Jupiter quote, network matrix. Use when wiring Stocklana demo truth path or replacing desk fixtures.
---

# FOLIO Block 0 spine

1. Read `memory/CURRENT_STATE.md` + `memory/NETWORK_MATRIX.md`.
2. Implement/verify adapters under `src/lib/adapters/`:
   - `xstocks.ts` — `network=Solana` (capital S)
   - `pyth.ts` — Hermes equity feeds
   - `jupiter.ts` — quote only via `api.jup.ag`
   - `wash.ts` — Bitquery when keyed, else unavailable/fail-closed
3. Wire desk acquire + truth + network routes to server functions — no hardcoded 4.0×.
4. Badge every panel with mode.
5. Add/adjust vitest for pure math + adapter result shapes.
6. Log live vs fixture deltas in `memory/FACT_CHECK.md`.