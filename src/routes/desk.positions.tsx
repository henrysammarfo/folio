import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
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

  return (
    <DeskShell title="Holdings">
      <section className="prod-page">
        <header className="prod-lead">
          <p className="prod-kicker">
            {walletRead ? "From your wallet" : "Estimated · connect to verify"}
          </p>
          <h1 className="prod-value">
            {total > 0
              ? total.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </h1>
          <p className="prod-sub">
            Live share counts on Solana.{" "}
            <Link to="/desk/acquire">Buy</Link>
            {" · "}
            <Link to="/desk/settings">Connect wallet</Link>
          </p>
        </header>

        <ul className="prod-list" aria-label="Holdings">
          {rows.map((p) => {
            const chain = scaledUiHealthLabel(p.scaledUiCompare.status);
            return (
              <li key={p.symbol}>
                <Link
                  to="/desk/positions/$symbol"
                  params={{ symbol: p.symbol }}
                  search={inspect ? { inspect } : {}}
                  className="prod-row"
                >
                  <span className="prod-row-mark" aria-hidden>
                    {p.symbol[0]}
                  </span>
                  <span className="prod-row-main">
                    <strong>{p.symbol}</strong>
                    <small>
                      {p.qty.toFixed(4)}{" "}
                      {p.qtySource === "wallet-read" ? "qty" : "est. qty"} ·{" "}
                      {p.multiplier != null
                        ? `${p.multiplier.toFixed(4)}× share count`
                        : "—"}
                      {" · "}
                      <span data-testid={`positions-scaled-ui-${p.symbol}`}>
                        {chain}
                      </span>
                    </small>
                  </span>
                  <span className="prod-row-value">
                    {p.paperValueUsd != null
                      ? p.paperValueUsd.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        })
                      : "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="prod-foot">
          {!openLookup ? (
            <button
              type="button"
              className="prod-text-btn"
              onClick={() => setOpenLookup(true)}
            >
              Look up any wallet
            </button>
          ) : (
            <form
              className="prod-inline-form"
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
              {err ? <p className="prod-err">{err}</p> : null}
            </form>
          )}
        </div>
      </section>
    </DeskShell>
  );
}
