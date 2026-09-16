/**
 * Shaders.com probe — lab only. Key format ak_* (SHADERS_API_KEY).
 * REST is Clerk-gated (often 500). Live WebGL for approve candidates comes from
 * 21st.dev MCP get_component (Plasma) adapted in src/components/lab/shader-background.tsx.
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
