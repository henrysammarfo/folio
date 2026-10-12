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
  const walletRead = rows.some((r) => r.qtySource === "wallet-read");
  const walletHasStock = rows.some(
    (r) => r.qtySource === "wallet-read" && r.qty > 0,
  );
  const total = rows.reduce((s, r) => s + (r.paperValueUsd ?? 0), 0);
  const borrow = credit.data?.paper.illustrativeBorrowUsd;
  const borrowIsWallet = credit.data?.paper.label === "wallet-read";
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
          <p className="fx-hero-kicker">
            {walletRead
              ? walletHasStock
                ? "Your portfolio"
                : "Your portfolio · empty"
              : "Demo preview"}
          </p>
          <h1 className="fx-hero-value">
            {walletRead && !walletHasStock
              ? money(0)
              : total > 0
                ? money(total)
                : "—"}
          </h1>
          <p className="fx-hero-sub">
            {walletRead && !walletHasStock
              ? "No stocks yet — add USDC + a little SOL on Account, then Buy."
              : borrowIsWallet && borrow != null && borrow > 0
                ? `Borrowing power up to ${money(borrow)}`
                : !walletRead
                  ? "Not your money — Open App to create a wallet, then Buy real stocks."
                  : "Hold stocks. Borrow against them without selling."}
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
          {!walletRead ? (
            <Link to="/desk/settings" className="fx-btn fx-btn-ghost">
              Open App
            </Link>
          ) : null}
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

            <h2 className="fx-section-title">
              {walletRead ? "Holdings" : "Demo holdings"}
            </h2>
            <div className="fx-card">
              {walletRead && !walletHasStock ? (
                <p className="fx-sub" style={{ padding: "1rem 1.1rem" }}>
                  Empty wallet. Buy stocks to see them here.
                </p>
              ) : (
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
                          <small>
                            {p.name}
                            {!walletRead ? " · demo" : ""}
                          </small>
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
              )}
            </div>
          </div>
        </div>
      </section>
    </DeskShell>
  );
}
