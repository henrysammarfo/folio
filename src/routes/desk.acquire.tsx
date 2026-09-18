import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { TradingViewChart } from "@/components/tradingview-chart";
import { Button } from "@/components/ui/button";
import { getAcquireBundle } from "@/lib/desk.functions";

const SYMBOLS = ["AAPLx", "NVDAx", "TSLAx"] as const;

export const Route = createFileRoute("/desk/acquire")({
  head: () => ({
    meta: [
      { title: "Acquire — FOLIO" },
      { name: "description", content: "Build a guarded xStock quote on Solana mainnet." },
      { property: "og:title", content: "Acquire — FOLIO" },
      {
        property: "og:description",
        content: "Build a guarded xStock quote on Solana mainnet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  /** Prefetch default AAPLx $1 quote so wash fail-closed is visible by checks step. */
  loader: async () => getAcquireBundle({ data: { symbol: "AAPLx", spendUsdc: 1 } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const [step, setStep] = useState(1);
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>("AAPLx");
  const [amount, setAmount] = useState("1");
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0;

  const fetchAcquire = useServerFn(getAcquireBundle);
  const enabled = ready && step >= 2;
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["acquire", symbol, spendUsdc],
    queryFn: () => fetchAcquire({ data: { symbol, spendUsdc } }),
    enabled,
    initialData: symbol === "AAPLx" && spendUsdc === 1 ? initial : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });

  const indicative = useMemo(() => {
    if (data?.jupiter.ok) return data.jupiter.data.outUiAmount.toFixed(6);
    if (data?.jupiterPrice.ok && spendUsdc > 0) {
      return (spendUsdc / data.jupiterPrice.data.usdPrice).toFixed(6);
    }
    return null;
  }, [data, spendUsdc]);

  return (
    <DeskShell eyebrow="Buy" title={`Buy ${symbol}`}>
      <div className="stepper">
        {["Order", "Checks", "Review"].map((x, i) => (
          <span className={step >= i + 1 ? "step-active" : ""} key={x}>
            {i + 1}. {x}
          </span>
        ))}
      </div>

      <div className="acquire-layout">
        <Panel
          title={`${symbol.replace(/x$/i, "")} market`}
          meta={<StatusBadge tone="blue">Live</StatusBadge>}
        >
          <TradingViewChart symbol={symbol} height={440} interval="60" theme="light" />
        </Panel>

        <div className="acquire-ticket">
          <Panel
            title={
              step === 1 ? "Your order" : step === 2 ? "Safety checks" : "Confirm quote"
            }
            meta={<StatusBadge tone="blue">Live</StatusBadge>}
          >
            {step === 1 ? (
              <div className="form-grid">
                <label>
                  Asset
                  <select
                    value={symbol}
                    onChange={(e) =>
                      setSymbol(e.target.value as (typeof SYMBOLS)[number])
                    }
                  >
                    {SYMBOLS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount (USDC)
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    max={25}
                  />
                </label>
                <div className="quote-preview">
                  <span>You receive (after checks)</span>
                  <b>
                    {indicative
                      ? `${indicative} ${symbol}`
                      : "Continue to see live quote"}
                  </b>
                  <small>Live Jupiter quote</small>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="checks consumer-checks">
                {isFetching ? <p>Running checks…</p> : null}
                {isError ? (
                  <p>
                    <span>Something went wrong</span>
                    <StatusBadge tone="neutral">Retry</StatusBadge>
                  </p>
                ) : null}
                <div className="desk-gate-grid acquire-gate-grid mb-4">
                  <div className="desk-gate-row">
                    <div>
                      <b>Share truth</b>
                      <small>
                        {data?.multiplier.ok
                          ? `${data.multiplier.data.currentMultiplier.toFixed(6)}×`
                          : "Checking live share count"}
                      </small>
                    </div>
                    <StatusBadge tone={data?.gates.truthOk ? "green" : "neutral"}>
                      {data?.gates.truthOk ? "OK" : "…"}
                    </StatusBadge>
                  </div>
                  <div className="desk-gate-row" data-testid="acquire-scaled-ui-gate">
                    <div>
                      <b>On-chain match</b>
                      <small>
                        {data?.scaledUiCompare.status === "match"
                          ? "Matches the ledger"
                          : "Confirming…"}
                      </small>
                    </div>
                    <StatusBadge
                      tone={
                        data?.scaledUiCompare.status === "match" ? "green" : "neutral"
                      }
                    >
                      {data?.scaledUiCompare.status === "match" ? "OK" : "…"}
                    </StatusBadge>
                  </div>
                  <div className="desk-gate-row">
                    <div>
                      <b>Safe route</b>
                      <small>
                        {data?.gates.washOk ? "Route looks clean" : "Checking route…"}
                      </small>
                    </div>
                    <StatusBadge tone={data?.gates.washOk ? "green" : "neutral"}>
                      {data?.gates.washOk ? "OK" : "…"}
                    </StatusBadge>
                  </div>
                  <div className="desk-gate-row">
                    <div>
                      <b>Live quote</b>
                      <small>
                        {data?.jupiter.ok
                          ? `${data.jupiter.data.outUiAmount.toFixed(6)} ${symbol}`
                          : "Fetching quote…"}
                      </small>
                    </div>
                    <StatusBadge tone={data?.gates.quoteOk ? "green" : "neutral"}>
                      {data?.gates.quoteOk ? "OK" : "…"}
                    </StatusBadge>
                  </div>
                </div>
                {!data?.gates.canReview && data ? (
                  <p className="consumer-note">
                    We need a clear share count, safe route, and live quote before
                    you continue.{" "}
                    <button type="button" className="underline" onClick={() => refetch()}>
                      Refresh
                    </button>
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="review-box consumer-review">
                <p>
                  Review your live quote. You can buy when fills are enabled for
                  your account.
                </p>
                <div>
                  <span>You pay</span>
                  <b>${spendUsdc.toLocaleString()} USDC</b>
                </div>
                <div>
                  <span>You receive</span>
                  <b>
                    {data?.jupiter.ok
                      ? `${data.jupiter.data.outUiAmount.toFixed(6)} ${symbol}`
                      : "—"}
                  </b>
                  <small>Live Jupiter quote</small>
                </div>
                <div>
                  <span>Share count</span>
                  <b>
                    {data?.multiplier.ok
                      ? `${data.multiplier.data.currentMultiplier.toFixed(6)}×`
                      : "—"}
                  </b>
                </div>
                <div>
                  <span>Route</span>
                  <b>{data?.gates.washOk ? "Clear" : "Checking"}</b>
                </div>
              </div>
            ) : null}

            <div className="flow-actions">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              ) : null}
              <Button
                type="button"
                data-testid="acquire-continue"
                disabled={
                  !ready ||
                  (step === 2 && (isFetching || !data?.gates.canReview)) ||
                  (step === 3 && !data?.gates.canReview)
                }
                onClick={() => {
                  if (step === 2 && !data?.gates.canReview) return;
                  setStep(Math.min(3, step + 1));
                }}
              >
                {step === 3
                  ? "Done"
                  : step === 2 && data && !data.gates.canReview
                    ? "Waiting on checks"
                    : "Continue"}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </DeskShell>
  );
}
