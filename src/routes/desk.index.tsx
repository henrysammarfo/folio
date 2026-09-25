import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AllocationChart, paletteFor } from "@/components/allocation-chart";
import { AssetLogo } from "@/components/asset-logo";
import { DeskShell } from "@/components/desk-shell";
import { TradingViewChart } from "@/components/tradingview-chart";
import {
  getCreditBundle,
  getPositionsBundle,
} from "@/lib/desk.functions";
import {
  creditQueryKey,
  DESK_SYNC,
  positionsQueryKey,
} from "@/lib/desk-query-keys";
import { siteMeta } from "@/lib/site-meta";

const deskSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/")({
  head: () => ({
    meta: siteMeta({
      title: "Desk — FOLIO",
      description: "Buy, hold, and borrow tokenized stocks on Solana.",
      path: "/desk",
    }),
  }),
  validateSearch: (search) => deskSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) => {
    const [positions, credit] = await Promise.all([
      getPositionsBundle({ data: { inspectWallet: deps.inspect } }),
      getCreditBundle({ data: { inspectWallet: deps.inspect } }),
    ]);
    return { positions, credit };
  },
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
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const fetchPositions = useServerFn(getPositionsBundle);
  const fetchCredit = useServerFn(getCreditBundle);
  const positions = useQuery({
    queryKey: positionsQueryKey(inspect),
    queryFn: () => fetchPositions({ data: { inspectWallet: inspect } }),
    initialData: initial.positions,
    initialDataUpdatedAt: Date.now(),
    staleTime: DESK_SYNC.positionsStaleMs,
    refetchInterval: DESK_SYNC.positionsRefetchMs,
    refetchOnMount: "always",
  });
  const credit = useQuery({
    queryKey: creditQueryKey(inspect),
    queryFn: () => fetchCredit({ data: { inspectWallet: inspect } }),
    initialData: initial.credit,
    initialDataUpdatedAt: Date.now(),
    staleTime: DESK_SYNC.creditStaleMs,
    refetchInterval: DESK_SYNC.positionsRefetchMs,
    refetchOnMount: "always",
  });

  const rows = positions.data?.rows ?? [];
  const total = rows.reduce((s, r) => s + (r.paperValueUsd ?? 0), 0);
  const borrow = credit.data?.paper.illustrativeBorrowUsd;
  const featured = rows[0]?.symbol ?? "AAPLx";
  const parts = rows
    .filter((r) => (r.paperValueUsd ?? 0) > 0)
    .map((r, i) => ({
      label: r.symbol,
      value: r.paperValueUsd ?? 0,
      color: paletteFor(i),
    }));

  return (
    <DeskShell title="Home">
      <section className="fx-page fx-home">
        <header className="fx-hero">
          <p className="fx-hero-kicker">Your portfolio</p>
          <h1 className="fx-hero-value">{total > 0 ? money(total) : "—"}</h1>
          <p className="fx-hero-sub">
            {borrow != null
              ? `Borrowing power up to ${money(borrow)}`
              : "Borrowing opens soon"}
          </p>
        </header>

        <div className="fx-actions">
          <Link to="/desk/acquire" className="fx-btn fx-btn-primary">
            Buy
          </Link>
          <Link to="/desk/credit" className="fx-btn fx-btn-ghost">
            Borrow
          </Link>
          <Link to="/desk/positions" className="fx-btn fx-btn-ghost">
            Holdings
          </Link>
        </div>

        <div className="fx-home-grid">
          <div className="fx-card fx-home-chart">
            <div className="fx-home-chart-head">
              <div>
                <p className="fx-hero-kicker">{featured}</p>
                <h2 className="fx-home-chart-title">Live chart</h2>
              </div>
              <Link
                to="/desk/positions/$symbol"
                params={{ symbol: featured }}
                search={inspect ? { inspect } : {}}
                className="fx-text-btn"
              >
                Open
              </Link>
            </div>
            <TradingViewChart
              symbol={featured}
              height={360}
              interval="60"
              theme="light"
            />
          </div>

          <div className="fx-home-side">
            {parts.length > 0 ? <AllocationChart parts={parts} /> : null}

            <h2 className="fx-section-title">Holdings</h2>
            <div className="fx-card">
              <ul className="fx-list">
                {rows.slice(0, 5).map((p) => (
                  <li key={p.symbol}>
                    <Link
                      to="/desk/positions/$symbol"
                      params={{ symbol: p.symbol }}
                      search={inspect ? { inspect } : {}}
                      className="fx-asset"
                    >
                      <AssetLogo symbol={p.symbol} logo={p.logo} size={40} />
                      <span className="fx-asset-main">
                        <strong>{p.symbol}</strong>
                        <small>{p.name}</small>
                      </span>
                      <span className="fx-asset-right">
                        <strong>
                          {p.paperValueUsd != null
                            ? money(p.paperValueUsd)
                            : "—"}
                        </strong>
                        <small>
                          {p.usdPrice != null
                            ? `$${p.usdPrice.toFixed(2)}`
                            : "Live"}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </DeskShell>
  );
}
