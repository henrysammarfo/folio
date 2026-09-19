import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { AllocationChart, paletteFor } from "@/components/allocation-chart";
import { DeskShell } from "@/components/desk-shell";
import { isPlausibleSolanaAddress } from "@/components/wallet-lookup-panel";
import { getPositionsBundle } from "@/lib/desk.functions";
import { scaledUiHealthLabel } from "@/lib/position-health";
import { siteMeta } from "@/lib/site-meta";

const positionsSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/positions")({
  head: () => ({
    meta: siteMeta({
      title: "Holdings — FOLIO",
      description: "Your tokenized stock holdings with live share counts.",
      path: "/desk/positions",
    }),
  }),
  validateSearch: (search) => positionsSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) =>
    getPositionsBundle({ data: { inspectWallet: deps.inspect } }),
  component: Page,
});

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function Page() {
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchPositions = useServerFn(getPositionsBundle);
  const [openLookup, setOpenLookup] = useState(Boolean(inspect));
  const [inspectInput, setInspectInput] = useState(inspect ?? "");
  const [err, setErr] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["positions-bundle", inspect ?? ""],
    queryFn: () => fetchPositions({ data: { inspectWallet: inspect } }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });

  const rows = data?.rows ?? [];
  const total = rows.reduce((s, r) => s + (r.paperValueUsd ?? 0), 0);
  const walletRead = rows.some((r) => r.qtySource === "wallet-read");
  const parts = rows
    .filter((r) => (r.paperValueUsd ?? 0) > 0)
    .map((r, i) => ({
      label: r.symbol,
      value: r.paperValueUsd ?? 0,
      color: paletteFor(i),
    }));

  return (
    <DeskShell title="Holdings">
      <section className="fx-page">
        <header className="fx-hero">
          <h1 className="fx-hero-kicker">
            {walletRead ? "Holdings" : "Holdings · estimated"}
          </h1>
          <p className="fx-hero-value">{total > 0 ? money(total) : "—"}</p>
          <p className="fx-hero-sub">
            {walletRead
              ? "Live balances from your wallet"
              : "Connect a wallet to verify holdings"}
          </p>
        </header>

        <div className="fx-actions">
          <Link to="/desk/acquire" className="fx-btn fx-btn-primary">
            Buy stocks
          </Link>
          <Link to="/desk/credit" className="fx-btn fx-btn-ghost">
            Borrow
          </Link>
        </div>

        {parts.length > 0 ? <AllocationChart parts={parts} /> : null}

        <h2 className="fx-section-title">Your stocks</h2>
        <div className="fx-card">
          <ul className="fx-list" aria-label="Holdings">
            {rows.map((p, i) => {
              const chain = scaledUiHealthLabel(p.scaledUiCompare.status);
              return (
                <li key={p.symbol}>
                  <Link
                    to="/desk/positions/$symbol"
                    params={{ symbol: p.symbol }}
                    search={inspect ? { inspect } : {}}
                    className="fx-asset"
                  >
                    <span
                      className="fx-asset-mark"
                      style={{ background: paletteFor(i) }}
                      aria-hidden
                    >
                      {p.symbol[0]}
                    </span>
                    <span className="fx-asset-main">
                      <strong>{p.symbol}</strong>
                      <small>
                        {p.name} ·{" "}
                        {p.qty.toFixed(4)}{" "}
                        {p.qtySource === "wallet-read" ? "shares" : "est. shares"}
                      </small>
                    </span>
                    <span className="fx-asset-right">
                      <strong>
                        {p.paperValueUsd != null ? money(p.paperValueUsd) : "—"}
                      </strong>
                      <small>
                        {p.usdPrice != null
                          ? `$${p.usdPrice.toFixed(2)}`
                          : "—"}
                        {" · "}
                        <span data-testid={`positions-scaled-ui-${p.symbol}`}>
                          {chain}
                        </span>
                      </small>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="fx-foot">
          {!openLookup ? (
            <button
              type="button"
              className="fx-text-btn"
              onClick={() => setOpenLookup(true)}
            >
              Look up any wallet
            </button>
          ) : (
            <form
              className="fx-inline-form"
              data-testid="netro-inspect-wallet"
              onSubmit={(e) => {
                e.preventDefault();
                const next = inspectInput.trim();
                if (!isPlausibleSolanaAddress(next)) {
                  setErr("Enter a valid Solana address.");
                  return;
                }
                setErr(null);
                void navigate({
                  search: (prev) => ({ ...prev, inspect: next }),
                });
              }}
            >
              <input
                value={inspectInput}
                onChange={(e) => setInspectInput(e.target.value)}
                placeholder="Wallet address"
                aria-label="Wallet address"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit">Look up</button>
              {inspect ? (
                <button
                  type="button"
                  onClick={() => {
                    setInspectInput("");
                    void navigate({
                      search: (prev) => {
                        const { inspect: _d, ...rest } = prev as {
                          inspect?: string;
                        };
                        return rest;
                      },
                    });
                  }}
                >
                  Clear
                </button>
              ) : null}
              {err ? <p className="fx-err">{err}</p> : null}
            </form>
          )}
        </div>
      </section>
    </DeskShell>
  );
}
