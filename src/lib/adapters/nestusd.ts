import { errResult, type AdapterResult } from "./types";

export type NestUsdSnapshot = {
  protocol: "NestUSD";
  status: "risk-review";
};

/**
 * NestUSD — xStocks-endorsed borrow path exists in public coverage,
 * but FOLIO will not surface capacity numbers until a verified public
 * metrics endpoint + audit artifacts are wired. Fail-closed / risk-labeled.
 */
export async function fetchNestUsdStatus(): Promise<AdapterResult<NestUsdSnapshot>> {
  return errResult(
    "nestusd",
    "nestusd_endpoint_unverified",
    "NestUSD public metrics endpoint not verified in-repo — capacity hidden (risk-labeled, fail-closed).",
  );
}
