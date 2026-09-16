import { createFileRoute, Link } from "@tanstack/react-router";
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
    <DeskShell eyebrow="Guarded acquisition" title="Build a quote">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="quote-only">Broadcast paused</ModeBadge>
        <ModeBadge mode={data?.multiplier.ok ? data.multiplier.mode : "unavailable"}>
          {data?.multiplier.ok
            ? `Multiplier ${data.multiplier.data.currentMultiplier.toFixed(6)}×`
            : "Multiplier pending"}
        </ModeBadge>
        <ModeBadge mode={data?.wash.ok ? data.wash.mode : "unavailable"}>
          {data?.wash.ok && data.wash.data.pass ? "Wash clear" : "Wash fail-closed"}
        </ModeBadge>
        <ModeBadge
          mode={
            data?.prefsFromSession && data.strictFailClosed
              ? "mainnet-read"
              : data?.prefsFromSession
                ? "paper"
                : "unavailable"
          }
        >
          {data?.prefsFromSession
            ? data.strictFailClosed
              ? "Strict fail-closed · session prefs"
              : "Strict off · session prefs"
            : "Strict prefs · no session"}
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
              Spend (USDC) · quote inspection ≤25 · broadcast paused (≤~$1 budget)
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                max={25}
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
            {data ? (
              <div className="desk-gate-grid acquire-gate-grid mb-4">
                <div className="desk-gate-row">
                  <div>
                    <b>Truth (API)</b>
                    <small>
                      {data.gates.truthOk
                        ? data.multiplier.ok
                          ? `API ${data.multiplier.data.currentMultiplier.toFixed(6)}×`
                          : "Live multiplier available for review"
                        : "Corporate-action / asset truth blocked"}
                    </small>
                  </div>
                  <StatusBadge tone={data.gates.truthOk ? "green" : "amber"}>
                    {data.gates.truthOk ? "pass" : "fail-closed"}
                  </StatusBadge>
                </div>
                <div className="desk-gate-row" data-testid="acquire-scaled-ui-gate">
                  <div>
                    <b>On-chain Scaled UI</b>
                    <small>
                      {data.scaledUi.ok
                        ? `${data.scaledUi.data.effectiveMultiplier.toFixed(6)}× · ${data.scaledUiCompare.note}`
                        : data.scaledUi.reason}
                    </small>
                  </div>
                  <StatusBadge
                    tone={
                      data.scaledUiCompare.status === "match"
                        ? "green"
                        : data.scaledUiCompare.status === "mismatch"
                          ? "amber"
                          : "amber"
                    }
                  >
                    {data.scaledUiCompare.status === "match"
                      ? "match"
                      : data.scaledUiCompare.status === "mismatch"
                        ? "mismatch"
                        : "off"}
                  </StatusBadge>
                </div>
                <div className="desk-gate-row">
                  <div>
                    <b>Wash / linked flow</b>
                    <small>
                      {data.wash.ok
                        ? `pressure=${data.wash.data.pressure} · n=${data.wash.data.sampleSize}`
                        : data.wash.reason}
                    </small>
                  </div>
                  <StatusBadge tone={data.gates.washOk ? "green" : "amber"}>
                    {data.gates.washOk ? "pass" : "fail-closed"}
                  </StatusBadge>
                </div>
                <div className="desk-gate-row">
                  <div>
                    <b>Jupiter quote</b>
                    <small>
                      {data.jupiter.ok
                        ? `${data.jupiter.data.outUiAmount.toFixed(6)} ${symbol}`
                        : data.jupiter.reason}
                    </small>
                  </div>
                  <StatusBadge tone={data.gates.quoteOk ? "blue" : "amber"}>
                    {data.gates.quoteOk ? "quote-only" : "fail-closed"}
                  </StatusBadge>
                </div>
                <div className="desk-gate-row">
                  <div>
                    <b>Pyth diverge</b>
                    <small>
                      {data.pyth.ok
                        ? "Hermes equity live"
                        : data.pyth.reason}
                    </small>
                  </div>
                  <StatusBadge
                    tone={
                      data.gates.divergeOk === false
                        ? "amber"
                        : data.pyth.ok
                          ? "green"
                          : "amber"
                    }
                  >
                    {data.gates.divergeOk === false
                      ? "blocked"
                      : data.pyth.ok
                        ? "ok"
                        : "key-gated"}
                  </StatusBadge>
                </div>
                <div className="desk-gate-row">
                  <div>
                    <b>canReview</b>
                    <small>
                      Continue stays locked until truth · wash · quote · diverge clear
                    </small>
                  </div>
                  <StatusBadge tone={data.gates.canReview ? "green" : "amber"}>
                    {data.gates.canReview ? "ready" : "blocked"}
                  </StatusBadge>
                </div>
              </div>
            ) : null}
            <p>
              <span>Corporate-action / asset</span>
              <StatusBadge tone={data?.gates.truthOk ? "green" : "amber"}>
                {data?.gates.truthOk
                  ? data.multiplier.ok && data.multiplier.data.pendingMultiplier != null
                    ? `Live · pending ${data.multiplier.data.pendingMultiplier.toFixed(6)}×`
                    : "Verified live · no pending CA"
                  : data
                    ? "Blocked"
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Wash / linked flow</span>
              <StatusBadge tone={data?.gates.washOk ? "green" : "amber"}>
                {data?.gates.washOk && data.wash.ok
                  ? `Tape clear · ${data.wash.data.pressure} · n=${data.wash.data.sampleSize}`
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
              <span>Raydium pools</span>
              <StatusBadge
                tone={
                  data?.pools.ok && data.pools.data.raydium.length > 0
                    ? "blue"
                    : "amber"
                }
              >
                {data?.pools.ok
                  ? data.pools.data.raydium.length > 0
                    ? `${data.pools.data.raydium.length} observed · awareness only`
                    : "Zero pools · awareness only"
                  : data?.pools && !data.pools.ok
                    ? data.pools.reason
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Jupiter route</span>
              <StatusBadge tone={data?.gates.quoteOk ? "blue" : "amber"}>
                {data?.gates.quoteOk && data.jupiter.ok
                  ? `${data.jupiter.data.outUiAmount.toFixed(6)} ${symbol} · ${
                      data.jupiter.source.includes("stale")
                        ? "stale-cache"
                        : data.jupiter.source.includes("cached")
                          ? "cached"
                          : "live"
                    }`
                  : data?.jupiter && !data.jupiter.ok
                    ? data.jupiter.reason
                    : "…"}
              </StatusBadge>
            </p>
            <p>
              <span>Pyth / venue diverge</span>
              <StatusBadge
                tone={
                  data?.gates.divergeOk === false
                    ? "amber"
                    : data?.pyth.ok
                      ? "green"
                      : "amber"
                }
              >
                {data?.gates.divergeOk === false
                  ? "Blocked — outside band"
                  : data?.pyth.ok
                    ? "Pyth live · in band or unchecked pair"
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
            {data && data.gates.honestyNotes.length > 0 ? (
              <div className="review-box mt-3">
                <p>
                  <b>Honesty labels</b>
                  <span className="ml-2 text-sm opacity-70">
                    {data.strictFailClosed
                      ? "(strict fail-closed on · unresolved required signals also block review)"
                      : "(do not invent a pass · do not alone block review unless Strict is on)"}
                  </span>
                </p>
                <ul>
                  {data.gates.honestyNotes.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data && !data.prefsFromSession ? (
              <p className="mt-3 text-sm opacity-80">
                Strict fail-closed prefs apply after Privy + Supabase mint an httpOnly session
                (active tenant). Public demo stays honesty-labeled for missing Pyth until then.
              </p>
            ) : null}
            {data &&
            (data.gates.blockedReasons.some((r) => /BITQUERY_API_KEY|PYTH_API_KEY/.test(r)) ||
              data.gates.honestyNotes.some((r) => /PYTH_API_KEY/.test(r))) ? (
              <p className="mt-3 text-sm opacity-80">
                Next:{" "}
                <Link to="/desk/settings" className="underline">
                  Settings readiness
                </Link>{" "}
                · keys runbook <code>docs/KEYS_LANDING.md</code> ·{" "}
                <code>npm run keys</code>
              </p>
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
              {data?.jupiter.ok ? (
                <small>
                  {data.jupiter.source.includes("stale")
                    ? "Stale-cache after 429 · not invented"
                    : data.jupiter.source.includes("cached")
                      ? "Short TTL cache hit · quote-only"
                      : "Fresh Jupiter quote · quote-only"}
                </small>
              ) : null}
            </div>
            <div>
              <span>Multiplier</span>
              <b>
                {data?.multiplier.ok
                  ? `${data.multiplier.data.currentMultiplier.toFixed(6)}×`
                  : "—"}
              </b>
              {data?.multiplier.ok ? (
                <small>
                  {data.multiplier.data.pendingMultiplier != null
                    ? `Pending CA ${data.multiplier.data.pendingMultiplier.toFixed(6)}×`
                    : "No pending newMultiplier on live feed"}
                </small>
              ) : null}
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