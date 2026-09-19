import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { DeskShell } from "@/components/desk-shell";
import { isPlausibleSolanaAddress } from "@/components/wallet-lookup-panel";
import { getCreditBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

const creditSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/credit")({
  head: () => ({
    meta: siteMeta({
      title: "Borrow — FOLIO",
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
  const [openLookup, setOpenLookup] = useState(Boolean(inspect));
  const [inspectInput, setInspectInput] = useState(inspect ?? "");
  const { data } = useQuery({
    queryKey: ["credit-bundle", inspect ?? ""],
    queryFn: () => fetchCredit({ data: { inspectWallet: inspect } }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const reserves = data?.kamino.ok ? data.kamino.data.reserves.slice(0, 6) : [];
  const borrow = data?.paper.illustrativeBorrowUsd;
  const ltv = data?.paper.maxLtvUsed;
  const nestusdNote = data?.nestusd?.ok
    ? "NestUSD risk-labeled · not verified ready"
    : "NestUSD capacity unavailable · not verified";
  const nestEarn = data?.nestCredit?.ok
    ? `Nest.credit earn · ${data.nestCredit.data.vaultCount} vaults`
    : "Nest.credit earn unavailable";

  return (
    <DeskShell title="Borrow">
      <section className="prod-page">
        <header className="prod-lead">
          <p className="prod-kicker">Available to borrow</p>
          <h1 className="prod-value">
            {borrow != null
              ? borrow.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </h1>
          <p className="prod-sub">
            {ltv != null
              ? `Estimate · up to ${(ltv * 100).toFixed(0)}% LTV on AAPLx collateral. `
              : "Estimate from holdings. "}
            Borrowing is paused — not enabled yet. Holdings stay yours.{" "}
            <Link to="/desk/settings">Connect wallet</Link>
          </p>
        </header>

        <div className="prod-cta-row">
          <button type="button" className="prod-cta" disabled>
            Borrow — coming soon
          </button>
          <Link to="/desk/positions" className="prod-ghost">
            View holdings
          </Link>
        </div>

        {reserves.length > 0 ? (
          <div className="prod-section">
            <h2 className="prod-section-title">Market rates</h2>
            <ul className="prod-list">
              {reserves.map((r) => (
                <li key={r.mint} className="prod-row static">
                  <span className="prod-row-main">
                    <strong>{r.symbol}</strong>
                    <small>{(r.maxLtv * 100).toFixed(0)}% max LTV</small>
                  </span>
                  <span className="prod-row-value muted">
                    {(r.borrowApy * 100).toFixed(2)}% APY
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="prod-sub" style={{ marginTop: "1.75rem" }}>
          {nestEarn}. {nestusdNote}.
        </p>

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
              onSubmit={(e) => {
                e.preventDefault();
                const next = inspectInput.trim();
                if (!next) return;
                if (!isPlausibleSolanaAddress(next)) return;
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
            </form>
          )}
        </div>
      </section>
    </DeskShell>
  );
}
