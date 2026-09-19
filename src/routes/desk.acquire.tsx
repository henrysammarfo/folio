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
import {
  XSTOCK_CATALOG,
  XSTOCK_COMPARE_PAIRS,
  catalogByLane,
  findCatalogItem,
  type XStockLane,
} from "@/lib/xstock-catalog";

const CHIPS = ["1", "5", "10", "25"] as const;
const LANES: { id: XStockLane | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mega", label: "Mega" },
  { id: "ipo", label: "IPO" },
  { id: "meme", label: "Meme" },
];

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
  const [lane, setLane] = useState<XStockLane | "all">("all");
  const [compareRight, setCompareRight] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0 && spendUsdc <= 25;
  const selected = findCatalogItem(symbol) ?? XSTOCK_CATALOG[0]!;
  if (!selected) {
    throw new Error("XSTOCK_CATALOG is empty");
  }

  const filtered = useMemo(() => {
    const base = catalogByLane(lane);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.underlying.toLowerCase().includes(q),
    );
  }, [query, lane]);

  const fetchAcquire = useServerFn(getAcquireBundle);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["acquire", symbol, spendUsdc],
    queryFn: () => fetchAcquire({ data: { symbol, spendUsdc } }),
    enabled: ready,
    initialData: symbol === "AAPLx" && spendUsdc === 1 ? initial : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });

  const compareSpend = ready ? spendUsdc : 1;
  const { data: compareData, isFetching: compareFetching } = useQuery({
    queryKey: ["acquire-compare", compareRight, compareSpend],
    queryFn: () =>
      fetchAcquire({
        data: { symbol: compareRight!, spendUsdc: compareSpend },
      }),
    enabled: Boolean(compareRight) && ready,
    staleTime: 15_000,
  });

  const out = useMemo(() => {
    if (data?.jupiter.ok) return data.jupiter.data.outUiAmount.toFixed(6);
    return null;
  }, [data]);

  const compareOut = useMemo(() => {
    if (compareData?.jupiter.ok)
      return compareData.jupiter.data.outUiAmount.toFixed(6);
    return null;
  }, [compareData]);

  const canBuy =
    Boolean(data?.gates.canReview) &&
    !isFetching &&
    ready &&
    !honeypot.trim() &&
    Boolean(selected?.buyable);

  const scaledStatus =
    data?.scaledUiCompare.status === "match"
      ? "match"
      : data?.scaledUiCompare.status === "mismatch"
        ? "mismatch"
        : "off";

  const checkLines = [
    ...(data?.gates.blockedReasons ?? []),
    ...(data?.gates.honestyNotes ?? []),
    !selected?.buyable
      ? selected?.blurb ?? "Watchlist only — mint not confirmed on desk"
      : null,
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
                placeholder="Search AAPL, NVIDIA, GME…"
                aria-label="Search tokenized stocks"
              />
            </div>
            <div className="fx-lane-row" role="tablist" aria-label="Catalog lane">
              {LANES.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="tab"
                  aria-selected={lane === l.id}
                  className={`fx-lane${lane === l.id ? " is-on" : ""}`}
                  onClick={() => setLane(l.id)}
                >
                  {l.label}
                </button>
              ))}
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
                      className={`fx-picker-item${on ? " is-on" : ""}${
                        !item.buyable ? " is-watch" : ""
                      }`}
                      onClick={() => {
                        setSymbol(item.symbol);
                        setReviewed(false);
                        setErr(null);
                      }}
                    >
                      <AssetLogo symbol={item.symbol} size={36} />
                      <span className="fx-picker-copy">
                        <strong>{item.underlying}</strong>
                        <small>
                          {item.symbol}
                          {!item.buyable ? " · watch" : ""}
                          {item.lane !== "mega" ? ` · ${item.lane}` : ""}
                        </small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {filtered.length === 0 ? (
              <p className="fx-ticket-sub" style={{ padding: "0 1rem 1rem" }}>
                No matches — try another ticker or lane.
              </p>
            ) : null}

            <div className="fx-pair-strip">
              <p className="fx-pair-label">Compare pairs</p>
              <div className="fx-pair-chips">
                {XSTOCK_COMPARE_PAIRS.map((p) => {
                  const on =
                    (symbol === p.left && compareRight === p.right) ||
                    (symbol === p.right && compareRight === p.left);
                  return (
                    <button
                      key={`${p.left}-${p.right}`}
                      type="button"
                      className={`fx-chip${on ? " is-on" : ""}`}
                      onClick={() => {
                        setSymbol(p.left);
                        setCompareRight(p.right);
                        setReviewed(false);
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
                {compareRight ? (
                  <button
                    type="button"
                    className="fx-text-btn"
                    onClick={() => setCompareRight(null)}
                  >
                    Clear pair
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="fx-card fx-ticket">
          <div>
            <p className="fx-hero-kicker">Swap</p>
            <h1>USDC → {selected.symbol}</h1>
            <p className="fx-ticket-sub">
              {selected.blurb
                ? selected.blurb
                : "Live Jupiter quote · fills pause until enabled"}
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

          {compareRight ? (
            <div className="fx-compare-leg" aria-live="polite">
              <span>
                Pair · {compareRight}
                {findCatalogItem(compareRight)?.buyable === false
                  ? " (watch)"
                  : ""}
              </span>
              <b>
                {compareFetching
                  ? "…"
                  : compareOut
                    ? `${compareOut} ${compareRight}`
                    : "—"}
              </b>
            </div>
          ) : null}

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

          {!selected?.buyable ? (
            <p className="fx-checks">
              Watchlist only — quotes may fail until the Backed mint is confirmed
              on desk.
            </p>
          ) : null}

          {!reviewed ? (
            <button
              type="button"
              className="fx-btn fx-btn-primary fx-btn-block"
              data-testid="acquire-continue"
              disabled={!ready || !selected?.buyable}
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
                if (!selected?.buyable) {
                  setErr("This name is watchlist-only until mint is confirmed.");
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
