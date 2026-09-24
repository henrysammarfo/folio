import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DeskShell } from "@/components/desk-shell";
import { getActivityBundle } from "@/lib/desk.functions";
import { humanizeHonestyNote, humanizeWashNote } from "@/lib/humanize-copy";
import { siteMeta } from "@/lib/site-meta";

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

function humanizeActivityDetail(title: string, detail: string): string {
  if (/wash/i.test(title)) return humanizeWashNote(detail);
  return humanizeHonestyNote(detail) || detail;
}

function Page() {
  const initial = Route.useLoaderData();
  const fetchActivity = useServerFn(getActivityBundle);
  const { data } = useQuery({
    queryKey: ["activity-bundle"],
    queryFn: () => fetchActivity(),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });

  return (
    <DeskShell title="Activity">
      <section className="fx-page">
        <header className="fx-hero" style={{ marginBottom: "1rem" }}>
          <h1 className="fx-title">Activity</h1>
          <p className="fx-sub">Live market checks for your desk.</p>
        </header>

        <div className="fx-card">
          <ul className="fx-feed" aria-label="Activity">
            {(data?.events ?? []).map((e) => (
              <li key={`${e.title}-${e.at}`}>
                <span className="fx-feed-dot" aria-hidden>
                  {e.title.slice(0, 1)}
                </span>
                <div>
                  <strong>{e.title}</strong>
                  <p>{humanizeActivityDetail(e.title, e.detail)}</p>
                </div>
                <time dateTime={e.at}>
                  {new Date(e.at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        </div>
        {data?.note ? (
          <p className="fx-sub" style={{ marginTop: "1rem" }}>
            {humanizeHonestyNote(data.note)}
          </p>
        ) : null}
      </section>
    </DeskShell>
  );
}
