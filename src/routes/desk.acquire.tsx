import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
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
  component: Page,
});

function Page() {
  const [step, setStep] = useState(1);
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>("AAPLx");
  const [amount, setAmount] = useState("100");
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0;

  const fetchAcquire = useServerFn(getAcquireBundle);
  const enabled = ready && step >= 2;
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["acquire", symbol, spendUsdc],
    queryFn: () => fetchAcquire({ data: { symbol, spendUsdc } }),
    enabled,
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
    <DeskShell eyebrow="Guarded acquisition" title="Build a quote">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="quote-only">Broadcast disabled</ModeBadge>
        <ModeBadge mode={data?.multiplier.ok ? data.multiplier.mode : "unavailable"}>
          {data?.multiplier.ok
            ? `Multiplier ${data.multiplier.data.currentMultiplier.toFixed(6)}×`
            : "Multiplier pending"}
        </ModeBadge>
        <ModeBadge mode={data?.wash.ok ? data.wash.mode : "unavailable"}>
          {data?.wash.ok && data.wash.data.pass ? "Wash clear" : "Wash fail-closed"}
        </ModeBadge>
      </div>

      <div className="stepper">
        {["Order", "Checks", "Review"].map((x, i) => (
          <span className={step >= i + 1 ? "step-active" : ""} key={x}>
            {i + 1}. {x}
          </span>
        ))}
      </div>

      <Panel
        title={
          step === 1 ? "Describe the order" : step === 2 ? "Policy checks" : "Quote-only review"
        }
        meta={<StatusBadge tone="blue">No broadcast</StatusBadge>}
      >
        {step === 1 ? (
          <div className="form-grid">
            <label>
              Asset
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value as (typeof SYMBOLS)[number])}
              >
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Spend (USDC)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <div className="quote-preview">
              <span>Indicative (after checks)</span>
              <b>{indicative ? `${indicative} ${symbol}` : "Run checks for live Jupiter quote"}</b>
              <small>Mainnet quote-only · never a fill</small>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="checks">
            {isFetching ? <p>Fetching live gates…</p> : null}
            {isError ? (
              <p>
                <span>Bundle error</span>
                <StatusBadge tone="amber">{String(error)}</StatusBadge>
              </p>
            ) : null}
            <p>
              <span>Corporate-action / asset</span>
              <StatusBadge tone={data?.gates.truthOk ? "green" : "amber"}>
                {data?.gates.truthOk ? "Verified live" : data ? "Blocked" : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Wash / linked flow</span>
              <StatusBadge tone={data?.gates.washOk ? "green" : "amber"}>
                {data?.gates.washOk && data.wash.ok
                  ? `Pass · ${data.wash.data.pressure} · n=${data.wash.data.sampleSize}`
                  : data?.wash && data.wash.ok
                    ? `${data.wash.data.pressure} · n=${data.wash.data.sampleSize}`
                    : data?.wash && !data.wash.ok
                      ? data.wash.reason
                      : "…"}
              </StatusBadge>
            </p>
            {data?.wash.ok && data.wash.data.notes.length > 0 ? (
              <div className="review-box mt-2">
                <p>
                  <b>Wash notes</b>
                </p>
                <ul>
                  {data.wash.data.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p>
              <span>Jupiter route</span>
              <StatusBadge tone={data?.gates.quoteOk ? "blue" : "amber"}>
                {data?.gates.quoteOk && data.jupiter.ok
                  ? `${data.jupiter.data.outUiAmount.toFixed(6)} ${symbol}`
                  : data?.jupiter && !data.jupiter.ok
                    ? data.jupiter.reason
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Pyth / venue diverge</span>
              <StatusBadge tone={data?.pyth.ok ? "green" : "amber"}>
                {data?.pyth.ok
                  ? "Pyth live"
                  : data?.pyth && !data.pyth.ok
                    ? `Pyth: ${data.pyth.reason}`
                    : "…"}
              </StatusBadge>
            </p>
            {data && data.gates.blockedReasons.length > 0 ? (
              <div className="review-box mt-3">
                <p>
                  <b>Fail-closed reasons</b>
                </p>
                <ul>
                  {data.gates.blockedReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Button variant="outline" type="button" onClick={() => refetch()} className="mt-2">
              Refresh live gates
            </Button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="review-box">
            <p>
              This review is <b>quote-only</b>. FOLIO will not broadcast a swap on the ≤~$1
              Stocklana budget. Wash remains fail-closed until Bitquery is wired.
            </p>
            <div>
              <span>Spend</span>
              <b>${spendUsdc.toLocaleString()} USDC</b>
            </div>
            <div>
              <span>Live receive (quote)</span>
              <b>
                {data?.jupiter.ok
                  ? `${data.jupiter.data.outUiAmount.toFixed(6)} ${symbol}`
                  : "Unavailable"}
              </b>
            </div>
            <div>
              <span>Multiplier</span>
              <b>
                {data?.multiplier.ok
                  ? `${data.multiplier.data.currentMultiplier.toFixed(6)}×`
                  : "—"}
              </b>
            </div>
            <div>
              <span>Wash</span>
              <b>
                {data?.wash.ok
                  ? `${data.wash.data.pass ? "Clear" : "Blocked"} · ${data.wash.data.pressure}`
                  : data?.wash && !data.wash.ok
                    ? data.wash.reason
                    : "Unavailable"}
              </b>
            </div>
            <div>
              <span>Execution</span>
              <b>Disabled · labeled quote-only</b>
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
              ? "Quote reviewed"
              : step === 2 && data && !data.gates.canReview
                ? "Blocked — fail-closed"
                : "Continue"}
          </Button>
        </div>
      </Panel>
    </DeskShell>
  );
}