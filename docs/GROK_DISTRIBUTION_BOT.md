# FOLIO Grok / GTM distribution bot

> Keep **Cursor on shipping**. Keep **Grok (or AgentRouter) on draft distribution**. Henry approves every post.

## Why

Chase Barker’s Solana GTM playbook ([solanagtm.netlify.app](https://solanagtm.netlify.app/)): brand → distribution engine → story. A solo founder cannot do both deep product and daily distribution without a force multiplier. This bot drafts; it does **not** spam, invent metrics, or auto-claim traction.

## What it does

1. Drafts ≤280-char X posts (soft pitch lock).
2. Appends to `memory/gtm-queue.json` with status `draft`.
3. **Never auto-posts** unless you later wire X API **and** set `FOLIO_GTM_AUTO_POST=true` (default off / fail-closed).

## Setup (secrets only in `.env`)

```bash
# Preferred for “Grok bot”
XAI_API_KEY=...
XAI_MODEL=grok-2-latest
# XAI_BASE_URL=https://api.x.ai/v1

# Fallback already used by FOLIO desk agent
# AGENTROUTER_API_KEY=...
# AGENTROUTER_BASE_URL=...
# AGENTROUTER_MODEL=...

FOLIO_GTM_AUTO_POST=false
```

Optional later (publish path not fully wired yet — do not paste secrets in chat):

```bash
# X_API_KEY=
# X_API_SECRET=
# X_ACCESS_TOKEN=
# X_ACCESS_SECRET=
```

## Commands

```bash
npx tsx scripts/gtm-draft.mts
npx tsx scripts/gtm-draft.mts --theme wash --count 5
npx tsx scripts/gtm-draft.mts --theme colosseum --count 3
```

Themes: `launch` · `truth` · `wash` · `buy` · `borrow` · `prestocks` · `tessera` · `colosseum` · `beta` · `founder`

Then open `memory/gtm-queue.json`, copy an approved draft to X (with `/opt/cursor/artifacts/folio-x-post.png` when useful).

## Cadence (from GTM playbook)

| Rhythm | Action |
|---|---|
| 3–5× / week | Post from queue |
| Daily 10–15 min | Replies = free marketing (Barker) |
| Milestone only | Ask network for RT / quote (don’t burn asks daily) |
| Weekly | Honest metrics note — quotes, wash refuses, beta signups (real numbers only) |

## Colosseum mentor / judge loop

1. Join Colosseum Discord + RSVP workshops: https://colosseum.com/worldsfair  
2. Submit portal before **2026-10-12**.  
3. Use advice-first DM templates in `docs/LAUNCH_AND_SOCIALS.md`.  
4. Goal: ≥10 thoughtful touches · ≥3 written notes.  
5. Bot drafts the “ask for brutal feedback” posts (`--theme colosseum`); Henry sends the DMs.

## Guardrails

- Soft pitch only · never “unhackable” · never fake fills/users  
- No hashtag walls · ≤1 tag in main post · partners in reply  
- Empty Discord/Telegram until ≥20 beta users (`LAUNCH_AND_SOCIALS.md`)  
- Domain + brand X handle claimed before heavy amplification  
