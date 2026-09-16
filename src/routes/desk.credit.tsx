import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getCreditBundle } from "@/lib/desk.functions";

const creditSearchSchema = z.object({
  /** Ephemeral mainnet-read inspect pubkey — not auth, not persisted. */
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/credit")({
  head: () => ({
    meta: [
      { title: "Credit — FOLIO" },
      { name: "description", content: "Labeled Kamino / Jupiter Lend / NestUSD credit reads." },
    ],
  }),
  validateSearch: (search) => creditSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  /** Prefetch so NestUSD fail-closed + capacity labels show on first paint. */
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

  return (
    <DeskShell eyebrow="Collateral workspace" title="Credit">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Market reads</ModeBadge>
        <ModeBadge mode="unavailable">Borrow CPI = off</ModeBadge>
        <ModeBadge mode={walletRead ? "mainnet-read" : "paper"}>
          {walletRead ? "Wallet-read capacity" : "Paper capacity"}
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
          {data?.walletSource === "membership"
            ? "Membership wallet"
            : data?.walletSource === "session"
              ? "Session bound"
              : data?.walletSource === "watch-wallet"
                ? "Watch-wallet bound"
                : data?.walletSource === "inspect"
                  ? "Inspect (ephemeral)"
                  : "Wallet unbound"}
        </ModeBadge>
      </div>

      <Panel
        title="Inspect wallet (ephemeral)"
        meta={
          <StatusBadge tone={data?.walletSource === "inspect" ? "green" : "neutral"}>
            {data?.walletSource === "inspect"
              ? "Inspect active"
              : data?.walletSource === "watch-wallet" ||
                  data?.walletSource === "membership" ||
                  data?.walletSource === "session"
                ? "Bound elsewhere"
                : "Inspect idle"}
          </StatusBadge>
        }
      >
        <p className="mb-3 text-sm opacity-80">
          Mainnet-read balances for collateral math without a watch-wallet cookie or Privy
          session. Useful on Vercel before <code>FOLIO_SESSION_SECRET</code> lands. Inspect is{" "}
          <b>not</b> multi-tenant auth — and borrow broadcast stays paused.
        </p>
        <div className="form-grid">
          <label>
            Wallet pubkey
            <input
              value={inspectInput}
              onChange={(e) => setInspectInput(e.target.value)}
              placeholder="Base58 pubkey"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            className="wallet-pill"
            disabled={!inspectInput.trim()}
            onClick={() => {
              const next = inspectInput.trim();
              void navigate({
                search: (prev) => ({ ...prev, inspect: next || undefined }),
              });
            }}
          >
            Inspect
          </button>
          <button
            type="button"
            className="wallet-pill"
            disabled={!inspect}
            onClick={() => {
              setInspectInput("");
              void navigate({
                search: (prev) => {
                  const { inspect: _drop, ...rest } = prev as { inspect?: string };
                  return rest;
                },
              });
            }}
          >
            Clear inspect
          </button>
        </div>
      </Panel>

      <div className="desk-grid">
        <Panel
          title="Illustrative capacity"
          meta={
            <StatusBadge tone="blue">
              {isFetching
                ? "…"
                : walletRead
                  ? "Wallet × live LTV"
                  : "Paper × live LTV"}
            </StatusBadge>
          }
        >
          <div className="credit-output">
            <span>
              {walletRead ? "Wallet-read collateral (live marks)" : "Paper collateral (live marks)"}
            </span>
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
              AAPLx maxLtv{" "}
              {data?.paper.maxLtvUsed != null
                ? `${(data.paper.maxLtvUsed * 100).toFixed(0)}%`
                : "—"}{" "}
              · illustrative borrow{" "}
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
                {data?.kamino.ok
                  ? "Mainnet read"
                  : data && !data.kamino.ok
                    ? data.kamino.reason
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Jupiter Lend earn</span>
              <StatusBadge tone={data?.jupiterLend.ok ? "blue" : "amber"}>
                {data?.jupiterLend.ok
                  ? "Earn vaults"
                  : data && !data.jupiterLend.ok
                    ? data.jupiterLend.reason
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Nest.credit vaults</span>
              <StatusBadge tone={data?.nestCredit.ok ? "green" : "amber"}>
                {data?.nestCredit.ok
                  ? `${data.nestCredit.data.vaultCount} vaults · $${Math.round(data.nestCredit.data.totalTvlUsd).toLocaleString()} TVL · ${data.nestCredit.data.solanaOftCount} Solana OFT · not NestUSD borrow`
                  : data && !data.nestCredit.ok
                    ? (data.nestCredit.detail ?? data.nestCredit.reason)
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>NestUSD</span>
              <StatusBadge tone="amber">
                {data?.nestusd.ok
                  ? "Probed · risk-labeled"
                  : data && !data.nestusd.ok
                    ? (data.nestusd.detail ?? data.nestusd.reason)
                    : "Risk / unverified"}
              </StatusBadge>
            </p>
            <p>
              <span>Borrow execution</span>
              <StatusBadge tone="neutral">
                {data?.borrowExecution ?? "unavailable-until-funded"}
              </StatusBadge>
            </p>
          </div>
        </Panel>
      </div>
      <Panel
        title="Kamino reserves (live)"
        meta={
          <StatusBadge tone={data?.kamino.ok ? "green" : "amber"}>
            {data?.kamino.ok ? "xStocks market" : "Kamino unavailable"}
          </StatusBadge>
        }
      >
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
