# FOLIO agent notes

- Architecture + `memory/*` are binding. Update `CURRENT_STATE.md`, `SESSION_LOG.md`, `FACT_CHECK.md` on material changes.
- Fail-closed adapters only — no mocks, no silent fallbacks, no fake fills.
- Never claim unhackable / NK-proof.
- Secrets only in `.env` (gitignored). Prefer rotation after chat exposure.
- Broadcast / mentor outreach paused until Block 0 live demo URL exists (`BROADCAST_PAUSED=true`).
- Mainnet-primary READ + quote-only; borrow CPI unavailable until funded (no fork theater); no custom mainnet deploy on ≤~$1 budget.
- Keep the cinematic home hero; improve, don’t replace. Shaders/21st land on `/lab/*` until approved.
- Do not rewrite published git history (force push / rebase of pushed commits).
