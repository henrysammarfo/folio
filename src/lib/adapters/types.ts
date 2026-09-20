/** Shared fail-closed result shapes for FOLIO live adapters. */

export type IntegrationMode =
  | "mainnet-read"
  | "mainnet-write"
  | "quote-only"
  | "fork"
  | "paper"
  | "unavailable";

export type AdapterOk<T> = {
  ok: true;
  mode: Exclude<IntegrationMode, "unavailable">;
  asOf: string;
  source: string;
  data: T;
};

export type AdapterErr = {
  ok: false;
  mode: "unavailable";
  asOf: string;
  source: string;
  reason: string;
  detail?: string;
};

export type AdapterResult<T> = AdapterOk<T> | AdapterErr;

export function okResult<T>(
  mode: Exclude<IntegrationMode, "unavailable">,
  source: string,
  data: T,
): AdapterOk<T> {
  return { ok: true, mode, asOf: new Date().toISOString(), source, data };
}

export function errResult(
  source: string,
  reason: string,
  detail?: string,
): AdapterErr {
  return detail === undefined
    ? {
        ok: false,
        mode: "unavailable",
        asOf: new Date().toISOString(),
        source,
        reason,
      }
    : {
        ok: false,
        mode: "unavailable",
        asOf: new Date().toISOString(),
        source,
        reason,
        detail,
      };
}