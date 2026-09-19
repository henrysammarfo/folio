import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { DeskShell } from "@/components/desk-shell";
import { TradingViewChart } from "@/components/tradingview-chart";
import { getAcquireBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

const SYMBOLS = ["AAPLx", "NVDAx", "TSLAx"] as const;

export const Route = createFileRoute("/desk/acquire")({
  head: () => ({
    meta: siteMeta({
      title: "Buy — FOLIO",
      description: "Buy tokenized stocks on Solana with live quotes.",
      path: "/desk/acquire",
    }),
  }),
  loader: async () =>
    getAcquireBundle({ data: { symbol: "AAPLx", spendUsdc: 1 } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>("AAPLx");
  const [amount, setAmount] = useState("1");
  const [honeypot, setHoneypot] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0 && spendUsdc <= 25;

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
      <section className="prod-buy">
        <div className="prod-buy-chart">
          <TradingViewChart
            symbol={symbol}
            height={420}
            interval="60"
            theme="light"
          />
        </div>

        <aside className="prod-ticket">
          <h1 className="prod-page-title">Buy {symbol}</h1>
          <p className="prod-sub">Live quote · fills pause until enabled.</p>

          <label className="prod-field">
            Asset
            <select
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value as (typeof SYMBOLS)[number]);
                setReviewed(false);
              }}
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="prod-field">
            Amount (USDC)
            <input
              value={amount}
              inputMode="decimal"
              onChange={(e) => {
                setAmount(e.target.value);
                setErr(null);
                setReviewed(false);
              }}
            />
          </label>

          <label className="hp-field" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>

          <div className="prod-quote">
            <span>You receive</span>
            <strong>
              {isFetching ? "…" : out ? `${out} ${symbol}` : "—"}
            </strong>
          </div>

          {err ? <p className="prod-err">{err}</p> : null}

          {!reviewed ? (
            <button
              type="button"
              className="prod-cta"
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
            <div className="prod-review">
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
                <p className="prod-checks">{checkLines.join("\n")}</p>
              ) : null}
              <button
                type="button"
                className="prod-cta"
                disabled={!canBuy}
              >
                {canBuy
                  ? "Buy — fills paused"
                  : data?.gates.blockedReasons.some((r) =>
                        /BITQUERY|fail-closed|wash/i.test(r),
                      )
                    ? "Blocked · fail-closed"
                    : "Waiting on checks"}
              </button>
              <button
                type="button"
                className="prod-text-btn"
                onClick={() => setReviewed(false)}
              >
                Edit order
              </button>
            </div>
          )}

          <p className="prod-ticket-foot">
            Prefer credit? <Link to="/desk/credit">Borrow</Link>
          </p>
        </aside>
      </section>
    </DeskShell>
  );
}
