import { errResult, okResult, type AdapterResult } from "../adapters/types";

const BOOTSTRAP_CUSTOM_ID = "folio-demo-bootstrap";
const PRIVY_UA =
  "Mozilla/5.0 (compatible; FOLIO-desk/1.0; +https://github.com/henrysammarfo/folio)";

function privyBasicAuth(): { appId: string; authHeader: string } | null {
  const appId = process.env["PRIVY_APP_ID"]?.trim();
  const secret = process.env["PRIVY_APP_SECRET"]?.trim();
  if (!appId || !secret) return null;
  const token = Buffer.from(`${appId}:${secret}`, "utf8").toString("base64");
  return { appId, authHeader: `Basic ${token}` };
}

/**
 * Ensure a real Privy DID for the Stocklana demo desk via Privy REST.
 * Uses custom_auth id `folio-demo-bootstrap` — not a fake/placeholder DID.
 * Fail-closed if Privy rejects (never invents did:privy:…).
 */
export async function ensureBootstrapPrivyUser(): Promise<
  AdapterResult<{ userId: string; created: boolean; note: string }>
> {
  const source = "privy.users.bootstrap";
  const creds = privyBasicAuth();
  if (!creds) {
    return errResult(source, "privy_keys_missing", "PRIVY_APP_ID / SECRET required.");
  }

  try {
    const res = await fetch("https://auth.privy.io/api/v1/users", {
      method: "POST",
      headers: {
        Authorization: creds.authHeader,
        "privy-app-id": creds.appId,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": PRIVY_UA,
      },
      body: JSON.stringify({
        linked_accounts: [
          { type: "custom_auth", custom_user_id: BOOTSTRAP_CUSTOM_ID },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const body = await res.text();
    if (res.ok) {
      const json = JSON.parse(body) as { id?: string };
      if (!json.id?.startsWith("did:privy:")) {
        return errResult(source, "privy_user_id_invalid", body.slice(0, 120));
      }
      return okResult("mainnet-read", source, {
        userId: json.id,
        created: true,
        note: "Privy user created for folio-demo-bootstrap",
      });
    }

    // Already exists — look up by custom_user_id via search if create conflicts.
    if (res.status === 400 || res.status === 409) {
      const lookup = await fetch(
        `https://auth.privy.io/api/v1/users?linked_accounts.custom_user_id=${encodeURIComponent(BOOTSTRAP_CUSTOM_ID)}`,
        {
          headers: {
            Authorization: creds.authHeader,
            "privy-app-id": creds.appId,
            Accept: "application/json",
            "User-Agent": PRIVY_UA,
          },
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (lookup.ok) {
        const found = (await lookup.json()) as
          | { data?: Array<{ id?: string }> }
          | Array<{ id?: string }>;
        const rows = Array.isArray(found) ? found : (found.data ?? []);
        const id = rows[0]?.id;
        if (id?.startsWith("did:privy:")) {
          return okResult("mainnet-read", source, {
            userId: id,
            created: false,
            note: "Privy user already existed for folio-demo-bootstrap",
          });
        }
      }
      // Create may return the existing user in error body — try parse
      try {
        const errJson = JSON.parse(body) as { id?: string; user?: { id?: string } };
        const id = errJson.id ?? errJson.user?.id;
        if (id?.startsWith("did:privy:")) {
          return okResult("mainnet-read", source, {
            userId: id,
            created: false,
            note: "Privy user resolved from conflict response",
          });
        }
      } catch {
        /* fall through */
      }
    }

    return errResult(
      source,
      "privy_user_create_failed",
      `HTTP ${res.status} ${body.slice(0, 180)}`,
    );
  } catch (e) {
    return errResult(source, "privy_user_create_failed", String(e));
  }
}

export const FOLIO_BOOTSTRAP_CUSTOM_ID = BOOTSTRAP_CUSTOM_ID;
