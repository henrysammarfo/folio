/**
 * Pinned 21st.dev component ids — adapted in-lab, never auto-merged to production.
 * Used when API_KEY_21ST is missing (e.g. Vercel preview) so approve candidates
 * stay labeled with the real catalog ids instead of looking "disconnected."
 */

import type { TwentyFirstHit } from "./twentyfirst";

/** Shader Builder Plasma — WebGL adapted in `ShaderBackground`. */
export const PINNED_PLASMA_ID = 24346;

/** Trade Journal Table — layout adapted in `FolioTradeJournalLab`. */
export const PINNED_TRADE_JOURNAL_ID = 27124;

export const PINNED_TRADE_JOURNAL: TwentyFirstHit = {
  id: PINNED_TRADE_JOURNAL_ID,
  name: "Trade Journal Table",
  description:
    "Pinned 21st.dev id 27124 — FOLIO paper honesty blotter adapted in-lab (no live fills).",
  previewUrl: null,
  author: "juice",
  installHint: null,
};

export const PINNED_PLASMA: TwentyFirstHit = {
  id: PINNED_PLASMA_ID,
  name: "Shader Builder Plasma",
  description:
    "Pinned 21st.dev id 24346 — live WebGL Plasma retinted to FOLIO ledger ice.",
  previewUrl: null,
  author: null,
  installHint: null,
};
