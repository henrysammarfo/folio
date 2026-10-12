import { errResult, okResult, type AdapterResult } from "./types";

/**
 * Reflect stablecoin rail — mainnet-read via documented REST
 * (https://prod.api.reflect.money). Mint/redeem CPI stays external;
 * NestUSD / Nest.credit remain separate fail-closed lanes.
 * Optional REFLECT_API_KEY raises rate limits (X-API-Key).
 */
export type ReflectStableType = {
  index: number;
  name: string;
};

export type ReflectSnapshot = {
  protocol: "Reflect";
  stage: string;
  types: ReflectStableType[];
  users: number | null;
  tvl: number | null;
  cumulativeVolume: string | null;
  totalYieldDistributed: number | null;
  appUrl: string;
  docsUrl: string;
  sdkPackage: "@reflectmoney/stable.ts";
  asOf: string;
};

const REFLECT_API = "https://prod.api.reflect.money";
export const REFLECT_APP_URL = "https://reflect.money";
export const REFLECT_DOCS_URL = "https://docs.reflect.money/introduction";

function reflectHeaders(env: NodeJS.ProcessEnv = process.env): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "folio-desk/0.1",
  };
  const key = env["REFLECT_API_KEY"]?.trim();
  if (key) headers["X-API-Key"] = key;
  return headers;
}

export async function fetchReflectStatus(
  env: NodeJS.ProcessEnv = process.env,
): Promise<AdapterResult<ReflectSnapshot>> {
  const source = "prod.api.reflect.money/health+types+stats";
  try {
    const headers = reflectHeaders(env);
    const [healthRes, typesRes, statsRes] = await Promise.all([
      fetch(`${REFLECT_API}/health`, {
        headers,
        signal: AbortSignal.timeout(12_000),
      }),
      fetch(`${REFLECT_API}/stablecoin/types`, {
        headers,
        signal: AbortSignal.timeout(12_000),
      }),
      fetch(`${REFLECT_API}/stats`, {
        headers,
        signal: AbortSignal.timeout(12_000),
      }),
    ]);

    if (!healthRes.ok) {
      return errResult(source, "reflect_health_http", `HTTP ${healthRes.status}`);
    }
    const health = (await healthRes.json()) as {
      success?: boolean;
      stage?: string;
      message?: string;
    };
    if (health.success !== true) {
      return errResult(source, "reflect_health_failed", health.message ?? "unhealthy");
    }

    if (!typesRes.ok) {
      return errResult(source, "reflect_types_http", `HTTP ${typesRes.status}`);
    }
    const typesJson = (await typesRes.json()) as {
      success?: boolean;
      data?: Array<{ index?: number; name?: string }>;
    };
    const types: ReflectStableType[] = (typesJson.data ?? [])
      .map((t) => {
        const index = Number(t.index);
        const name = t.name?.trim() ?? "";
        if (!name || !Number.isFinite(index)) return null;
        return { index, name };
      })
      .filter((t): t is ReflectStableType => t != null);
    if (types.length === 0) {
      return errResult(source, "reflect_types_empty", "No stablecoin types");
    }

    let users: number | null = null;
    let tvl: number | null = null;
    let cumulativeVolume: string | null = null;
    let totalYieldDistributed: number | null = null;
    if (statsRes.ok) {
      const statsJson = (await statsRes.json()) as {
        success?: boolean;
        data?: {
          users?: number;
          tvl?: number;
          cumulativeVolume?: string | number;
          totalYieldDistributed?: number;
        };
      };
      if (statsJson.success && statsJson.data) {
        users =
          typeof statsJson.data.users === "number" ? statsJson.data.users : null;
        tvl = typeof statsJson.data.tvl === "number" ? statsJson.data.tvl : null;
        cumulativeVolume =
          statsJson.data.cumulativeVolume != null
            ? String(statsJson.data.cumulativeVolume)
            : null;
        totalYieldDistributed =
          typeof statsJson.data.totalYieldDistributed === "number"
            ? statsJson.data.totalYieldDistributed
            : null;
      }
    }

    return okResult("mainnet-read", source, {
      protocol: "Reflect",
      stage: health.stage?.trim() || "prod",
      types,
      users,
      tvl,
      cumulativeVolume,
      totalYieldDistributed,
      appUrl: REFLECT_APP_URL,
      docsUrl: REFLECT_DOCS_URL,
      sdkPackage: "@reflectmoney/stable.ts",
      asOf: new Date().toISOString(),
    });
  } catch (e) {
    return errResult(source, "reflect_fetch_failed", String(e));
  }
}
