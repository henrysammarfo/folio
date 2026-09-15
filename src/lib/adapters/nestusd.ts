import { errResult, type AdapterResult } from "./types";

export type NestUsdSnapshot = {
  protocol: "NestUSD";
  status: "risk-review";
};

/**
 * NestUSD (xStocks-backed Solana borrow capacity) stays fail-closed.
 *
 * Live research (2026-09-15): `api.nest.credit/v1/vaults` is Nest.credit
 * indexed vault TVL (EVM hub + Solana OFT mints) — a different product surface.
 * Solana Nest program IDs exist on GitHub (NestUSD/contracts) but FOLIO has no
 * verified public NestUSD capacity/LTV metrics endpoint for the credit desk.
 * Do not paint Nest.credit vault TVL as NestUSD borrow capacity.
 */
export async function fetchNestUsdStatus(): Promise<AdapterResult<NestUsdSnapshot>> {
  return errResult(
    "nestusd",
    "nestusd_endpoint_unverified",
    "NestUSD xStock borrow capacity unverified — Nest.credit /v1/vaults is a different product (vault TVL/OFT). Capacity hidden (risk-labeled, fail-closed).",
  );
}
