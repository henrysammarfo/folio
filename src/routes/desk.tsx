import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getLabApprovals } from "@/lib/desk.functions";

export const Route = createFileRoute("/desk")({
  /** Prefetch Henry-approved chrome so Netro overview paints without classic flash. */
  loader: () => getLabApprovals(),
  component: DeskLayout,
});

function DeskLayout() {
  return <Outlet />;
}
