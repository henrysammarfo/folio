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
  const collateral = data?.paper.collateralUsd;
  const nestusdNote = data?.nestusd?.ok
    ? "NestUSD risk-labeled · not verified ready"
    : "NestUSD capacity unavailable · not verified";
  const nestEarn = data?.nestCredit?.ok
    ? `Nest.credit earn · ${data.nestCredit.data.vaultCount} vaults`
    : "Nest.credit earn unavailable";

  return (
    <DeskShell title="Borrow">
      <section className="fx-page">
        <header className="fx-hero">
          <p className="fx-hero-kicker">Available to borrow</p>
          <h1 className="fx-hero-value">
            {borrow != null ? money(borrow) : "—"}
          </h1>
          <p className="fx-hero-sub">
            Keep your stocks. Borrow cash when we turn borrowing on.
          </p>
        </header>

        {ltv != null ? (
          <div className="fx-card fx-card-pad" style={{ marginBottom: "1rem" }}>
            <p className="fx-section-title" style={{ marginBottom: ".35rem" }}>
              Loan-to-value
            </p>
            <div className="fx-meter">
              <div className="fx-meter-track">
                <div
                  className="fx-meter-fill"
                  style={{ width: `${Math.min(100, ltv * 100)}%` }}
                />
              </div>
              <div className="fx-meter-meta">
                <span>Up to {(ltv * 100).toFixed(0)}% on AAPLx</span>
                <span>
                  {collateral != null ? `Collateral ${money(collateral)}` : "Estimate"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="fx-actions">
          <button type="button" className="fx-btn fx-btn-primary" disabled>
            Borrow — coming soon
          </button>
          <Link to="/desk/positions" className="fx-btn fx-btn-ghost">
            View holdings
          </Link>
        </div>

        {reserves.length > 0 ? (
          <>
            <h2 className="fx-section-title">Market rates</h2>
            <div className="fx-card">
              <ul className="fx-list">
                {reserves.map((r, i) => (
                  <li key={r.mint} className="fx-asset" style={{ cursor: "default" }}>
                    <span
                      className="fx-asset-mark"
                      style={{ background: i % 2 ? "#0B1220" : "#0EA5C9" }}
                      aria-hidden
                    >
                      {r.symbol[0]}
                    </span>
                    <span className="fx-asset-main">
                      <strong>{r.symbol}</strong>
                      <small>{(r.maxLtv * 100).toFixed(0)}% max LTV</small>
                    </span>
                    <span className="fx-asset-right">
                      <strong>{(r.borrowApy * 100).toFixed(2)}%</strong>
                      <small>APY</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        <p className="fx-sub" style={{ marginTop: "1.25rem" }}>
          {nestEarn}. {nestusdNote}. Borrowing is paused — not enabled yet.
        </p>

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
