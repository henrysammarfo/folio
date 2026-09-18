import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getActivityBundle } from "@/lib/desk.functions";

function modeLabel(mode: string): string {
  if (mode === "mainnet-read") return "Live";
  if (mode === "quote-only") return "Quote";
  if (mode === "paper") return "Saved";
  if (mode === "unavailable") return "Pending";
  return mode;
}

export const Route = createFileRoute("/desk/activity")({
  head: () => ({
    meta: [
      { title: "Activity — FOLIO" },
      {
        name: "description",
        content: "Live desk events from market feeds.",
      },
    ],
  }),
  loader: async () => getActivityBundle(),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchActivity = useServerFn(getActivityBundle);
  const { data, isFetching } = useQuery({
    queryKey: ["activity-bundle"],
    queryFn: () => fetchActivity(),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });

  return (
    <DeskShell eyebrow="Updates" title="Activity">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="quote-only">Recent</ModeBadge>
        <ModeBadge
          mode={data?.prefsFromSession ? "paper" : "unavailable"}
        >
          {data?.prefsFromSession
            ? data.corporateActionAlerts
              ? "Alerts on"
              : "Alerts off"
            : "Alerts"}
        </ModeBadge>
      </div>
      <Panel
        title="Event stream"
        meta={
          <StatusBadge tone="neutral">
            {isFetching ? "Refreshing…" : "Live"}
          </StatusBadge>
        }
      >
        <p className="mb-3 text-sm opacity-80">{data?.note}</p>
        <div className="event-list">
          {(data?.events ?? []).map((e) => (
            <div key={`${e.title}-${e.at}`}>
              <time>{new Date(e.at).toISOString().slice(11, 19)}</time>
              <span>
                <b>{e.title}</b>
                <small>{e.detail}</small>
              </span>
              <StatusBadge
                tone={
                  e.tone === "green"
                    ? "green"
                    : e.tone === "blue"
                      ? "blue"
                      : e.tone === "amber"
                        ? "amber"
                        : "neutral"
                }
              >
                {modeLabel(e.mode)}
              </StatusBadge>
            </div>
          ))}
        </div>
      </Panel>
    </DeskShell>
  );
}
