import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight } from "lucide-react";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getPositionsBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/desk/positions")({
  head: () => ({
    meta: [
      { title: "Positions — FOLIO" },
      { name: "description", content: "Paper qty × live xStock multipliers on Solana mainnet." },
      { property: "og:title", content: "Positions — FOLIO" },
      { property: "og:description", content: "Paper qty × live xStock multipliers on Solana mainnet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const fetchPositions = useServerFn(getPositionsBundle);
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["positions-bundle"],
    queryFn: () => fetchPositions(),
    staleTime: 15_000,
  });

  return (
    <DeskShell eyebrow="Ownership ledger" title="Positions">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Live multipliers</ModeBadge>
        <ModeBadge mode="paper">Paper quantities</ModeBadge>
        <ModeBadge mode={data?.auth.ok ? data.auth.mode : "unavailable"}>
          {data?.auth.ok ? "Auth ready" : "Wallet unbound"}
        </ModeBadge>
      </div>
      <Panel
        title="Watchlist"
        meta={
          <StatusBadge tone={isFetching ? "blue" : "green"}>
            {isFetching ? "Refreshing…" : "Mainnet read"}
          </StatusBadge>
        }
      >
        {isError ? <p className="text-sm text-amber-700">{String(error)}</p> : null}
        <p className="mb-3 text-sm opacity-80">{data?.note}</p>
        <div className="data-table">
          <div className="table-head">
            <span>Asset</span>
            <span>Paper raw</span>
            <span>Multiplier</span>
            <span>Economic</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {(data?.rows ?? []).map((p) => (
            <Link key={p.symbol} to="/desk/positions/$symbol" params={{ symbol: p.symbol }}>
              <span>
                <b>{p.symbol}</b>
                <small>{p.name}</small>
              </span>
              <span>{p.paperRaw.toFixed(4)}</span>
              <span>{p.multiplier != null ? `${p.multiplier.toFixed(6)}×` : "—"}</span>
              <span>{p.economicShares != null ? p.economicShares.toFixed(4) : "—"}</span>
              <span>
                {p.paperValueUsd != null
                  ? p.paperValueUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })
                  : "—"}
              </span>
              <span>
                <StatusBadge
                  tone={p.health === "Verified" ? "green" : p.health === "Review" ? "amber" : "neutral"}
                >
                  {p.health}
                </StatusBadge>
                <ArrowUpRight />
              </span>
            </Link>
          ))}
        </div>
      </Panel>
    </DeskShell>
  );
}
