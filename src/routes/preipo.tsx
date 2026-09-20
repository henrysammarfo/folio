import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell, Metric, MktSection } from "@/components/public-page";
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
      title="Private names. Separate desks."
      intro="Pre-IPO on FOLIO means PreStocks issued tokens — live from prestocks.com. Tessera T-tokens live on their own desk so each bounty stays eligible."
      aside={
        <div className="metrics-grid metrics-grid-aside">
          <Metric
            label="PreStocks live"
            value={count != null ? String(count) : "—"}
            detail="prestocks.com catalog"
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
            detail="Quote-only · ≤~$1 budget"
          />
        </div>
      }
    >
      <MktSection n="01" title="What IPO lane is not">
        <p>
          Buy → <b>IPO</b> is for <em>public</em> recent listings (Arm, Reddit
          xStocks). Private companies are PreStocks / Tessera — never silently
          mixed into the public IPO chip.
        </p>
      </MktSection>

      <MktSection n="02" title="Open the desks">
        <p className="mkt-links">
          <Link to="/desk/preipo">PreStocks desk →</Link>
          <Link to="/desk/tessera">Tessera desk →</Link>
          <Link to="/markets">Full market map →</Link>
        </p>
      </MktSection>
    </PublicShell>
  );
}
