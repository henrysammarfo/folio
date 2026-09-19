import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { DeskShell, Panel } from "@/components/desk-shell";
import { DeskStatusLine } from "@/components/desk-status-line";
import { StatusBadge } from "@/components/folio-brand";
import {
  WalletLookupPanel,
  walletSourceBadge,
} from "@/components/wallet-lookup-panel";
import { getPositionsBundle } from "@/lib/desk.functions";
import {
  positionStatusLabel,
  scaledUiHealthLabel,
} from "@/lib/position-health";
import { siteMeta } from "@/lib/site-meta";

const positionsSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/positions")({
  head: () => ({
    meta: siteMeta({
      title: "Positions — FOLIO",
      description: "Your tokenized stock holdings with live share counts.",
      path: "/desk/positions",
    }),
  }),
  validateSearch: (search) => positionsSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) =>
    getPositionsBundle({
      data: { inspectWallet: deps.inspect },
    }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchPositions = useServerFn(getPositionsBundle);
  const [inspectInput, setInspectInput] = useState(inspect ?? "");
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["positions-bundle", inspect ?? ""],
    queryFn: () =>
      fetchPositions({
        data: { inspectWallet: inspect },
      }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });

  const hasWalletRead =
    data?.rows.some((r) => r.qtySource === "wallet-read") ?? false;
  const boundElsewhere =
    data?.walletSource === "watch-wallet" ||
    data?.walletSource === "membership" ||
    data?.walletSource === "session";
  const total =
    data?.rows.reduce((s, r) => s + (r.paperValueUsd ?? 0), 0) ?? 0;

  return (
    <DeskShell eyebrow="Holdings" title="Positions">
      <DeskStatusLine
        items={[
          { label: "Live share counts", tone: "live" },
          {
            label: hasWalletRead ? "Wallet balances" : "Estimated balances",
            tone: hasWalletRead ? "live" : "muted",
          },
          {
            label: walletSourceBadge(data?.walletSource, data?.auth.ok),
            tone: boundElsewhere || inspect ? "live" : "warn",
          },
        ]}
      />

      <div className="desk-hero-metrics">
        <div>
          <span>Portfolio</span>
          <b>
            {total > 0
              ? total.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </b>
        </div>
        <div>
          <span>Assets</span>
          <b>{data?.rows.length ?? 0}</b>
        </div>
        <div>
          <span>Status</span>
          <b>{isFetching ? "Refreshing" : "Live"}</b>
        </div>
      </div>

      <WalletLookupPanel
        inspectInput={inspectInput}
        onInspectInput={setInspectInput}
        inspectActive={Boolean(inspect)}
        boundElsewhere={boundElsewhere}
        onLookUp={() => {
          const next = inspectInput.trim();
          void navigate({
            search: (prev) => ({ ...prev, inspect: next || undefined }),
          });
        }}
        onClear={() => {
          setInspectInput("");
          void navigate({
            search: (prev) => {
              const { inspect: _drop, ...rest } = prev as { inspect?: string };
              return rest;
            },
          });
        }}
      />

      <Panel
        title="Watchlist"
        className="desk-card-lift"
        meta={
          <StatusBadge tone={isFetching ? "blue" : "neutral"}>
            {isFetching ? "Refreshing…" : "Live"}
          </StatusBadge>
        }
      >
        {isError ? (
          <p className="form-error">{String(error)}</p>
        ) : null}
        <p className="desk-panel-note">{data?.note}</p>
        <div className="position-cards">
          {(data?.rows ?? []).map((p) => (
            <Link
              key={p.symbol}
              to="/desk/positions/$symbol"
              params={{ symbol: p.symbol }}
              search={inspect ? { inspect } : {}}
              className="position-card"
            >
              <div className="position-card-top">
                <span className="asset-icon" aria-hidden>
                  {p.symbol[0]}
                </span>
                <div>
                  <b>{p.symbol}</b>
                  <small>{p.name}</small>
                </div>
                <ArrowUpRight className="position-card-arrow" aria-hidden />
              </div>
              <div className="position-card-grid">
                <div>
                  <span>Qty</span>
                  <strong>
                    {p.qty.toFixed(4)}{" "}
                    <em>{p.qtySource === "wallet-read" ? "wallet" : "est."}</em>
                  </strong>
                </div>
                <div>
                  <span>Share count</span>
                  <strong>
                    {p.multiplier != null ? `${p.multiplier.toFixed(4)}×` : "—"}
                  </strong>
                  <small data-testid={`positions-scaled-ui-${p.symbol}`}>
                    {scaledUiHealthLabel(p.scaledUiCompare.status)}
                  </small>
                </div>
                <div>
                  <span>Value</span>
                  <strong>
                    {p.paperValueUsd != null
                      ? p.paperValueUsd.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })
                      : "—"}
                  </strong>
                </div>
              </div>
              <StatusBadge
                tone={
                  p.health === "Verified"
                    ? "green"
                    : p.health === "Review"
                      ? "amber"
                      : "neutral"
                }
              >
                {positionStatusLabel({
                  health: p.health,
                  qtySource: p.qtySource,
                  scaledUiStatus: p.scaledUiCompare.status,
                })}
              </StatusBadge>
            </Link>
          ))}
        </div>
      </Panel>
    </DeskShell>
  );
}
