import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DeskShell, Panel } from "@/components/desk-shell";
import { DeskStatusLine } from "@/components/desk-status-line";
import { StatusBadge } from "@/components/folio-brand";
import { getActivityBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

function modeLabel(mode: string): string {
  if (mode === "mainnet-read") return "Live";
  if (mode === "quote-only") return "Quote";
  if (mode === "paper") return "Saved";
  if (mode === "unavailable") return "Pending";
  return mode;
}

export const Route = createFileRoute("/desk/activity")({
  head: () => ({
    meta: siteMeta({
      title: "Activity — FOLIO",
      description: "Live desk events from market feeds.",
      path: "/desk/activity",
    }),
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
      <DeskStatusLine
        items={[
          { label: "Live feed", tone: "live" },
          {
            label: data?.prefsFromSession
              ? data.corporateActionAlerts
                ? "Alerts on"
                : "Alerts off"
              : "Alerts optional",
            tone: data?.prefsFromSession ? "live" : "muted",
          },
        ]}
      />

      <Panel
        title="What’s happening"
        className="desk-card-lift"
        meta={
          <StatusBadge tone="neutral">
            {isFetching ? "Refreshing…" : "Live"}
          </StatusBadge>
        }
      >
        <p className="desk-panel-note">{data?.note}</p>
        <ol className="activity-timeline">
          {(data?.events ?? []).map((e) => (
            <li key={`${e.title}-${e.at}`}>
              <time dateTime={e.at}>
                {new Date(e.at).toISOString().slice(11, 19)} UTC
              </time>
              <div>
                <b>{e.title}</b>
                <small>{e.detail}</small>
              </div>
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
            </li>
          ))}
        </ol>
      </Panel>
    </DeskShell>
  );
}
