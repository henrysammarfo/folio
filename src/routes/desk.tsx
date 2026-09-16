import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getEmpireReadiness, getLabApprovals } from "@/lib/desk.functions";

export const Route = createFileRoute("/desk")({
  /**
   * Prefetch Henry-approved chrome + Empire key flags so Netro overview
   * paints without classic flash and keys strip is SSR-honest.
   */
  loader: async () => {
    const [approvals, readiness] = await Promise.all([
      getLabApprovals(),
      getEmpireReadiness(),
    ]);
    return { approvals, readiness };
  },
  component: DeskLayout,
});

function DeskLayout() {
  return <Outlet />;
}
