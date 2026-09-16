/**
 * 21st.dev MCP client — lab candidates only (never auto-merge to production).
 * Endpoint: https://21st.dev/api/mcp · header x-api-key: API_KEY_21ST
 */

export type TwentyFirstHit = {
  id: number | string;
  name: string;
  description: string | null;
  previewUrl: string | null;
  author: string | null;
  installHint: string | null;
};

export function isTwentyFirstConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env["API_KEY_21ST"]?.trim().length ?? 0) > 0;
}

export async function searchTwentyFirstComponents(
  query: string,
  limit = 6,
): Promise<{ ok: true; hits: TwentyFirstHit[] } | { ok: false; reason: string }> {
  const apiKey = process.env["API_KEY_21ST"]?.trim();
  if (!apiKey) {
    return { ok: false, reason: "API_KEY_21ST missing" };
  }

  try {
    const res = await fetch("https://21st.dev/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "search",
          arguments: { query, type: "component", limit },
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      return { ok: false, reason: `21st MCP HTTP ${res.status}` };
    }
    const json = (await res.json()) as {
      result?: {
        structuredContent?: {
          results?: Array<{
            type?: string;
            id?: number | string;
            name?: string;
            description?: string | null;
            previewUrl?: string | null;
            author?: string | null;
            install?: string | null;
          }>;
        };
      };
      error?: { message?: string };
    };
    if (json.error?.message) {
      return { ok: false, reason: json.error.message };
    }
    const raw = json.result?.structuredContent?.results ?? [];
    const hits: TwentyFirstHit[] = raw
      .filter((r) => r.type === "component" && r.id != null && r.name)
      .map((r) => ({
        id: r.id as number | string,
        name: r.name as string,
        description: r.description ?? null,
        previewUrl: r.previewUrl ?? null,
        author: r.author ?? null,
        installHint: r.install ?? null,
      }));
    return { ok: true, hits };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}
