# FOLIO — THREAT MODEL (honest)

FOLIO is **not** unhackable. Residual risk remains against skilled attackers, including well-resourced ones.

## Assets

- User session cookies / Privy tokens
- API keys in server env
- Quote / gate integrity (user may be misled if we lie)
- Future: wallet signatures for swaps/borrows

## Threats & mitigations

| Threat | Mitigation | Residual |
|---|---|---|
| Secret leak via git/chat | `.env` gitignored; rotate chat-pasted keys | Human paste risk |
| XSS → session theft | httpOnly cookies; CSP when hosted; no auth in localStorage | Browser 0-days |
| Fake fills / wrong shares | Fail-closed gates; live multiplier; labeled quote-only | Oracle/API downtime |
| Wash routing | Bitquery gate when keyed; else block size | Tape incomplete |
| LLM agent overspend | Paper default; caps; meter AgentRouter | Prompt injection |
| RPC lie / eclipse | Prefer reputable RPC; cross-check Pyth vs venue | Single-RPC trust |
| Supply-chain npm | Lockfile; minimize new deps | Always present |

## Explicit non-claims

Do **not** say: unhackable, NK-proof, military-grade absolute, zero bugs forever.
Do say: fail-closed, audited gates, residual risk documented, tests + BUGS.md.
