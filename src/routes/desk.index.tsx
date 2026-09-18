import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import {
  getCreditBundle,
  getNetworkBundle,
  getPositionsBundle,
} from "@/lib/desk.functions";

const deskSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/")({
  head: () => ({
    meta: [
      { title: "Prime Desk — FOLIO" },
      { name: "description", content: "Buy, hold, and borrow tokenized stocks on Solana." },
    ],
  }),
  validateSearch: (search) => deskSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) => {
    const [positions, credit, network] = await Promise.all([
      getPositionsBundle({ data: { inspectWallet: deps.inspect } }),
      getCreditBundle({ data: { inspectWallet: deps.inspect } }),
      getNetworkBundle(),
    ]);
    return { positions, credit, network };
  },
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchPositions = useServerFn(getPositionsBundle);
  const fetchCredit = useServerFn(getCreditBundle);
  const fetchNetwork = useServerFn(getNetworkBundle);
  const [inspectInput, setInspectInput] = useState(inspect ?? "");
  const positions = useQuery({
    queryKey: ["positions-bundle", inspect ?? ""],
    queryFn: () => fetchPositions({ data: { inspectWallet: inspect } }),
    initialData: initial.positions,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });
  const credit = useQuery({
    queryKey: ["credit-bundle", inspect ?? ""],
    queryFn: () => fetchCredit({ data: { inspectWallet: inspect } }),
    initialData: initial.credit,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });
  const network = useQuery({
    queryKey: ["network-matrix-desk"],
    queryFn: () => fetchNetwork(),
    initialData: initial.network,
    initialDataUpdatedAt: Date.now(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const rows = positions.data?.rows ?? [];
  const walletVerified = rows.filter((r) => r.health === "Verified").length;
  const liveMarks = rows.filter((r) => r.health === "Review" || r.health === "Verified").length;
  const paperValue = rows.reduce((s, r) => s + (r.paperValueUsd ?? 0), 0);
  const walletRead = rows.some((r) => r.qtySource === "wallet-read");
  const walletSource = positions.data?.walletSource ?? credit.data?.walletSource ?? null;
  const boundElsewhere =
    walletSource === "watch-wallet" ||
    walletSource === "membership" ||
    walletSource === "session";

  return (
    <DeskShell eyebrow="Overview" title="Your desk">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode={liveMarks > 0 ? "mainnet-read" : "unavailable"}>
          {liveMarks > 0 ? "Live markets" : "Markets unavailable"}
        </ModeBadge>
        <ModeBadge mode={walletRead ? "mainnet-read" : "paper"}>
          {walletRead ? "Wallet balances" : "Estimated balances"}
        </ModeBadge>
        <ModeBadge
          mode={
            walletSource === "membership" ||
            walletSource === "session" ||
            walletSource === "watch-wallet" ||
            walletSource === "inspect"
              ? "mainnet-read"
              : "unavailable"
          }
        >
          {walletSourceBadge(walletSource)}
        </ModeBadge>
        <ModeBadge mode="quote-only">Trading paused</ModeBadge>
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

      <div className="desk-metrics">
        <div>
          <span>Portfolio value</span>
          <b>
            {paperValue > 0
              ? paperValue.toLocaleString("en-US", { style: "currency", currency: "USD" })
              : "—"}
          </b>
          <small>{walletRead ? "From your wallet" : "Estimated"}</small>
        </div>
        <div>
          <span>Verified holdings</span>
          <b>
            {walletVerified} / {rows.length || "—"}
          </b>
          <small>
            {walletRead ? "Wallet + on-chain OK" : "Connect to verify"}
          </small>
        </div>
        <div>
          <span>Borrowing power</span>
          <b>
            {credit.data?.paper.illustrativeBorrowUsd != null
              ? credit.data.paper.illustrativeBorrowUsd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </b>
          <small>Estimate · borrow paused</small>
        </div>
      </div>
      <div className="desk-grid">
        <Panel
          title="Holdings"
          meta={
            <StatusBadge tone={walletVerified > 0 ? "green" : liveMarks > 0 ? "blue" : "amber"}>
              {walletVerified > 0
                ? `${walletVerified} verified`
                : liveMarks > 0
                  ? `${liveMarks} live · est.`
                  : "Unavailable"}
            </StatusBadge>
          }
        >
          <div className="position-list">
            {rows.map((p) => (
              <Link
                key={p.symbol}
                to="/desk/positions/$symbol"
                params={{ symbol: p.symbol }}
                search={inspect ? { inspect } : {}}
              >
                <span className="asset-icon">{p.symbol[0]}</span>
                <p>
                  <b>{p.symbol}</b>
                  <small>{p.name}</small>
                </p>
                <p>
                  <b>{p.economicShares != null ? p.economicShares.toFixed(4) : "—"}</b>
                  <small>shares</small>
                </p>
                <strong>
                  {p.paperValueUsd != null
                    ? p.paperValueUsd.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : "—"}
                </strong>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Status" meta={<StatusBadge tone="green">Live</StatusBadge>}>
          <div className="policy-list">
            <p>
              <span>Share counts</span>
              <b>
                {(() => {
                  const aapl = rows.find((r) => r.symbol === "AAPLx") ?? rows[0];
                  if (!aapl || aapl.multiplier == null) return "Unavailable";
                  if (aapl.pendingMultiplier != null) {
                    return `Pending ${aapl.pendingMultiplier.toFixed(6)}×`;
                  }
                  return "Live";
                })()}
              </b>
            </p>
            <p>
              <span>Credit markets</span>
              <b>{credit.data?.kamino.ok ? "Live" : "Unavailable"}</b>
            </p>
            <p>
              <span>Borrow</span>
              <b>
                {network.data?.broadcastPaused !== false
                  ? "Paused"
                  : "Armed"}
              </b>
            </p>
            <p>
              <span>Buy</span>
              <b>
                <Link to="/desk/acquire" className="underline">
                  Open buy →
                </Link>
              </b>
            </p>
          </div>
        </Panel>
      </div>
    </DeskShell>
  );
}
