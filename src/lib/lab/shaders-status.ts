/**
 * Shaders.com probe — lab only. Key format ak_* (SHADERS_API_KEY).
 * Live frame fetch is fail-closed when Clerk/API rejects; lab still shows FOLIO studies.
 */

export type ShadersStatus = {
  keyPresent: boolean;
  reachable: boolean;
  detail: string;
};

export async function probeShadersApi(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ShadersStatus> {
  const key = env["SHADERS_API_KEY"]?.trim() ?? "";
  if (!key) {
    return {
      keyPresent: false,
      reachable: false,
      detail: "SHADERS_API_KEY missing — lab studies are local FOLIO tokens only.",
    };
  }

  try {
    const res = await fetch("https://shaders.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${key}`,
        "x-api-key": key,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });
    const body = await res.text().catch(() => "");
    if (res.ok) {
      return {
        keyPresent: true,
        reachable: true,
        detail: "Shaders API reachable — wire live frames into lab swatches next.",
      };
    }
    return {
      keyPresent: true,
      reachable: false,
      detail: `Shaders API HTTP ${res.status}${body.includes("Clerk") ? " (Clerk auth gate)" : ""} — keeping local ink/ledger studies.`,
    };
  } catch (e) {
    return {
      keyPresent: true,
      reachable: false,
      detail: `Shaders probe failed: ${String(e)}`,
    };
  }
}
