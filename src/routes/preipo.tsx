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
          "Private-company tokens on Solana — PreStocks and Tessera, each on its own FOLIO desk.",
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
  const fillsArmed = data?.broadcastPaused === false;

  return (
    <PublicShell
      tone="credit"
      eyebrow="Pre-IPO desks"
      title="Private names. Separate rooms."
      intro="PreStocks for SPV-backed private exposure. Tessera for loan-participation T-tokens. Each stays on its own desk so the story stays clean — and the buy stays inside FOLIO."
      aside={
        <div className="metrics-grid metrics-grid-aside">
          <Metric
            label="PreStocks live"
            value={count != null ? String(count) : "—"}
            detail="Live catalog"
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
            label="Buys"
            value={fillsArmed ? "In FOLIO" : "Quote ready"}
            detail={
              fillsArmed
                ? "Confirm inside the desk"
                : "Fills arm when your account is ready"
            }
          />
        </div>
      }
    >
      <MktSection n="01" title="Public IPO ≠ private pre-IPO">
        <p>
          Buy → <b>IPO</b> is for public recent listings (Arm, Reddit xStocks).
          Private companies live on PreStocks and Tessera — never mixed into the
          public board by accident.
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
