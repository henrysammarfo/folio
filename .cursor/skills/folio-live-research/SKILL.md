---
name: folio-live-research
description: Live fact-check FOLIO claims with Tavily and TinyFish Search. Use when verifying Stocklana, xStocks, Kamino, Jupiter, or competitor claims — never invent counts.
---

# Live research

1. Prefer Tavily (`TAVILY_API_KEY`) then TinyFish Search (`TINYFISH_API_KEY` + `X-API-Key` on `api.search.tinyfish.ai`).
2. TinyFish Agent automation may be credit-gated — do not pretend crawls succeeded.
3. Record outcomes in `memory/FACT_CHECK.md` with date + source URL.
4. Stale bible numbers (regs/subs, multipliers) must be re-fetched before user-facing claims.
5. Never paste API keys into memory files.