import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";
import { AssetLogo } from "@/components/asset-logo";
import { DeskShell } from "@/components/desk-shell";
import { TradingViewChart } from "@/components/tradingview-chart";
import { getAcquireBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";
import { XSTOCK_CATALOG, findCatalogItem } from "@/lib/xstock-catalog";

const CHIPS = ["1", "5", "10", "25"] as const;

export const Route = createFileRoute("/desk/acquire")({
  head: () => ({
    meta: siteMeta({
      title: "Buy — FOLIO",
      description: "Swap USDC for tokenized stocks on Solana with live quotes.",
      path: "/desk/acquire",
    }),
  }),
  loader: async () =>
    getAcquireBundle({ data: { symbol: "AAPLx", spendUsdc: 1 } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const [symbol, setSymbol] = useState("AAPLx");
  const [amount, setAmount] = useState("1");
  const [query, setQuery] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0 && spendUsdc <= 25;
  const selected = findCatalogItem(symbol) ?? XSTOCK_CATALOG[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return XSTOCK_CATALOG;
    return XSTOCK_CATALOG.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.underlying.toLowerCase().includes(q),
    );
  }, [query]);

  const fetchAcquire = useServerFn(getAcquireBundle);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["acquire", symbol, spendUsdc],
    queryFn: () => fetchAcquire({ data: { symbol, spendUsdc } }),
    enabled: ready,
    initialData: symbol === "AAPLx" && spendUsdc === 1 ? initial : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });

  const out = useMemo(() => {
    if (data?.jupiter.ok) return data.jupiter.data.outUiAmount.toFixed(6);
    return null;
  }, [data]);

  const canBuy =
    Boolean(data?.gates.canReview) && !isFetching && ready && !honeypot.trim();

  const scaledStatus =
    data?.scaledUiCompare.status === "match"
      ? "match"
      : data?.scaledUiCompare.status === "mismatch"
        ? "mismatch"
        : "off";

  const checkLines = [
    ...(data?.gates.blockedReasons ?? []),
    ...(data?.gates.honestyNotes ?? []),
    data?.prefsFromSession
      ? null
      : "Strict prefs · no session — public demo fail-closed labels apply",
    data?.strictFailClosed ? "Strict fail-closed on" : null,
  ].filter(Boolean) as string[];

  return (
    <DeskShell title="Buy">
      <section className="fx-buy fx-page">
        <div className="fx-buy-stack">
          <div className="fx-card fx-buy-chart">
            <TradingViewChart
              symbol={symbol}
              height={420}
              interval="60"
              theme="light"
            />
          </div>

          <div className="fx-card fx-picker">
            <div className="fx-picker-head">
              <h2>Choose a stock</h2>
              <input
                className="fx-picker-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search AAPL, NVIDIA…"
                aria-label="Search tokenized stocks"
              />
            </div>
            <ul className="fx-picker-grid" role="listbox" aria-label="Tokenized stocks">
              {filtered.map((item) => {
                const on = item.symbol === symbol;
                return (
                  <li key={item.symbol}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={`fx-picker-item${on ? " is-on" : ""}`}
                      onClick={() => {
                        setSymbol(item.symbol);
                        setReviewed(false);
                      }}
                    >
                      <AssetLogo symbol={item.symbol} size={36} />
                      <span className="fx-picker-copy">
                        <strong>{item.underlying}</strong>
                        <small>{item.symbol}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {filtered.length === 0 ? (
              <p className="fx-ticket-sub" style={{ padding: "0 1rem 1rem" }}>
                No matches — try another ticker.
              </p>
            ) : null}
          </div>
        </div>

        <aside className="fx-card fx-ticket">
          <div>
            <p className="fx-hero-kicker">Swap</p>
            <h1>USDC → {selected.symbol}</h1>
            <p className="fx-ticket-sub">
              Live Jupiter quote · fills pause until enabled
            </p>
          </div>

          <div className="fx-swap">
            <div className="fx-swap-leg">
              <span>You pay</span>
              <div className="fx-swap-row">
                <strong className="fx-swap-token">
                  <span className="fx-logo fx-logo-fallback fx-logo-usdc" aria-hidden>
                    $
                  </span>
                  USDC
                </strong>
                <input
                  className="fx-swap-amt"
                  value={amount}
                  inputMode="decimal"
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErr(null);
                    setReviewed(false);
                  }}
                  aria-label="Amount in USDC"
                />
              </div>
            </div>

            <div className="fx-swap-mid" aria-hidden>
              <ArrowDownUp size={16} strokeWidth={2.2} />
            </div>

            <div className="fx-swap-leg">
              <span>You receive</span>
              <div className="fx-swap-row">
                <strong className="fx-swap-token">
                  <AssetLogo symbol={selected.symbol} size={28} />
                  {selected.symbol}
                </strong>
                <b className="fx-swap-out">
                  {isFetching ? "…" : out ? out : "—"}
                </b>
              </div>
            </div>
          </div>

          <div className="fx-chip-row">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                className={`fx-chip${amount === c ? " is-on" : ""}`}
                onClick={() => {
                  setAmount(c);
                  setErr(null);
                  setReviewed(false);
                }}
              >
                ${c}
              </button>
            ))}
          </div>

          <label className="hp-field" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>

          {err ? <p className="fx-err">{err}</p> : null}

          {!reviewed ? (
            <button
              type="button"
              className="fx-btn fx-btn-primary fx-btn-block"
              data-testid="acquire-continue"
              disabled={!ready}
              onClick={() => {
                const n = Number(amount);
                if (!Number.isFinite(n) || n <= 0) {
                  setErr("Enter an amount greater than 0.");
                  return;
                }
                if (n > 25) {
                  setErr("Max $25 while fills stay paused.");
                  return;
                }
                setErr(null);
                void refetch().then(() => setReviewed(true));
              }}
            >
              Review quote
            </button>
          ) : (
            <div className="fx-review">
              <h2>Policy checks</h2>
              <ul>
                <li>
                  <span>Truth (API)</span>
                  <b>
                    {data?.gates.truthOk
                      ? data.multiplier.ok
                        ? `${data.multiplier.data.currentMultiplier.toFixed(4)}×`
                        : "OK"
                      : "Checking…"}
                  </b>
                </li>
                <li data-testid="acquire-scaled-ui-gate">
                  <span>On-chain Scaled UI</span>
                  <b>{scaledStatus}</b>
                </li>
                <li>
                  <span>Route</span>
                  <b>
                    {data?.gates.washOk
                      ? "Clear"
                      : data?.gates.blockedReasons.some((r) =>
                            /BITQUERY/i.test(r),
                          )
                        ? "BITQUERY_API_KEY"
                        : "Fail-closed"}
                  </b>
                </li>
                <li>
                  <span>canReview</span>
                  <b>{data?.gates.canReview ? "true" : "false · blocked"}</b>
                </li>
              </ul>
              {checkLines.length > 0 ? (
                <p className="fx-checks">{checkLines.join("\n")}</p>
              ) : null}
              <button
                type="button"
                className="fx-btn fx-btn-primary fx-btn-block"
                disabled={!canBuy}
              >
                {canBuy
                  ? "Swap — fills paused"
                  : data?.gates.blockedReasons.some((r) =>
                        /BITQUERY|fail-closed|wash/i.test(r),
                      )
                    ? "Blocked · fail-closed"
                    : "Waiting on checks"}
              </button>
              <button
                type="button"
                className="fx-text-btn"
                onClick={() => setReviewed(false)}
              >
                Edit order
              </button>
            </div>
          )}

          <p className="fx-ticket-sub">
            Prefer credit? <Link to="/desk/credit">Borrow</Link>
          </p>
        </aside>
      </section>
    </DeskShell>
  );
}
