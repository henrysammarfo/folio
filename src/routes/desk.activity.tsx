import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DeskShell } from "@/components/desk-shell";
import { getActivityBundle } from "@/lib/desk.functions";
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
      <section className="prod-page">
        <header className="prod-lead compact">
          <h1 className="prod-page-title">Activity</h1>
          <p className="prod-sub">Live market checks for your desk.</p>
        </header>

        <ul className="prod-feed" aria-label="Activity">
          {(data?.events ?? []).map((e) => (
            <li key={`${e.title}-${e.at}`}>
              <time dateTime={e.at}>
                {new Date(e.at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              <div>
                <strong>{e.title}</strong>
                <p>{e.detail}</p>
              </div>
            </li>
          ))}
        </ul>
        {data?.note ? (
          <p className="prod-sub" style={{ marginTop: "1.5rem" }}>
            {data.note}
          </p>
        ) : null}
      </section>
    </DeskShell>
  );
}
