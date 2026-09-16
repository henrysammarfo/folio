import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getPositionsBundle } from "@/lib/desk.functions";
import {
  positionStatusLabel,
  scaledUiHealthLabel,
} from "@/lib/position-health";

const positionsSearchSchema = z.object({
  /** Ephemeral mainnet-read inspect pubkey — not auth, not persisted. */
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/positions")({
  head: () => ({
    meta: [
      { title: "Positions — FOLIO" },
      {
        name: "description",
        content: "Paper qty × live xStock multipliers on Solana mainnet.",
      },
      { property: "og:title", content: "Positions — FOLIO" },
      {
        property: "og:description",
        content: "Paper qty × live xStock multipliers on Solana mainnet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search) => positionsSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  /** Prefetch so wallet-read vs paper qty labels paint on first load. */
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

  const hasWalletRead = data?.rows.some((r) => r.qtySource === "wallet-read") ?? false;

  return (
    <DeskShell eyebrow="Ownership ledger" title="Positions">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Live multipliers</ModeBadge>
        <ModeBadge mode="mainnet-read">API ↔ on-chain Scaled UI</ModeBadge>
        <ModeBadge mode={hasWalletRead ? "mainnet-read" : "paper"}>
          {hasWalletRead ? "Wallet-read qty" : "Paper quantities"}
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
                  : data?.auth.ok
                    ? "Keys present · no session"
                    : "Wallet unbound"}
        </ModeBadge>
      </div>

      <Panel
        title="Inspect wallet (ephemeral)"
        meta={
          <StatusBadge tone={data?.walletSource === "inspect" ? "green" : "neutral"}>
            {data?.walletSource === "inspect" ? "Inspect active" : "No cookie"}
          </StatusBadge>
        }
      >
        <p className="mb-3 text-sm opacity-80">
          Mainnet-read token balances for a pubkey without binding a watch-wallet cookie or
          Privy session. Useful on Vercel before <code>FOLIO_SESSION_SECRET</code> lands.
          Inspect is <b>not</b> multi-tenant auth.
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
                  const { inspect: _drop, ...rest } = prev as {
                    inspect?: string;
                  };
                  return rest;
                },
              });
            }}
          >
            Clear inspect
          </button>
        </div>
      </Panel>

      <Panel
        title="Watchlist"
        meta={
          <StatusBadge tone={isFetching ? "blue" : "neutral"}>
            {isFetching ? "Refreshing…" : "Live multipliers · qty labeled"}
          </StatusBadge>
        }
      >
        {isError ? <p className="text-sm text-amber-700">{String(error)}</p> : null}
        <p className="mb-3 text-sm opacity-80">{data?.note}</p>
        <div className="data-table">
          <div className="table-head">
            <span>Asset</span>
            <span>Qty</span>
            <span>Multiplier</span>
            <span>Economic</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {(data?.rows ?? []).map((p) => (
            <Link
              key={p.symbol}
              to="/desk/positions/$symbol"
              params={{ symbol: p.symbol }}
              search={inspect ? { inspect } : {}}
            >
              <span>
                <b>{p.symbol}</b>
                <small>{p.name}</small>
              </span>
              <span>
                {p.qty.toFixed(4)}
                <small>{p.qtySource === "wallet-read" ? "wallet" : "paper"}</small>
              </span>
              <span data-testid={`positions-scaled-ui-${p.symbol}`}>
                {p.multiplier != null ? `${p.multiplier.toFixed(6)}×` : "—"}
                <small>
                  {scaledUiHealthLabel(p.scaledUiCompare.status)}
                  {p.onchainEffectiveMultiplier != null
                    ? ` · ${p.onchainEffectiveMultiplier.toFixed(6)}×`
                    : ""}
                </small>
              </span>
              <span>
                {p.economicShares != null ? p.economicShares.toFixed(4) : "—"}
              </span>
              <span>
                {p.paperValueUsd != null
                  ? p.paperValueUsd.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })
                  : "—"}
              </span>
              <span>
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
                <ArrowUpRight />
              </span>
            </Link>
          ))}
        </div>
      </Panel>
    </DeskShell>
  );
}
