import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { AssetLogo } from "@/components/asset-logo";
import { CreditBorrowButton } from "@/components/credit-borrow-button";
import { DeskShell } from "@/components/desk-shell";
import { isPlausibleSolanaAddress } from "@/components/wallet-lookup-panel";
import { trackFolioEvent } from "@/lib/analytics";
import { getCreditBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";
import { underlyingKey } from "@/lib/logo-resolve";
import { XSTOCK_CATALOG } from "@/lib/xstock-catalog";

const creditSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

const DEPOSIT_CHIPS = ["0.01", "0.1", "1"] as const;
const BORROW_CHIPS = ["10", "25", "50", "100"] as const;

export const Route = createFileRoute("/desk/credit")({
  head: () => ({
    meta: siteMeta({
      title: "Borrow — FOLIO",
      description: "Borrow USDC against xStocks in-desk on live Kamino rails.",
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

function catalogUnderlying(symbol: string): string | undefined {
  return XSTOCK_CATALOG.find((c) => c.symbol === symbol)?.underlying;
}

function Page() {
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchCredit = useServerFn(getCreditBundle);
  const [openLookup, setOpenLookup] = useState(Boolean(inspect));
  const [inspectInput, setInspectInput] = useState(inspect ?? "");
  const [selectedSymbol, setSelectedSymbol] = useState("AAPLx");
  const [depositAmt, setDepositAmt] = useState("0.1");
  const [borrowAmt, setBorrowAmt] = useState("25");
  const [err, setErr] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["credit-bundle", inspect ?? ""],
    queryFn: () => fetchCredit({ data: { inspectWallet: inspect } }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const reserves = useMemo(() => {
    if (!data?.kamino.ok) return [];
    return data.kamino.data.reserves.filter(
      (r) => !/^USDC$/i.test(r.symbol) && /x$/i.test(r.symbol),
    );
  }, [data]);

  const selected =
    reserves.find((r) => r.symbol === selectedSymbol) ?? reserves[0] ?? null;

  const nestRows =
    data?.nestusd.ok
      ? data.nestusd.data.collaterals
          .filter((c) => /x$/i.test(c.symbol) || c.symbol === "AAPLx")
          .slice(0, 8)
      : [];
  const borrow = data?.paper.illustrativeBorrowUsd;
  const ltv = data?.paper.maxLtvUsed;
  const collateral = data?.paper.collateralUsd;
  const nestLive =
    data?.nestusd.ok && data.nestusd.data.status === "live";
  const nestEarn = data?.nestCredit?.ok
    ? `Nest.credit shows ${data.nestCredit.data.vaultCount} vaults (read-only · not NestUSD)`
    : null;
  const broadcastPaused = data?.broadcastPaused !== false;
  const kaminoReady = Boolean(data?.kamino.ok && selected?.reserve);

  return (
    <DeskShell title="Borrow">
      <section className="fx-page fx-buy">
        <div className="fx-buy-stack">
          <header className="fx-credit-hero">
            <div className="fx-credit-hero-copy">
              <p className="fx-credit-hero-kicker">Available to borrow</p>
              <p className="fx-credit-hero-value">
                {borrow != null ? money(borrow) : "—"}
              </p>
              <p className="fx-credit-hero-sub">
                {data?.paper.note ??
                  "Keep the shares. Unlock USDC inside FOLIO — you sign every step."}
              </p>
            </div>
            {ltv != null ? (
              <div
                className="fx-credit-hero-ring"
                style={{ ["--ltv" as string]: Math.round(ltv * 100) }}
                aria-label={`Max LTV ${(ltv * 100).toFixed(0)} percent`}
              >
                <span>
                  Max LTV
                  <b>{(ltv * 100).toFixed(0)}%</b>
                </span>
              </div>
            ) : null}
            <div className="fx-credit-hero-meta" aria-label="Borrow summary">
              <div>
                <span>Collateral</span>
                <b>{collateral != null ? money(collateral) : "—"}</b>
              </div>
              <div>
                <span>Max LTV</span>
                <b>{ltv != null ? `${(ltv * 100).toFixed(0)}%` : "—"}</b>
              </div>
              <div>
                <span>Available</span>
                <b>{borrow != null ? money(borrow) : "—"}</b>
              </div>
              <div>
                <span>Rails</span>
                <b>Kamino</b>
              </div>
            </div>
          </header>

          {ltv != null ? (
            <div className="fx-card fx-card-pad">
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
                  <span>
                    Up to {(ltv * 100).toFixed(0)}% on{" "}
                    {selected?.symbol ?? "AAPLx"}
                  </span>
                  <span>
                    {collateral != null
                      ? `Collateral ${money(collateral)}`
                      : "Estimate"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {reserves.length > 0 ? (
            <div className="fx-card">
              <div className="fx-picker-head">
                <h2>Kamino xStocks rates</h2>
              </div>
              <ul
                className="fx-list"
                role="listbox"
                aria-label="Collateral assets"
                data-testid="credit-kamino-rates"
              >
                {reserves.map((r) => {
                  const on = selected?.symbol === r.symbol;
                  const und =
                    catalogUnderlying(r.symbol) ?? underlyingKey(r.symbol);
                  return (
                    <li key={r.mint}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={on}
                        className={`fx-asset${on ? " is-on" : ""}`}
                        style={{
                          width: "100%",
                          border: 0,
                          background: on ? "#F0F9FC" : "transparent",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onClick={() => {
                          setSelectedSymbol(r.symbol);
                          setErr(null);
                          setLastSig(null);
                          trackFolioEvent("cta_click", {
                            cta: "credit_select",
                            symbol: r.symbol,
                          });
                        }}
                      >
                        <AssetLogo
                          symbol={r.symbol}
                          underlying={und}
                          size={40}
                        />
                        <span className="fx-asset-main">
                          <strong>{r.symbol}</strong>
                          <small>{(r.maxLtv * 100).toFixed(0)}% max LTV</small>
                        </span>
                        <span className="fx-asset-right">
                          <strong>{(r.borrowApy * 100).toFixed(2)}%</strong>
                          <small>APY</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="fx-card fx-card-pad">
              <p className="fx-sub" style={{ margin: 0 }}>
                Kamino rates unavailable — try again shortly.
              </p>
            </div>
          )}

          {nestRows.length > 0 ? (
            <div className="fx-nest-panel">
              <div className="fx-nest-panel-head">
                <h2 className="fx-section-title" style={{ margin: 0 }}>
                  NestUSD collateral {nestLive ? "· live" : "· risk"}
                </h2>
                <p>Metrics only — Nest execute stays on Nest.</p>
              </div>
              <div className="fx-card" data-testid="credit-nestusd-rows">
                {nestRows.map((r) => {
                  const und =
                    catalogUnderlying(r.symbol) ?? underlyingKey(r.symbol);
                  const borrowPct = Math.min(100, Math.round(r.borrowLtv * 100));
                  const liqPct = Math.min(
                    100,
                    Math.round(r.liquidationThreshold * 100),
                  );
                  return (
                    <div key={r.symbol} className="fx-nest-rate">
                      <div className="fx-nest-rate-top">
                        <AssetLogo
                          symbol={r.symbol}
                          underlying={und}
                          size={40}
                        />
                        <span className="fx-asset-main">
                          <strong>{r.symbol}</strong>
                          <small>
                            {borrowPct}% borrow · {liqPct}% liq
                            {r.borrowsPaused ? " · paused" : ""}
                          </small>
                        </span>
                        <span className="fx-asset-right">
                          <strong>{borrowPct}%</strong>
                          <small>max</small>
                        </span>
                      </div>
                      <div className="fx-nest-rate-bars" aria-hidden>
                        <div className="fx-nest-bar">
                          <span>Borrow</span>
                          <i>
                            <b style={{ width: `${borrowPct}%` }} />
                          </i>
                          <em>{borrowPct}%</em>
                        </div>
                        <div className="fx-nest-bar is-liq">
                          <span>Liq</span>
                          <i>
                            <b style={{ width: `${liqPct}%` }} />
                          </i>
                          <em>{liqPct}%</em>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="fx-card fx-ticket">
          <div className="fx-ticket-top">
            <div>
              <div className="fx-ticket-brand">
                {selected ? (
                  <AssetLogo
                    symbol={selected.symbol}
                    underlying={
                      catalogUnderlying(selected.symbol) ??
                      underlyingKey(selected.symbol)
                    }
                    size={36}
                  />
                ) : null}
                <div>
                  <p className="fx-hero-kicker">Borrow in FOLIO</p>
                  <h1>{selected?.symbol ?? "Select asset"}</h1>
                </div>
              </div>
              <p className="fx-ticket-sub">
                Deposit collateral, then borrow USDC — signed in your wallet on
                Kamino rails. No redirect.
              </p>
            </div>
          </div>

          <div className="fx-swap">
            <div className="fx-swap-leg">
              <span>Deposit collateral</span>
              <div className="fx-swap-row">
                <strong className="fx-swap-token">
                  {selected ? (
                    <>
                      <AssetLogo
                        symbol={selected.symbol}
                        underlying={
                          catalogUnderlying(selected.symbol) ??
                          underlyingKey(selected.symbol)
                        }
                        size={28}
                      />
                      {selected.symbol}
                    </>
                  ) : (
                    "—"
                  )}
                </strong>
                <input
                  className="fx-swap-amt"
                  value={depositAmt}
                  inputMode="decimal"
                  aria-label="Collateral deposit amount"
                  onChange={(e) => {
                    setDepositAmt(e.target.value);
                    setErr(null);
                    setLastSig(null);
                  }}
                />
              </div>
            </div>
            <div className="fx-chip-row">
              {DEPOSIT_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`fx-chip${depositAmt === c ? " is-on" : ""}`}
                  onClick={() => {
                    setDepositAmt(c);
                    setErr(null);
                  }}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                className={`fx-chip${depositAmt === "0" ? " is-on" : ""}`}
                onClick={() => {
                  setDepositAmt("0");
                  setErr(null);
                }}
              >
                Skip
              </button>
            </div>

            <div className="fx-swap-leg">
              <span>Borrow</span>
              <div className="fx-swap-row">
                <strong className="fx-swap-token">
                  <span
                    className="fx-logo fx-logo-fallback fx-logo-usdc"
                    aria-hidden
                    style={{ width: 28, height: 28, fontSize: 12 }}
                  >
                    $
                  </span>
                  USDC
                </strong>
                <input
                  className="fx-swap-amt"
                  value={borrowAmt}
                  inputMode="decimal"
                  aria-label="USDC borrow amount"
                  onChange={(e) => {
                    setBorrowAmt(e.target.value);
                    setErr(null);
                    setLastSig(null);
                  }}
                />
              </div>
            </div>
            <div className="fx-chip-row">
              {BORROW_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`fx-chip${borrowAmt === c ? " is-on" : ""}`}
                  onClick={() => {
                    setBorrowAmt(c);
                    setErr(null);
                  }}
                >
                  ${c}
                </button>
              ))}
              <button
                type="button"
                className={`fx-chip${borrowAmt === "0" ? " is-on" : ""}`}
                onClick={() => {
                  setBorrowAmt("0");
                  setErr(null);
                }}
              >
                Skip
              </button>
            </div>
          </div>

          {selected ? (
            <dl className="fx-swap-sheet-body" style={{ margin: 0 }}>
              <div>
                <dt>Max LTV</dt>
                <dd>{(selected.maxLtv * 100).toFixed(0)}%</dd>
              </div>
              <div>
                <dt>Borrow APY</dt>
                <dd>{(selected.borrowApy * 100).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>Fill</dt>
                <dd>{broadcastPaused ? "Paused" : "Armed · sign in desk"}</dd>
              </div>
            </dl>
          ) : null}

          {err ? <p className="fx-err">{err}</p> : null}
          {lastSig ? (
            <p className="fx-checks" data-testid="credit-fill-sig">
              Landed · {lastSig.slice(0, 8)}…{lastSig.slice(-6)}
            </p>
          ) : null}

          <CreditBorrowButton
            broadcastPaused={broadcastPaused}
            collateralReserve={selected?.reserve ?? ""}
            collateralSymbol={selected?.symbol ?? "xStock"}
            depositAmount={depositAmt}
            borrowAmount={borrowAmt}
            onError={(msg) => setErr(msg || null)}
            onSuccess={(sig) => {
              setLastSig(sig);
              setErr(null);
            }}
          />

          {!kaminoReady ? (
            <p className="fx-checks">
              Kamino market offline — borrow ticket stays disabled until rates
              load.
            </p>
          ) : null}

          <p className="fx-ticket-sub">
            <Link to="/desk/positions">View holdings</Link>
            {" · "}
            <Link to="/desk/acquire">Buy xStocks</Link>
          </p>

          <p className="fx-sub" style={{ margin: 0, fontSize: ".78rem" }}>
            FOLIO assembles Kamino deposit/borrow txs in-desk; your wallet
            signs. We do not run a custom borrow CPI.{" "}
            {nestEarn ? `${nestEarn}.` : null}
          </p>
        </aside>

        <div className="fx-foot" style={{ gridColumn: "1 / -1" }}>
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
