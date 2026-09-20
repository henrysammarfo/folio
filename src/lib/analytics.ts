/**
 * Product analytics — consent-gated custom events via Vercel Analytics.
 * Never claim funnels without consent; ops admin lists the schema only.
 */

import { track } from "@vercel/analytics";
import { readCookieConsent } from "@/components/cookie-consent";

export const FOLIO_EVENTS = [
  "page_view",
  "cta_click",
  "buy_review",
  "buy_prepare",
  "buy_execute",
  "buy_execute_fail",
  "agent_ask",
  "wallet_connect",
  "export_wallet",
  "partner_lane",
  "beta_join",
  "open_app",
] as const;

export type FolioEventName = (typeof FOLIO_EVENTS)[number];

export type FolioEventProps = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Fire a named product event when cookies are accepted. Safe no-op otherwise. */
export function trackFolioEvent(
  name: FolioEventName,
  props?: FolioEventProps,
): void {
  if (typeof window === "undefined") return;
  if (readCookieConsent() !== "accepted") return;
  const clean: Record<string, string | number | boolean> = {};
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null) continue;
      clean[k] = v;
    }
  }
  try {
    track(name, clean);
  } catch {
    /* analytics must never break desk */
  }
}
