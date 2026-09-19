import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DeskShell } from "@/components/desk-shell";
import { TradingViewChart } from "@/components/tradingview-chart";
import { getPositionsBundle } from "@/lib/desk.functions";
import { scaledUiHealthLabel } from "@/lib/position-health";
import { siteMeta } from "@/lib/site-meta";

const detailSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/positions_/$symbol")({
  head: ({ params }) => ({
    meta: siteMeta({
      title: `${params.symbol} — FOLIO`,
      description: `Live chart and share count for ${params.symbol}.`,
      path: `/desk/positions/${params.symbol}`,
    }),
  }),
  validateSearch: (search) => detailSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) =>
    getPositionsBundle({ data: { inspectWallet: deps.inspect } }),
  component: Page,
});

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function Page() {
  const { symbol } = Route.useParams();
  const { inspect } = Route.useSearch();
  const initial = Route.useLoaderData();
  const fetchPositions = useServerFn(getPositionsBundle);
  const { data } = useQuery({
    queryKey: ["positions-bundle", inspect ?? ""],
    queryFn: () => fetchPositions({ data: { inspectWallet: inspect } }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });
  const row = data?.rows.find(
    (r) => r.symbol.toLowerCase() === symbol.toLowerCase(),
  );

  return (
    <DeskShell
      title={symbol}
      actions={
        <Link
          to="/desk/positions"
          search={inspect ? { inspect } : {}}
          className="fx-text-btn"
        >
          All holdings
        </Link>
      }
    >
      <section className="fx-buy fx-page">
        <div className="fx-card fx-buy-chart">
          <TradingViewChart
            symbol={symbol}
            height={380}
            interval="D"
            theme="light"
          />
        </div>
        <aside className="fx-card fx-ticket">
          <p className="fx-hero-kicker">{row?.name ?? symbol}</p>
          <h1 className="fx-hero-value" style={{ fontSize: "2.4rem" }}>
            {row?.paperValueUsd != null ? money(row.paperValueUsd) : "—"}
          </h1>
          <ul className="fx-kv">
            <li>
              <span>Shares</span>
              <b>
                {row ? row.qty.toFixed(4) : "—"}{" "}
                {row?.qtySource === "wallet-read" ? "" : "est."}
              </b>
            </li>
            <li>
              <span>Share count</span>
              <b>
                {row?.multiplier != null
                  ? `${row.multiplier.toFixed(6)}×`
                  : "—"}
              </b>
            </li>
            <li data-testid="position-scaled-ui-compare">
              <span>On-chain check</span>
              <b>
                {row
                  ? scaledUiHealthLabel(row.scaledUiCompare.status)
                  : "—"}
              </b>
            </li>
            <li>
              <span>Pending CA</span>
              <b>
                {row?.pendingMultiplier != null
                  ? `${row.pendingMultiplier.toFixed(6)}×`
                  : "None"}
              </b>
            </li>
          </ul>
          <Link to="/desk/acquire" className="fx-btn fx-btn-primary fx-btn-block">
            Buy {symbol}
          </Link>
        </aside>
      </section>
    </DeskShell>
  );
}
