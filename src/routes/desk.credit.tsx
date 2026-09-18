import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import {
  WalletLookupPanel,
  walletSourceBadge,
} from "@/components/wallet-lookup-panel";
import { getCreditBundle } from "@/lib/desk.functions";

const creditSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

function truncateBadge(text: string, max = 64): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export const Route = createFileRoute("/desk/credit")({
  head: () => ({
    meta: [
      { title: "Credit — FOLIO" },
      {
        name: "description",
        content: "Borrow against tokenized stocks without selling.",
      },
    ],
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
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Live markets</ModeBadge>
        <ModeBadge mode="unavailable">Borrow paused</ModeBadge>
        <ModeBadge mode={walletRead ? "mainnet-read" : "paper"}>
          {walletRead ? "Wallet capacity" : "Estimated capacity"}
        </ModeBadge>
        <ModeBadge
          mode={
            data?.walletSource === "membership" ||
            data?.walletSource === "session" ||
            data?.walletSource === "watch-wallet" ||
            data?.walletSource === "inspect"
              ? "mainnet-read"
              : "unavailable"
          }
        >
          {walletSourceBadge(data?.walletSource)}
        </ModeBadge>
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
        <Panel
          title="Borrowing power"
          meta={
            <StatusBadge tone="blue">
              {isFetching
                ? "…"
                : walletRead
                  ? "From your wallet"
                  : "Estimate"}
            </StatusBadge>
          }
        >
          <div className="credit-output">
            <span>{walletRead ? "Collateral value" : "Estimated collateral"}</span>
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
              AAPLx max LTV{" "}
              {data?.paper.maxLtvUsed != null
                ? `${(data.paper.maxLtvUsed * 100).toFixed(0)}%`
                : "—"}{" "}
              · you could borrow up to{" "}
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
        <Panel title="Where credit comes from">
          <div className="policy-list">
            <p>
              <span>Kamino xStocks</span>
              <StatusBadge tone={data?.kamino.ok ? "green" : "amber"}>
                {data?.kamino.ok
                  ? "Live"
                  : data && !data.kamino.ok
                    ? "Unavailable"
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Earn vaults</span>
              <StatusBadge tone={data?.jupiterLend.ok ? "blue" : "amber"}>
                {data?.jupiterLend.ok
                  ? "Available"
                  : data && !data.jupiterLend.ok
                    ? "Unavailable"
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Nest credit</span>
              <StatusBadge tone={data?.nestCredit.ok ? "green" : "amber"}>
                {data?.nestCredit.ok
                  ? `${data.nestCredit.data.vaultCount} vaults`
                  : data && !data.nestCredit.ok
                    ? "Unavailable"
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>NestUSD borrow</span>
              <StatusBadge
                tone="amber"
                {...(data && !data.nestusd.ok
                  ? {
                      title:
                        data.nestusd.detail ?? data.nestusd.reason ?? "unavailable",
                    }
                  : {})}
              >
                {data?.nestusd.ok
                  ? "Risk-labeled"
                  : data && !data.nestusd.ok
                    ? truncateBadge("Not verified yet")
                    : "Not verified"}
              </StatusBadge>
            </p>
            <p>
              <span>Borrow execution</span>
              <StatusBadge tone="neutral">Paused</StatusBadge>
            </p>
          </div>
        </Panel>
      </div>
      <Panel
        title="Live credit markets"
        meta={
          <StatusBadge tone={data?.kamino.ok ? "green" : "amber"}>
            {data?.kamino.ok ? "Kamino" : "Unavailable"}
          </StatusBadge>
        }
      >
        <div className="data-table" data-cols="5">
          <div className="table-head">
            <span>Asset</span>
            <span>Max LTV</span>
            <span>Borrow APY</span>
            <span>Supply</span>
            <span>Borrow</span>
          </div>
          {reserves.slice(0, 12).map((r) => (
            <div key={r.mint} className="table-row">
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
