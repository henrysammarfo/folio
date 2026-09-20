/**
 * Closed-beta waitlist — Supabase service-role only.
 * Never invents a success when keys/table missing. Never uses localStorage.
 */

import { errResult, okResult, type AdapterResult } from "../adapters/types";

export type WaitlistEntry = {
  email: string;
  wallet: string | null;
  note: string | null;
  createdAt: string;
  upserted: boolean;
};

export async function upsertBetaWaitlist(input: {
  email: string;
  wallet?: string | null;
  note?: string | null;
}): Promise<AdapterResult<WaitlistEntry>> {
  const source = "folio.beta-waitlist";
  const url = process.env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) {
    return errResult(
      source,
      "waitlist_unavailable",
      "Waitlist server not configured — try again after Supabase keys + migration.",
    );
  }

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errResult(source, "waitlist_email_invalid", "Enter a valid email.");
  }

  const wallet = input.wallet?.trim() || null;
  const note = input.note?.trim() || null;
  const now = new Date().toISOString();

  try {
    const res = await fetch(
      `${url}/rest/v1/beta_waitlist?on_conflict=email`,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          email,
          wallet,
          note,
          updated_at: now,
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    const body = await res.text().catch(() => "");
    if (!res.ok) {
      // PGRST205 = table missing from schema cache
      if (res.status === 404 || /PGRST205|relation.*does not exist/i.test(body)) {
        return errResult(
          source,
          "waitlist_migration_missing",
          "Waitlist table missing — apply supabase/migrations/20260920_beta_waitlist.sql.",
        );
      }
      return errResult(
        source,
        "waitlist_http_error",
        `Waitlist save failed (HTTP ${res.status}).`,
      );
    }
    let createdAt = now;
    try {
      const parsed = JSON.parse(body) as Array<{ created_at?: string }>;
      if (Array.isArray(parsed) && parsed[0]?.created_at) {
        createdAt = parsed[0].created_at;
      }
    } catch {
      /* representation optional */
    }
    return okResult("mainnet-read", source, {
      email,
      wallet,
      note,
      createdAt,
      upserted: true,
    });
  } catch (e) {
    return errResult(
      source,
      "waitlist_network",
      e instanceof Error ? e.message : "Waitlist unreachable",
    );
  }
}
