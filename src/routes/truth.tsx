import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Database, FileClock } from "lucide-react";
import { PublicShell, Metric } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getTruthBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/truth")({
  head: () => ({
    meta: [
      { title: "Share Truth — FOLIO" },
      {
        name: "description",
        content: "Live raw vs economic xStock balances with corporate-action provenance.",
      },
      { property: "og:title", content: "Share Truth — FOLIO" },
      {
        property: "og:description",
        content: "Live raw vs economic xStock balances with corporate-action provenance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  /** Prefetch live bundle on the server so first paint is not empty placeholders. */
  loader: async () => getTruthBundle({ data: { symbol: "AAPLx" } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchTruth = useServerFn(getTruthBundle);
  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["truth", "AAPLx"],
    queryFn: () => fetchTruth({ data: { symbol: "AAPLx" } }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const mult = data?.multiplier;
  const asset = data?.asset;
  const raw = data?.paperRaw ?? null;
  const economic = data?.economicShares ?? null;

  return (
    <PublicShell
      eyebrow="Corporate-action ledger"
      title="One balance. Every truth behind it."
      intro="Token balances alone can lie after dividends and splits. FOLIO reads the live xStocks Scaled UI multiplier on Solana mainnet and shows raw vs economic ownership — no fixture 4.0× theater."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <ModeBadge mode={mult?.ok ? mult.mode : "unavailable"}>
          {mult?.ok ? "xStocks live" : "Multiplier unavailable"}
        </ModeBadge>
        <ModeBadge
          mode={
            data?.scaledUi?.ok
              ? data.scaledUi.mode
              : data?.scaledUiCompare?.status === "mismatch"
                ? "unavailable"
                : "unavailable"
          }
        >
          {data?.scaledUi?.ok
            ? data.scaledUiCompare?.status === "mismatch"
              ? "On-chain Scaled UI mismatch"
              : data.scaledUiCompare?.status === "match"
                ? "On-chain Scaled UI match"
                : "On-chain Scaled UI live"
            : "On-chain Scaled UI off"}
        </ModeBadge>
        <ModeBadge mode={data?.jupiterPrice.ok ? data.jupiterPrice.mode : "unavailable"}>
          {!data?.jupiterPrice.ok
            ? "Jupiter price unavailable"
            : data.jupiterPrice.source.includes("stale")
              ? "Jupiter price stale-cache"
              : data.jupiterPrice.source.includes("cached")
                ? "Jupiter price cached"
                : "Jupiter price live"}
        </ModeBadge>
        <ModeBadge mode={data?.pyth.ok ? data.pyth.mode : "unavailable"}>
          {data?.pyth.ok
            ? data.pyth.data.feedSymbol?.startsWith("Equity.US.")
              ? "Pyth Equity.US"
              : "Pyth equity live"
            : "Pyth equity unavailable"}
        </ModeBadge>
        <ModeBadge mode={data?.pythXStock.ok ? data.pythXStock.mode : "unavailable"}>
          {data?.pythXStock.ok
            ? data.pythXStock.data.feedSymbol ?? "Pyth Crypto.xStock"
            : "Pyth Crypto.xStock off"}
        </ModeBadge>
        <ModeBadge mode={data?.pythOndo?.ok ? data.pythOndo.mode : "unavailable"}>
          {data?.pythOndo?.ok
            ? data.pythOndo.data.feedSymbol ?? "Pyth Crypto.ONDO"
            : "Pyth Crypto.ONDO off"}
        </ModeBadge>
      </div>

      <div className="metrics-grid">
        <Metric
          label="Paper raw balance"
          value={raw != null ? raw.toFixed(4) : isLoading ? "…" : "—"}
          detail="Illustrative paper qty — not wallet truth until Privy binding"
        />
        <Metric
          label="Live action multiplier"
          value={
            mult?.ok ? `${mult.data.currentMultiplier.toFixed(6)}×` : isLoading ? "…" : "—"
          }
          detail={
            mult?.ok
              ? `api.xstocks.fi · Solana · ${new Date(mult.asOf).toLocaleTimeString()}`
              : mult
                ? mult.reason
                : "Loading…"
          }
        />
        <Metric
          label="On-chain Scaled UI"
          value={
            data?.scaledUi?.ok
              ? `${data.scaledUi.data.effectiveMultiplier.toFixed(6)}×`
              : isLoading
                ? "…"
                : "—"
          }
          detail={
            data?.scaledUi?.ok
              ? `${data.scaledUiCompare?.note ?? "Token-2022"} · ${data.scaledUi.source.includes("public") ? "public RPC" : "dedicated RPC"}`
              : data?.scaledUi && !data.scaledUi.ok
                ? data.scaledUi.reason
                : "Awaiting mint + RPC"
          }
        />
        <Metric
          label="Economic shares"
          value={economic != null ? economic.toFixed(4) : isLoading ? "…" : "—"}
          detail="raw × live multiplier"
        />
        <Metric
          label="Pending corporate action"
          value={
            mult?.ok && mult.data.pendingMultiplier != null
              ? `${mult.data.pendingMultiplier.toFixed(6)}×`
              : mult?.ok
                ? "None"
                : isLoading
                  ? "…"
                  : "—"
          }
          detail={
            mult?.ok && mult.data.pendingMultiplier != null
              ? `xStocks pending · reason ${mult.data.reason ?? "n/a"}`
              : mult?.ok
                ? "No pending newMultiplier on live feed"
                : "Awaiting live multiplier"
          }
        />
      </div>

      {(isError || (data && !mult?.ok)) && (
        <section className="feature-band mt-6">
          <div>
            <StatusBadge tone="amber">Fail closed</StatusBadge>
            <h2>Truth feed issue</h2>
            <p>
              {isError
                ? String(error)
                : mult && !mult.ok
                  ? `${mult.reason}${mult.detail ? ` — ${mult.detail}` : ""}`
                  : "Unknown"}
            </p>
          </div>
        </section>
      )}

      <section className="feature-band">
        <div>
          <StatusBadge tone={mult?.ok ? "green" : "amber"}>
            {mult?.ok ? "Live" : "Blocked"}
          </StatusBadge>
          <h2>{asset?.ok ? asset.data.name : "AAPLx"} ownership math</h2>
          <p>
            {asset?.ok
              ? `Underlying ${asset.data.underlyingSymbol} · mint ${asset.data.solanaMint ?? "unknown"}`
              : "Asset metadata pending or unavailable."}
          </p>
          {data?.jupiterPrice.ok ? (
            <p className="mt-2 text-sm opacity-80">
              Jupiter venue ${data.jupiterPrice.data.usdPrice.toFixed(2)}
              {data.jupiterPrice.data.stockRefPrice != null
                ? ` · stockData $${data.jupiterPrice.data.stockRefPrice.toFixed(2)}`
                : ""}
              {data.diverge.divergeBps != null
                ? ` · diverge ${data.diverge.divergeBps.toFixed(1)} bps`
                : ""}
            </p>
          ) : null}
          {dataUpdatedAt ? (
            <p className="mt-2 text-xs opacity-60">
              Refreshed {new Date(dataUpdatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <ol className="timeline">
          <li>
            <FileClock />
            <span>
              <b>Live multiplier</b>
              {mult?.ok
                ? ` ${mult.data.currentMultiplier.toFixed(6)}× from xStocks public API`
                : " unavailable — UI will not invent a split"}
            </span>
          </li>
          <li>
            {data?.scaledUiCompare?.status === "mismatch" ? (
              <AlertTriangle />
            ) : data?.scaledUi?.ok ? (
              <CheckCircle2 />
            ) : (
              <Database />
            )}
            <span>
              <b>On-chain Scaled UI</b>
              {data?.scaledUi?.ok
                ? ` ${data.scaledUi.data.effectiveMultiplier.toFixed(6)}× Token-2022 · ${data.scaledUiCompare?.note ?? "read"}`
                : data?.scaledUi && !data.scaledUi.ok
                  ? ` ${data.scaledUi.reason} — no invented on-chain ×`
                  : " pending mint + RPC"}
            </span>
          </li>
          <li>
            <FileClock />
            <span>
              <b>Corporate-action pending</b>
              {mult?.ok && mult.data.pendingMultiplier != null
                ? ` newMultiplier ${mult.data.pendingMultiplier.toFixed(6)}× · reason ${mult.data.reason ?? "n/a"}`
                : mult?.ok
                  ? " none on live feed (no invented calendar)"
                  : " unavailable"}
            </span>
          </li>
          <li>
            <Database />
            <span>
              <b>Pyth references</b>
              {data?.pyth.ok
                ? ` ${data.pyth.data.feedSymbol ?? "Equity.US"} $${data.pyth.data.price.toFixed(2)}`
                : data?.pyth && !data.pyth.ok
                  ? ` equity ${data.pyth.reason}`
                  : " equity unavailable"}
              {data?.pythXStock.ok
                ? ` · ${data.pythXStock.data.feedSymbol ?? "Crypto.xStock"} $${data.pythXStock.data.price.toFixed(2)} (secondary)`
                : " · Crypto.xStock secondary off until keyed/mapped"}
              {data?.pythOndo?.ok
                ? ` · ${data.pythOndo.data.feedSymbol ?? "Crypto.ONDO"} $${data.pythOndo.data.price.toFixed(2)} (tertiary Ondo)`
                : " · Crypto.ONDO tertiary off until keyed/mapped"}
            </span>
          </li>
          <li>
            <Database />
            <span>
              <b>Pyth bounty feeds</b>{" "}
              {[
                data?.pythBountyFeeds?.equityUs,
                data?.pythBountyFeeds?.cryptoXStock,
                data?.pythBountyFeeds?.cryptoOndo,
              ]
                .filter(Boolean)
                .join(" · ") || "unmapped for this symbol"}
              {data?.pyth && !data.pyth.ok && data.pyth.reason === "pyth_api_key_missing"
                ? " — mapped · prices fail-closed until PYTH_API_KEY"
                : ""}
            </span>
          </li>
          <li>
            <Database />
            <span>
              <b>Venue check</b>
              {data?.jupiterPrice.ok
                ? ` Jupiter Price v3 · ${data.jupiterPrice.source.includes("cached") ? "cached/stale-aware" : "live"}`
                : data?.jupiterPrice && !data.jupiterPrice.ok
                  ? ` ${data.jupiterPrice.reason}`
                  : " Jupiter price unavailable"}
            </span>
          </li>
          <li data-testid="truth-diverge-gate" data-diverge-pass={String(data?.diverge.pass ?? "null")}>
            {data?.diverge.pass === false ? (
              <AlertTriangle />
            ) : data?.diverge.pass === true ? (
              <CheckCircle2 />
            ) : (
              <FileClock />
            )}
            <span>
              <b>Diverge gate</b>{" "}
              {data?.diverge.pass == null
                ? data?.diverge.note ??
                  "unavailable — no invent-a-pass (Pyth Equity.US + Jupiter venue required)"
                : (data.diverge.note ?? "pending")}
            </span>
          </li>
        </ol>
      </section>
    </PublicShell>
  );
}