/**
 * Multi-tenant role helpers — never invent memberships or grant viewer write.
 */

import type { FolioSession, TenantMembership } from "./session";
import { resolveActiveTenantId } from "./session";

export type DeskRole = TenantMembership["role"];

/** Active membership for the session's resolved activeTenantId — or null. */
export function activeMembership(
  session: FolioSession,
): TenantMembership | null {
  const tenantId = resolveActiveTenantId(session);
  if (!tenantId) return null;
  return session.tenants.find((t) => t.tenantId === tenantId) ?? null;
}

/** owner + trader may write desk prefs; viewer is read-only. */
export function canWriteDeskPrefs(role: DeskRole | null | undefined): boolean {
  return role === "owner" || role === "trader";
}

export function prefsWriteBlockedReason(
  membership: TenantMembership | null,
): string | null {
  if (!membership) {
    return "No active tenant membership — refusing prefs write.";
  }
  if (!canWriteDeskPrefs(membership.role)) {
    return `Role ${membership.role} is read-only — owner/trader required to save desk prefs.`;
  }
  return null;
}
