import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DeskShell } from "@/components/desk-shell";
import { getMeteoraDbcBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/desk/dbc")({
  head: () => ({
    meta: siteMeta({
      title: "Meteora DBC — FOLIO",
      description:
        "Separate Meteora DBC pool awareness lane — not xStock economic truth.",
      path: "/desk/dbc",
    }),
  }),
  loader: async () => getMeteoraDbcBundle(),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchDbc = useServerFn(getMeteoraDbcBundle);
  const { data } = useQuery({
    queryKey: ["meteora-dbc"],
    queryFn: () => fetchDbc(),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 30_000,
  });

  const ok = data?.dbc.ok;
  const sample = ok ? data.dbc.data.sample : [];
  const total = ok ? data.dbc.data.totalPools : null;

  return (
    <DeskShell title="DBC">
      <section className="fx-page">
        <header className="fx-hero">
          <p className="fx-hero-kicker">Separate lane</p>
          <h1 className="fx-hero-value">
            {total != null ? total.toLocaleString("en-US") : "—"}
          </h1>
          <p className="fx-hero-sub">
            {data?.note ??
              "Meteora DBC awareness — not FOLIO xStock truth or wash spine."}
          </p>
        </header>

        <div className="fx-actions">
          <a
            href={data?.docsUrl}
            className="fx-btn fx-btn-primary"
            target="_blank"
            rel="noreferrer"
            data-testid="dbc-docs"
          >
            Meteora DBC docs
          </a>
          <Link to="/desk/acquire" className="fx-btn fx-btn-ghost">
            Back to xStock buy
          </Link>
          <Link to="/network" className="fx-btn fx-btn-ghost">
            Network matrix
          </Link>
        </div>

        {sample.length > 0 ? (
          <>
            <h2 className="fx-section-title">Sample pools (mainnet-read)</h2>
            <div className="fx-card">
              <ul className="fx-list" data-testid="dbc-pool-rows">
                {sample.map((p, i) => (
                  <li key={p.address} className="fx-asset" style={{ cursor: "default" }}>
                    <span
                      className="fx-asset-mark"
                      style={{ background: i % 2 ? "#0B1220" : "#0EA5C9" }}
                      aria-hidden
                    >
                      {p.baseSymbol[0]}
                    </span>
                    <span className="fx-asset-main">
                      <strong>
                        {p.baseSymbol}/{p.quoteSymbol}
                      </strong>
                      <small>
                        {p.address.slice(0, 4)}…{p.address.slice(-4)}
                      </small>
                    </span>
                    <span className="fx-asset-right">
                      <strong>DBC</strong>
                      <small>awareness</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="fx-sub" data-testid="dbc-unavailable">
            {ok === false && data?.dbc && !data.dbc.ok
              ? `${data.dbc.reason}${data.dbc.detail ? ` — ${data.dbc.detail}` : ""}`
              : "No DBC sample rows."}
          </p>
        )}

        <p className="fx-sub" style={{ marginTop: "1.25rem" }}>
          FOLIO does not assemble DBC launch or swap CPI on this desk. Use the
          Meteora docs / Invent CLI for launches. xStock buy still runs wash +
          Jupiter quote-only.
        </p>
      </section>
    </DeskShell>
  );
}
