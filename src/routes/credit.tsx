import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell, Metric } from "@/components/public-page";
import { getCreditBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/credit")({
  head: () => ({
    meta: [
      { title: "Credit Desk — FOLIO" },
      {
        name: "description",
        content:
          "Borrow USDC against xStocks in FOLIO — keep your shares, unlock cash.",
      },
      { property: "og:title", content: "Credit Desk — FOLIO" },
      {
        property: "og:description",
        content:
          "Borrow USDC against xStocks in FOLIO — keep your shares, unlock cash.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search) =>
    z
      .object({
        inspect: z.string().max(64).optional().catch(undefined),
      })
      .parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) =>
    getCreditBundle({ data: { inspectWallet: deps.inspect } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const fetchCredit = useServerFn(getCreditBundle);
  const { data } = useQuery({
    queryKey: ["public-credit-bundle", inspect ?? ""],
    queryFn: () => fetchCredit({ data: { inspectWallet: inspect } }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const aaplLtv = data?.kamino.ok
    ? data.kamino.data.reserves.find((r) => r.symbol === "AAPLx")?.maxLtv
    : null;
  const collateral =
    data?.paper.collateralUsd != null
      ? data.paper.collateralUsd.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : "—";
  const borrow =
    data?.paper.illustrativeBorrowUsd != null
      ? data.paper.illustrativeBorrowUsd.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : "—";

  return (
    <PublicShell
      tone="credit"
      eyebrow="Credit without selling"
      title="Keep the shares. Unlock the cash."
      intro="Deposit stock collateral and borrow USDC inside FOLIO. Your wallet signs every step. NestUSD risk metrics stay visible — Nest execute still lives on their app."
      aside={
        <div className="metrics-grid metrics-grid-aside">
          <Metric
            label={
              data?.paper.label === "wallet-read"
                ? "Wallet-read collateral"
                : "Paper collateral"
            }
            value={collateral}
            detail={data?.paper.note ?? "Live marks · labeled qty"}
          />
          <Metric
            label="Illustrative capacity"
            value={borrow}
            detail={
              aaplLtv != null
                ? `AAPLx max LTV ${(aaplLtv * 100).toFixed(0)}% · live`
                : data?.paper.maxLtvUsed != null
                  ? `AAPLx max LTV ${(data.paper.maxLtvUsed * 100).toFixed(0)}% · live`
                  : "Live LTV when markets respond"
            }
          />
          <Metric
            label="Borrow in FOLIO"
            value={
              data?.borrowExecution === "kamino-inhouse"
                ? data.broadcastPaused
                  ? "Ready · fills paused"
                  : "Live in-desk"
                : data?.borrowExecution === "nestusd-metrics"
                  ? "Metrics only"
                  : data?.borrowExecution === "unavailable"
                    ? "Unavailable"
                    : "…"
            }
            detail={
              data?.borrowExecution === "kamino-inhouse"
                ? data.broadcastPaused
                  ? "Deposit & borrow arm when fills are on"
                  : "You sign · FOLIO never invents a loan"
                : "No live borrow rail yet"
            }
          />
        </div>
      }
    >
      <div className="protocol-list" aria-label="Credit protocol reads">
        <div>
          <header>
            <span>Kamino</span>
            <em data-ok={String(Boolean(data?.kamino.ok))}>
              {data?.kamino.ok
                ? "Mainnet read"
                : data && !data.kamino.ok
                  ? "Unavailable"
                  : "…"}
            </em>
          </header>
          <p>
            {data?.kamino.ok
              ? `${data.kamino.data.reserves.length} reserves · AAPLx LTV ${
                  aaplLtv != null ? `${(aaplLtv * 100).toFixed(0)}%` : "—"
                } · borrow inside FOLIO`
              : data && !data.kamino.ok
                ? data.kamino.reason
                : "Live LTV and APY when markets respond"}
          </p>
        </div>
        <div>
          <header>
            <span>Jupiter Lend</span>
            <em data-ok={String(Boolean(data?.jupiterLend.ok))}>
              {data?.jupiterLend.ok
                ? "Earn vaults"
                : data && !data.jupiterLend.ok
                  ? "Unavailable"
                  : "…"}
            </em>
          </header>
          <p>
            {data?.jupiterLend.ok
              ? "Earn vaults observed — not an xStock borrow path"
              : data && !data.jupiterLend.ok
                ? data.jupiterLend.reason
                : "Earn vaults when reachable"}
          </p>
        </div>
        <div>
          <header>
            <span>Nest.credit</span>
            <em data-ok={String(Boolean(data?.nestCredit.ok))}>
              {data?.nestCredit.ok
                ? `${data.nestCredit.data.vaultCount} vaults`
                : data && !data.nestCredit.ok
                  ? "Unavailable"
                  : "…"}
            </em>
          </header>
          <p>
            {data?.nestCredit.ok
              ? `Indexed TVL ~$${Math.round(data.nestCredit.data.totalTvlUsd).toLocaleString()} · vault awareness · not NestUSD borrow`
              : data && !data.nestCredit.ok
                ? data.nestCredit.reason
                : "Vault awareness when reachable — not NestUSD capacity"}
          </p>
        </div>
        <div>
          <header>
            <span>NestUSD</span>
            <em
              data-ok={String(
                Boolean(data?.nestusd.ok && data.nestusd.data.status === "live"),
              )}
            >
              {data?.nestusd.ok
                ? data.nestusd.data.status === "live"
                  ? "Live metrics"
                  : "Paused"
                : data && !data.nestusd.ok
                  ? "Unavailable"
                  : "…"}
            </em>
          </header>
          <p>
            {data?.nestusd.ok
              ? `${data.nestusd.data.collaterals.length} collaterals · risk LTV labeled in Borrow`
              : data && !data.nestusd.ok
                ? (data.nestusd.detail ?? data.nestusd.reason)
                : "Live risk metrics when reachable"}
          </p>
        </div>
      </div>
      <p className="mkt-note">
        {data?.walletSource === "inspect"
          ? "Capacity uses a temporary wallet inspect (public read · not a signed session)."
          : "Tip: append ?inspect=<wallet> to preview capacity without signing in."}
      </p>
      <p className="mkt-links">
        <Link to="/desk/credit" search={inspect ? { inspect } : {}}>
          Open live credit desk →
        </Link>
      </p>
    </PublicShell>
  );
}
