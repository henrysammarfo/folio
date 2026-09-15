import { errResult, type AdapterResult } from "./types";

export type WashVerdict = {
  symbol: string;
  mint: string | null;
  pass: boolean;
  pressure: "low" | "elevated" | "high" | "unknown";
  notes: string[];
};

/**
 * Wash / linked-flow gate.
 * Fail-closed when Bitquery is missing or not wired — never invent a green tape.
 */
export async function evaluateWashGate(params: {
  symbol: string;
  mint: string | null;
  notionalUsd: number;
}): Promise<AdapterResult<WashVerdict>> {
  const source = "bitquery.wash-gate";
  const apiKey = process.env["BITQUERY_API_KEY"];

  if (!apiKey) {
    return errResult(
      source,
      "bitquery_key_missing",
      "Wash tape unavailable — size blocked until BITQUERY_API_KEY is set (fail-closed).",
    );
  }

  try {
    void params;
    return errResult(
      source,
      "bitquery_query_not_wired",
      "BITQUERY_API_KEY present but wash GraphQL not yet production-wired — blocking size.",
    );
  } catch (e) {
    return errResult(source, "bitquery_wash_failed", String(e));
  }
}

export function washAllowsSize(wash: AdapterResult<WashVerdict>): boolean {
  return wash.ok && wash.data.pass;
}