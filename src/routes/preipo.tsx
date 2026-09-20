import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell, Metric } from "@/components/public-page";
import { getPreipoBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/preipo")({
  head: () => ({
    meta: [
      { title: "Pre-IPO — FOLIO" },
      {
        name: "description",
        content:
          "PreStocks private-company tokens on Solana — live catalog, quote-only desk.",
      },
    ],
  }),
  loader: async () => getPreipoBundle({ data: { spendUsdc: 1 } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchPreipo = useServerFn(getPreipoBundle);
  const { data } = useQuery({
    queryKey: ["public-preipo"],
    queryFn: () => fetchPreipo({ data: { spendUsdc: 1 } }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 30_000,
  });

  const count = data?.catalog.ok ? data.catalog.data.rows.length : null;
  const sample = data?.selected;

  return (
    <PublicShell
      tone="credit"
      eyebrow="PreStocks · Stocklana"
      title="Own the private name. Keep the lanes honest."
      intro="Pre-IPO on FOLIO means PreStocks issued tokens — live from prestocks.com. Tessera T-tokens live on a separate desk so each Stocklana bounty stays eligible."
    >
      <div className="metrics-grid">
        <Metric
          label="PreStocks live"
          value={count != null ? String(count) : "—"}
          detail="Rows from prestocks.com/api/prestocks"
        />
        <Metric
          label="Sample mark"
          value={
            sample?.tokenPrice != null
              ? `$${sample.tokenPrice.toFixed(0)}`
              : "—"
          }
          detail={sample ? sample.symbol : "Awaiting catalog"}
        />
        <Metric
          label="Fills"
          value="Paused"
          detail="Jupiter quote-only · ≤~$1 Stocklana budget"
        />
      </div>

      <section className="mkt-block">
        <h2>What “IPO lane” is not</h2>
        <p>
          Buy → <b>IPO</b> is for <em>public</em> recent listings (Arm, Reddit
          xStocks). Private companies are PreStocks / Tessera — never silently
          mixed into the public IPO chip.
        </p>
        <p className="mkt-links">
          <Link to="/desk/preipo">Open PreStocks desk →</Link>
          <Link to="/desk/tessera">Tessera desk →</Link>
          <Link to="/markets">Full market map →</Link>
        </p>
      </section>
    </PublicShell>
  );
}
