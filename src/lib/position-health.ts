/**
 * Position row health — wallet-verified only when qty is wallet-read AND
 * live API multiplier agrees with on-chain Token-2022 Scaled UI.
 * Never invent Verified from paper qty or API-only marks.
 */

export type PositionHealth = "Verified" | "Review" | "Unavailable";

export type ScaledUiHealthStatus = "match" | "mismatch" | "unavailable";

export function positionHealth(input: {
  qtySource: "wallet-read" | "paper";
  multiplierOk: boolean;
  assetOk: boolean;
  priceOk: boolean;
  /** API ↔ on-chain Scaled UI — Verified requires match. */
  scaledUiStatus: ScaledUiHealthStatus;
}): PositionHealth {
  if (
    input.qtySource === "wallet-read" &&
    input.multiplierOk &&
    input.assetOk &&
    input.priceOk &&
    input.scaledUiStatus === "match"
  ) {
    return "Verified";
  }
  if (input.multiplierOk && (input.assetOk || input.priceOk)) return "Review";
  if (input.multiplierOk) return "Review";
  return "Unavailable";
}

/** Short list/detail badge for API ↔ on-chain share count. */
export function scaledUiHealthLabel(
  status: ScaledUiHealthStatus,
): "On-chain OK" | "On-chain mismatch" | "On-chain pending" {
  if (status === "match") return "On-chain OK";
  if (status === "mismatch") return "On-chain mismatch";
  return "On-chain pending";
}

/** Status column copy — never soft-sells wallet-read without chain agreement. */
export function positionStatusLabel(input: {
  health: PositionHealth;
  qtySource: "wallet-read" | "paper";
  scaledUiStatus: ScaledUiHealthStatus;
}): string {
  if (input.health === "Verified") return "Verified";
  if (input.health === "Unavailable") return "Unavailable";
  if (input.qtySource === "paper") return "Live · est.";
  if (input.scaledUiStatus === "mismatch") return "Wallet · mismatch";
  if (input.scaledUiStatus === "unavailable") return "Wallet · pending";
  return "Review";
}
