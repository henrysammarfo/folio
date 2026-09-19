import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { DeskShell, Panel } from "@/components/desk-shell";
import { DeskStatusLine } from "@/components/desk-status-line";
import { StatusBadge } from "@/components/folio-brand";
import {
  WalletLookupPanel,
  walletSourceBadge,
} from "@/components/wallet-lookup-panel";
import { getCreditBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

const creditSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/credit")({
  head: () => ({
    meta: siteMeta({
      title: "Credit — FOLIO",
      description: "Borrow against tokenized stocks without selling.",
      path: "/desk/credit",
    }),
  }),
  validateSearch: (search) => creditSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) =>
    getCreditBundle({ data: { inspectWallet: deps.inspect } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchCredit = useServerFn(getCreditBundle);
  const [inspectInput, setInspectInput] = useState(inspect ?? "");
  const { data, isFetching } = useQuery({
    queryKey: ["credit-bundle", inspect ?? ""],
    queryFn: () => fetchCredit({ data: { inspectWallet: inspect } }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const reserves = data?.kamino.ok ? data.kamino.data.reserves : [];
  const walletRead = data?.paper.label === "wallet-read";
  const boundElsewhere =
    data?.walletSource === "watch-wallet" ||
    data?.walletSource === "membership" ||
    data?.walletSource === "session";

  return (
    <DeskShell eyebrow="Borrow" title="Credit">
      <DeskStatusLine
        items={[
          { label: "Live markets", tone: "live" },
          { label: "Borrow paused", tone: "warn" },
          {
            label: walletSourceBadge(data?.walletSource),
            tone: boundElsewhere || inspect ? "live" : "muted",
          },
        ]}
      />

      <div className="credit-hero">
        <div>
          <span>
            {walletRead ? "You could borrow up to" : "Estimated borrow power"}
          </span>
          <b>
            {data?.paper.illustrativeBorrowUsd != null
              ? data.paper.illustrativeBorrowUsd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </b>
          <small>
            {data?.paper.maxLtvUsed != null
              ? `${(data.paper.maxLtvUsed * 100).toFixed(0)}% max LTV on AAPLx`
              : "Connect a wallet for a tighter estimate"}{" "}
            · borrowing not enabled yet
          </small>
        </div>
        <div className="credit-hero-side">
          <span>Collateral</span>
          <strong>
            {data?.paper.collateralUsd != null
              ? data.paper.collateralUsd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </strong>
          <span>{isFetching ? "Refreshing…" : data?.paper.note}</span>
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

      <div className="desk-grid">
        <Panel title="Credit sources" className="desk-card-lift">
          <div className="credit-source-list">
            <div>
              <b>Kamino xStocks</b>
              <StatusBadge tone={data?.kamino.ok ? "green" : "amber"}>
                {data?.kamino.ok ? "Live" : "Unavailable"}
              </StatusBadge>
            </div>
            <div>
              <b>Earn vaults</b>
              <StatusBadge tone={data?.jupiterLend.ok ? "blue" : "amber"}>
                {data?.jupiterLend.ok ? "Available" : "Unavailable"}
              </StatusBadge>
            </div>
            <div>
              <b>Nest credit</b>
              <StatusBadge tone={data?.nestCredit.ok ? "green" : "amber"}>
                {data?.nestCredit.ok
                  ? `${data.nestCredit.data.vaultCount} vaults`
                  : "Unavailable"}
              </StatusBadge>
            </div>
            <div>
              <b>NestUSD borrow</b>
              <StatusBadge tone="amber">Not verified yet</StatusBadge>
            </div>
          </div>
        </Panel>
        <Panel
          title="Live credit markets"
          className="desk-card-lift"
          meta={
            <StatusBadge tone={data?.kamino.ok ? "green" : "amber"}>
              {data?.kamino.ok ? "Kamino" : "Unavailable"}
            </StatusBadge>
          }
        >
          <div className="credit-market-list">
            {reserves.slice(0, 8).map((r) => (
              <div key={r.mint}>
                <b>{r.symbol}</b>
                <span>{(r.maxLtv * 100).toFixed(0)}% LTV</span>
                <span>{(r.borrowApy * 100).toFixed(2)}% APY</span>
              </div>
            ))}
            {reserves.length === 0 ? (
              <p className="desk-panel-note">Markets unavailable right now.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </DeskShell>
  );
}
