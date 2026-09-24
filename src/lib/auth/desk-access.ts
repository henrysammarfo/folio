/**
 * Desk access helpers — soft gate for UI, hard gate for metered / mutating ops.
 * Desk READ stays public (demo); writes + agent spend + execute require a verified session.
 */

import type { AdapterResult } from "../adapters/types";
import type { FolioSession } from "./session";
import { activeMembership } from "./role-gates";

export type DeskAccess = {
  signedIn: boolean;
  session: FolioSession | null;
  activeTenantId: string | null;
  role: FolioSession["tenants"][number]["role"] | null;
  tenantCount: number;
  note: string;
};

/** Derive soft-gate UI state from a verified-session result (cookie already checked). */
export function deskAccessFromSession(
  session: AdapterResult<FolioSession>,
): DeskAccess {
  if (!session.ok) {
    return {
      signedIn: false,
      session: null,
      activeTenantId: null,
      role: null,
      tenantCount: 0,
      note: "Browse the desk freely — Open App to buy, save prefs, or run the agent. Inspect wallets stay public.",
    };
  }
  const membership = activeMembership(session.data);
  return {
    signedIn: true,
    session: session.data,
    activeTenantId: membership?.tenantId ?? null,
    role: membership?.role ?? null,
    tenantCount: session.data.tenants.length,
    note: membership
      ? `Signed in · ${membership.role} on ${membership.slug ?? membership.displayName ?? membership.tenantId.slice(0, 8)}…`
      : "Signed in · no active tenant membership.",
  };
}

/** Soft gate for Buy execute UI — hard gate remains executeBlockedReason. */
export function buyRequiresSessionNote(
  session: AdapterResult<FolioSession>,
): string | null {
  if (!session.ok) {
    return "Open App to assemble and sign a live buy.";
  }
  return null;
}

/** Hard gate for paper agent — metered / spine spend requires a verified session. */
export function agentBlockedReason(
  session: AdapterResult<FolioSession>,
): string | null {
  if (!session.ok) {
    return "Agent requires a signed session — Open App, then retry.";
  }
  return null;
}

/** Hard gate for Jupiter /execute — never broadcast without a verified session. */
export function executeBlockedReason(
  session: AdapterResult<FolioSession>,
): string | null {
  if (!session.ok) {
    return "Execute requires a signed session — Open App, then retry.";
  }
  return null;
}

/** Prefs / tenant switch — verified session required (role checks separate). */
export function prefsSessionBlockedReason(
  session: AdapterResult<FolioSession>,
): string | null {
  if (!session.ok) {
    return "Saving prefs requires a signed session — Open App, then retry.";
  }
  return null;
}

/** Bootstrap mint is opt-in — never open on production without the flag. */
export function bootstrapDemoAllowed(): boolean {
  return process.env["FOLIO_ALLOW_BOOTSTRAP_DEMO"]?.trim() === "1";
}

export function bootstrapBlockedReason(): string | null {
  if (!bootstrapDemoAllowed()) {
    return "Bootstrap demo session is disabled (set FOLIO_ALLOW_BOOTSTRAP_DEMO=1 to enable).";
  }
  return null;
}
