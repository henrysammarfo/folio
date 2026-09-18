import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { TradingViewChart } from "@/components/tradingview-chart";
import { getPositionsBundle } from "@/lib/desk.functions";
import { scaledUiHealthLabel } from "@/lib/position-health";

const detailSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/positions_/$symbol")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol} — FOLIO` },
      {
        name: "description",
        content: `Live chart and share count for ${params.symbol}.`,
      },
    ],
  }),
  validateSearch: (search) => detailSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) =>
    getPositionsBundle({
      data: { inspectWallet: deps.inspect },
    }),
  component: Page,
});

function Page() {
  const { symbol } = Route.useParams();
  const { inspect } = Route.useSearch();
  const initial = Route.useLoaderData();
  const fetchPositions = useServerFn(getPositionsBundle);
  const { data, isFetching } = useQuery({
    queryKey: ["positions-bundle", inspect ?? ""],
    queryFn: () =>
      fetchPositions({
        data: { inspectWallet: inspect },
      }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });
  const row = data?.rows.find((r) => r.symbol.toLowerCase() === symbol.toLowerCase());

  return (
    <DeskShell
      eyebrow="Position"
      title={symbol}
      actions={
        <Link
          to="/desk/positions"
          search={inspect ? { inspect } : {}}
          className="text-sm underline"
        >
          All positions
        </Link>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Live chart</ModeBadge>
        <ModeBadge mode={row?.qtySource === "wallet-read" ? "mainnet-read" : "paper"}>
          {row?.qtySource === "wallet-read" ? "Wallet qty" : "Estimated qty"}
        </ModeBadge>
      </div>

      <div className="acquire-layout mb-4">
        <Panel title="Market" meta={<StatusBadge tone="blue">Live</StatusBadge>}>
          <TradingViewChart symbol={symbol} height={380} interval="D" theme="light" />
        </Panel>
        <Panel
          title={row?.name ?? symbol}
          meta={
            <StatusBadge
              tone={
                isFetching
                  ? "blue"
                  : row?.qtySource === "wallet-read"
                    ? "green"
                    : "neutral"
              }
            >
              {isFetching ? "…" : row?.qtySource === "wallet-read" ? "Wallet" : "Estimate"}
            </StatusBadge>
          }
        >
          {!row ? (
            <p>No live row for {symbol}. Open from the positions list.</p>
          ) : (
            <div className="policy-list">
              <p>
                <span>Quantity</span>
                <b>
                  {row.qty.toFixed(4)}{" "}
                  <small>
                    ({row.qtySource === "wallet-read" ? "wallet" : "est."})
                  </small>
                </b>
              </p>
              <p>
                <span>Share count</span>
                <b>
                  {row.multiplier != null
                    ? `${row.multiplier.toFixed(6)}×`
                    : "unavailable"}
                </b>
              </p>
              <p>
                <span>Pending split / dividend</span>
                <b>
                  {row.pendingMultiplier != null
                    ? `${row.pendingMultiplier.toFixed(6)}×`
                    : row.multiplier != null
                      ? "None"
                      : "unavailable"}
                </b>
              </p>
              <p data-testid="position-scaled-ui-compare">
                <span>On-chain check</span>
                <b>
                  {row.onchainEffectiveMultiplier != null
                    ? `${row.onchainEffectiveMultiplier.toFixed(6)}×`
                    : "pending"}{" "}
                  <small>({scaledUiHealthLabel(row.scaledUiCompare.status)})</small>
                </b>
              </p>
              <p>
                <span>Economic shares</span>
                <b>
                  {row.economicShares != null
                    ? row.economicShares.toFixed(6)
                    : "—"}
                </b>
              </p>
              <p>
                <span>Market price</span>
                <b>
                  {row.usdPrice != null
                    ? row.usdPrice.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : "—"}
                </b>
              </p>
              <p>
                <span>Value</span>
                <b>
                  {row.paperValueUsd != null
                    ? row.paperValueUsd.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : "—"}
                </b>
              </p>
            </div>
          )}
        </Panel>
      </div>
      <div className="mt-3">
        <Link
          to="/desk/acquire"
          className="desk-topbar-cta"
          style={{ display: "inline-flex" }}
        >
          Buy {symbol}
        </Link>
      </div>
    </DeskShell>
  );
}
