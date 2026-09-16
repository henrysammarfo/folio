import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  getAcquireBundle,
  getCreditBundle,
  getEmpireReadiness,
  getLabApprovals,
  getNetworkBundle,
  getPositionsBundle,
  getTruthBundle,
} from "@/lib/desk.functions";

export const Route = createFileRoute("/desk")({
  /**
   * Prefetch Henry-approved chrome + Empire key flags + live Block 0 spine
   * so Netro overview SSR paints real × / matrix / LTV / quote — not
   * “live pending” / Unavailable defaults until client hydrate.
   */
  loader: async () => {
    const [
      approvals,
      readiness,
      truth,
      network,
      credit,
      acquire,
      positions,
    ] = await Promise.all([
      getLabApprovals(),
      getEmpireReadiness(),
      getTruthBundle({ data: { symbol: "AAPLx" } }),
      getNetworkBundle(),
      getCreditBundle({ data: {} }),
      getAcquireBundle({ data: { symbol: "AAPLx", spendUsdc: 1 } }),
      getPositionsBundle({ data: {} }),
    ]);
    return {
      approvals,
      readiness,
      truth,
      network,
      credit,
      acquire,
      positions,
    };
  },
  component: DeskLayout,
});

function DeskLayout() {
  return <Outlet />;
}
