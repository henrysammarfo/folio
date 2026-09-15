import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getCreditBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/desk/credit")({
  head: () => ({
    meta: [
      { title: "Credit — FOLIO" },
      { name: "description", content: "Labeled Kamino / Jupiter Lend / NestUSD credit reads." },
    ],
  }),
  component: Page,
});

function Page() {
  const fetchCredit = useServerFn(getCreditBundle);
  const { data, isFetching } = useQuery({
    queryKey: ["credit-bundle"],
    queryFn: () => fetchCredit(),
    staleTime: 20_000,
  });

  const reserves = data?.kamino.ok ? data.kamino.data.reserves : [];

  return (
    <DeskShell eyebrow="Collateral workspace" title="Credit">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Market reads</ModeBadge>
        <ModeBadge mode="fork">Borrow CPI = fork</ModeBadge>
        <ModeBadge mode="paper">Paper capacity</ModeBadge>
      </div>
      <div className="desk-grid">
        <Panel
          title="Illustrative capacity"
          meta={<StatusBadge tone="blue">{isFetching ? "…" : "Paper × live LTV"}</StatusBadge>}
        >
          <div className="credit-output">
            <span>Paper collateral (live marks)</span>
            <b>
              {data?.paper.collateralUsd != null
                ? data.paper.collateralUsd.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })
                : "—"}
            </b>
            <small>
              AAPLx maxLtv {data?.paper.maxLtvUsed != null ? `${(data.paper.maxLtvUsed * 100).toFixed(0)}%` : "—"} ·
              illustrative borrow{" "}
              {data?.paper.illustrativeBorrowUsd != null
                ? data.paper.illustrativeBorrowUsd.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })
                : "—"}
            </small>
            <small>{data?.paper.note}</small>
          </div>
        </Panel>
        <Panel title="Provider paths">
          <div className="policy-list">
            <p>
              <span>Kamino xStocks</span>
              <StatusBadge tone={data?.kamino.ok ? "green" : "amber"}>
                {data?.kamino.ok ? "Mainnet read" : data && !data.kamino.ok ? data.kamino.reason : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Jupiter Lend earn</span>
              <StatusBadge tone={data?.jupiterLend.ok ? "blue" : "amber"}>
                {data?.jupiterLend.ok ? "Earn vaults" : data && !data.jupiterLend.ok ? data.jupiterLend.reason : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>NestUSD</span>
              <StatusBadge tone="amber">
                {data?.nestusd.ok ? "Ready" : data && !data.nestusd.ok ? data.nestusd.reason : "Risk / unverified"}
              </StatusBadge>
            </p>
            <p>
              <span>Borrow execution</span>
              <StatusBadge tone="neutral">{data?.borrowExecution ?? "local-fork-or-unavailable"}</StatusBadge>
            </p>
          </div>
        </Panel>
      </div>
      <Panel title="Kamino reserves (live)" meta={<StatusBadge tone="green">xStocks market</StatusBadge>}>
        <div className="data-table">
          <div className="table-head">
            <span>Asset</span>
            <span>Max LTV</span>
            <span>Borrow APY</span>
            <span>Supply</span>
            <span>Borrow</span>
          </div>
          {reserves.slice(0, 12).map((r) => (
            <div key={r.mint}>
              <span>
                <b>{r.symbol}</b>
              </span>
              <span>{(r.maxLtv * 100).toFixed(0)}%</span>
              <span>{(r.borrowApy * 100).toFixed(2)}%</span>
              <span>{r.totalSupply.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span>{r.totalBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      </Panel>
    </DeskShell>
  );
}
