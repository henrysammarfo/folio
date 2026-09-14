# FOLIO Brand, Site, and Prime Desk

## Goal
Build FOLIO as a premium corporate-action prime desk for Solana xStocks, using the supplied Nexeus cinematic template as the visual foundation. The experience will be polished enough for the hackathon pitch and future merchandise while remaining honest about what is live, read-only, quote-only, devnet, or fork-tested.

## Brand system
- Create an original FOLIO symbol derived from an “F” monogram, a verified share ledger, and a four-point market compass; it must work at favicon, app-icon, hoodie, and wordmark sizes.
- Preserve the template’s Instrument Serif + Plus Jakarta Sans typography, cinematic full-bleed media, precise white type, compact controls, and glass surfaces.
- Extend the template into a restrained financial-product system: alpine sky, cloud white, ledger green, warning amber, and ink surfaces through reusable semantic tokens.
- Use consistent Lucide icons for interface actions; reserve the custom FOLIO mark for identity.

## Public routes
- `/` — cinematic FOLIO introduction using the exact supplied video and poster, with the product proposition and route-based footer navigation.
- `/truth` — corporate-action ledger: raw shares, multiplier, economic shares, event timeline, provenance, and verification states.
- `/execution` — wash/oracle gates, venue comparison, quote status, and fail-closed explanation.
- `/credit` — collateral, available credit, utilization, and clearly labeled Kamino/Jupiter Lend and NestUSD risks.
- `/network` — exact devnet, mainnet-read, local-fork, and unfunded-mainnet capability matrix.
- `/about` — product doctrine, target users, builder identity, and audit-friendly principles.

## Dashboard and flows
- `/desk` — portfolio overview with economic-share balances, corporate-action alerts, risk state, and quick access to workflows.
- `/desk/acquire` — guided acquisition flow: choose xStock, set size, inspect Pyth/reference prices, compare venues, pass wash/oracle checks, then stop at a clearly labeled quote-only review.
- `/desk/positions` — positions table with raw versus economic balances and per-asset health.
- `/desk/positions/$symbol` — complete position detail with multiplier history, dividends, provenance, venues, and collateral eligibility.
- `/desk/credit` — collateral selection, health preview, provider comparison, and fork/live availability labels without fake borrowing.
- `/desk/activity` — auditable event stream for quotes, policy decisions, corporate actions, and fork simulations.
- `/desk/settings` — network mode and notification preferences, kept locally for this frontend prototype.
- Implement working navigation, search/filter controls, tab/step transitions, form validation, drawers/modals, and deterministic demo-state interactions.

## Honesty and safety
- Never display fabricated fills, equity mints, users, or broadcasts.
- Label every datum or action as mainnet read, quote-only, devnet, local fork, or unavailable without funding.
- Default execution controls to fail closed when pricing, wash, oracle, or corporate-action checks are unresolved.
- Describe external protocols as integrations/paths, not as endorsements or guaranteed availability.

## Technical details
- Use the existing TanStack Start routing architecture and create every linked route in the same change.
- Build shared site shell, dashboard shell, logo, status badges, data tables, and flow controls as focused reusable components.
- Use local deterministic fixture data only; no backend or wallet broadcast is implied in this phase.
- Add unique metadata to every content route and load the requested fonts through the document head.
- Verify the complete route set and key flows at desktop and mobile sizes, including overflow and interaction states.

## Acceptance criteria
- The opening view visibly matches the supplied cinematic composition rather than becoming a generic crypto landing page.
- Every navigation item resolves to a complete page.
- All dashboard flows are usable as an honest interactive prototype and never suggest a transaction was executed.
- The logo remains legible as a small icon and credible as a one-color merchandise mark.
- No placeholder page, dead link, overlapping UI, or unlabeled network state remains.
