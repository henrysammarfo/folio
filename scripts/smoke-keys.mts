/**
 * Live post-key probes for FOLIO Stocklana production.
 * Usage: npx tsx scripts/smoke-keys.mts
 * Never prints secret values. Exit 0 even when keys missing (honesty report).
 * Exit 1 only when a present key's live probe errors unexpectedly.
 */
import { applyDotEnv } from "./load-dotenv.ts";
applyDotEnv();

import {
  classifyKeySmokeBaseline,
  readKeySmokeEnv,
  summarizeKeySmoke,
  type KeySmokeRow,
} from "../src/lib/keys-smoke.ts";
import { evaluateWashGate } from "../src/lib/adapters/wash.ts";
import { fetchPythEquityPrice } from "../src/lib/adapters/pyth.ts";
import { fetchXStockAsset } from "../src/lib/adapters/xstocks.ts";
import { getAuthProviderStatus } from "../src/lib/auth/session.ts";
import { verifyPrivyAccessToken } from "../src/lib/auth/privy.ts";
import { searchTwentyFirstComponents } from "../src/lib/lab/twentyfirst.ts";
import { probeShadersApi } from "../src/lib/lab/shaders-status.ts";

async function probeWash(): Promise<KeySmokeRow> {
  const asset = await fetchXStockAsset("AAPLx");
  const mint = asset.ok ? asset.data.solanaMint : null;
  if (!mint) {
    return {
      id: "bitquery_live",
      present: true,
      status: "error",
      detail: "Cannot probe wash — xStocks mint unavailable",
    };
  }
  const wash = await evaluateWashGate({
    symbol: "AAPLx",
    mint,
    notionalUsd: 25,
  });
  if (!wash.ok && wash.reason === "bitquery_key_missing") {
    return {
      id: "bitquery_live",
      present: true,
      status: "error",
      detail: "Key present in env but adapter still reports bitquery_key_missing",
    };
  }
  if (!wash.ok) {
    return {
      id: "bitquery_live",
      present: true,
      status: "fail-closed",
      detail: `Wash probed · ${wash.reason}${wash.detail ? ` — ${wash.detail}` : ""} (fail-closed ok)`,
    };
  }
  return {
    id: "bitquery_live",
    present: true,
    status: "ok",
    detail: `Wash live · pressure=${wash.data.pressure} · n=${wash.data.sampleSize} · pass=${wash.data.pass}`,
  };
}

async function probePyth(): Promise<KeySmokeRow> {
  const py = await fetchPythEquityPrice("AAPL");
  if (!py.ok && py.reason === "pyth_api_key_missing") {
    return {
      id: "pyth_live",
      present: true,
      status: "error",
      detail: "Key present in env but adapter still reports pyth_api_key_missing",
    };
  }
  if (!py.ok) {
    return {
      id: "pyth_live",
      present: true,
      status: "fail-closed",
      detail: `Hermes probed · ${py.reason}${py.detail ? ` — ${py.detail}` : ""}`,
    };
  }
  return {
    id: "pyth_live",
    present: true,
    status: "ok",
    detail: `Hermes live · AAPL ≈ ${py.data.price} · ${py.source}`,
  };
}

async function probePrivy(): Promise<KeySmokeRow> {
  // Empty token must fail-closed — proves verify path is wired without inventing a session.
  const res = await verifyPrivyAccessToken("");
  if (res.ok) {
    return {
      id: "privy_live",
      present: true,
      status: "error",
      detail: "Empty Privy token unexpectedly verified — refuse invent-a-session",
    };
  }
  return {
    id: "privy_live",
    present: true,
    status: "ok",
    detail: `Privy verify path wired · empty token fail-closed (${res.reason})`,
  };
}

async function probeSupabase(): Promise<KeySmokeRow> {
  const url = process.env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) {
    return {
      id: "supabase_live",
      present: false,
      status: "skipped",
      detail: "Supabase keys missing",
    };
  }
  try {
    const res = await fetch(`${url}/rest/v1/tenants?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (res.status === 404 || res.status === 406) {
      return {
        id: "supabase_live",
        present: true,
        status: "fail-closed",
        detail: `REST reachable HTTP ${res.status} — apply supabase/migrations/20260915_folio_tenants.sql`,
      };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        id: "supabase_live",
        present: true,
        status: "fail-closed",
        detail: `REST HTTP ${res.status} ${body.slice(0, 120)}`,
      };
    }
    return {
      id: "supabase_live",
      present: true,
      status: "ok",
      detail: "Supabase REST tenants readable via service-role (migration likely applied)",
    };
  } catch (e) {
    return {
      id: "supabase_live",
      present: true,
      status: "error",
      detail: `Supabase fetch failed: ${String(e).slice(0, 160)}`,
    };
  }
}

async function probeTwentyFirst(): Promise<KeySmokeRow> {
  const res = await searchTwentyFirstComponents(
    "trade journal table market snapshot desk",
    3,
  );
  if (!res.ok) {
    return {
      id: "twentyfirst_live",
      present: true,
      status: "error",
      detail: `21st MCP probe failed — ${res.reason}`,
    };
  }
  return {
    id: "twentyfirst_live",
    present: true,
    status: "ok",
    detail: `21st MCP live · ${res.hits.length} hits${
      res.hits[0] ? ` · e.g. ${res.hits[0].name}` : ""
    }`,
  };
}

async function probeShaders(): Promise<KeySmokeRow> {
  const status = await probeShadersApi();
  if (!status.keyPresent) {
    return {
      id: "shaders_live",
      present: false,
      status: "skipped",
      detail: status.detail,
    };
  }
  return {
    id: "shaders_live",
    present: true,
    status: status.reachable ? "ok" : "fail-closed",
    detail: status.detail,
  };
}

async function main() {
  const env = readKeySmokeEnv();
  const baseline = classifyKeySmokeBaseline(env);
  const live: KeySmokeRow[] = [];

  if (env.bitquery) live.push(await probeWash());
  if (env.pyth) live.push(await probePyth());
  if (env.privy) live.push(await probePrivy());
  if (env.supabase) live.push(await probeSupabase());
  if (env.twentyFirst) live.push(await probeTwentyFirst());
  if (env.shaders) live.push(await probeShaders());

  const auth = getAuthProviderStatus();
  live.push({
    id: "auth_status",
    present: env.privy && env.supabase && env.sessionSecret,
    status: auth.ok ? "ok" : "fail-closed",
    detail: auth.ok
      ? auth.data.note
      : `${auth.reason}${auth.detail ? ` — ${auth.detail}` : ""}`,
  });

  const rows = [...baseline, ...live];
  for (const r of rows) {
    const mark =
      r.status === "ok"
        ? "OK  "
        : r.status === "skipped"
          ? "SKIP"
          : r.status === "fail-closed"
            ? "FC  "
            : "ERR ";
    console.log(`${mark}  ${r.id} — ${r.detail}`);
  }

  const summary = summarizeKeySmoke(rows);
  console.log("");
  console.log(
    summary.blockingMissing.length
      ? `Still need for full Stocklana objective: ${summary.blockingMissing.join(", ")}`
      : "All blocking key families present — run live probes above before claiming production complete.",
  );
  if (summary.probeReady.length) {
    console.log(`Probed live: ${summary.probeReady.join(", ")}`);
  }
  if (summary.errors.length) {
    console.log("Probe errors:");
    for (const e of summary.errors) console.log(`  - ${e}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = 0;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
