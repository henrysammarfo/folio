import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell, Metric } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { getCreditBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/credit")({
  head: () => ({
    meta: [
      { title: "Credit Desk — FOLIO" },
      {
        name: "description",
        content: "Live Kamino / Jupiter Lend / NestUSD credit reads — no borrow broadcast.",
      },
      { property: "og:title", content: "Credit Desk — FOLIO" },
      {
        property: "og:description",
        content: "Live Kamino / Jupiter Lend / NestUSD credit reads — no borrow broadcast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search) =>
    z
      .object({
        /** Ephemeral mainnet-read inspect pubkey — not auth. */
        inspect: z.string().max(64).optional().catch(undefined),
      })
      .parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  /** Prefetch live credit honesty for first paint (NestUSD never Ready). */
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

  const aaplLtv =
    data?.kamino.ok
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
  const nestDetail =
    data && !data.nestusd.ok
      ? data.nestusd.detail ?? data.nestusd.reason
      : data?.nestusd.ok
        ? "Probed · risk-labeled"
        : "Risk / unverified";

  return (
    <PublicShell
      eyebrow="Credit without selling"
      title="Keep the shares. Test the liquidity."
      intro="Credit capacity uses live Kamino reads against paper or wallet-read quantities — never hardcoded dollar theater. NestUSD stays hidden until a verified public metrics endpoint exists. Borrow broadcast stays off on the ≤~$1 Stocklana budget."
    >
      <div className="metrics-grid">
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
              ? `AAPLx maxLtv ${(aaplLtv * 100).toFixed(0)}% · no broadcast`
              : data?.paper.maxLtvUsed != null
                ? `AAPLx maxLtv ${(data.paper.maxLtvUsed * 100).toFixed(0)}% · no broadcast`
                : "Kamino maxLtv · no broadcast"
          }
        />
        <Metric
          label="Borrow execution"
          value="Off / unavailable"
          detail={data?.borrowExecution ?? "Unfunded ≤~$1 budget"}
        />
      </div>
      <div className="protocol-list">
        <div>
          <span>Kamino</span>
          <StatusBadge tone={data?.kamino.ok ? "green" : "amber"}>
            {data?.kamino.ok
              ? "Mainnet read"
              : data && !data.kamino.ok
                ? data.kamino.reason
                : "…"}
          </StatusBadge>
          <b>
            {data?.kamino.ok
              ? `${data.kamino.data.reserves.length} xStocks reserves · AAPLx LTV ${
                  aaplLtv != null ? `${(aaplLtv * 100).toFixed(0)}%` : "—"
                }`
              : "xStocks market reserves (live LTV/APY when reachable)"}
          </b>
        </div>
        <div>
          <span>Jupiter Lend</span>
          <StatusBadge tone={data?.jupiterLend.ok ? "blue" : "amber"}>
            {data?.jupiterLend.ok
              ? "Earn vaults"
              : data && !data.jupiterLend.ok
                ? data.jupiterLend.reason
                : "…"}
          </StatusBadge>
          <b>Earn vaults observed — not an xStock borrow path</b>
        </div>
        <div>
          <span>NestUSD</span>
          <StatusBadge tone="amber">{nestDetail}</StatusBadge>
          <b>Capacity hidden until verified public metrics</b>
        </div>
      </div>
      <p className="mt-4 text-sm opacity-80">
        {data?.walletSource === "inspect"
          ? "Capacity uses ephemeral inspect wallet-read qty (not auth / not multi-tenant)."
          : "Optional: append ?inspect=<pubkey> for ephemeral mainnet-read capacity without a session secret."}
      </p>
      <p className="mt-6 text-sm">
        <Link
          to="/desk/credit"
          search={inspect ? { inspect } : {}}
          className="underline"
        >
          Open live credit desk →
        </Link>
      </p>
    </PublicShell>
  );
}
