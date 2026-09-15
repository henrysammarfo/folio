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
        <ModeBadge mode={data?.jupiterPrice.ok ? data.jupiterPrice.mode : "unavailable"}>
          {data?.jupiterPrice.ok ? "Jupiter price live" : "Jupiter price unavailable"}
        </ModeBadge>
        <ModeBadge mode={data?.pyth.ok ? data.pyth.mode : "unavailable"}>
          {data?.pyth.ok ? "Pyth live" : "Pyth unavailable"}
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
          label="Economic shares"
          value={economic != null ? economic.toFixed(4) : isLoading ? "…" : "—"}
          detail="raw × live multiplier"
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
            <Database />
            <span>
              <b>Venue check</b>
              {data?.jupiterPrice.ok
                ? " Jupiter Price v3 mainnet"
                : " Jupiter price unavailable"}
            </span>
          </li>
          <li>
            {data?.diverge.pass === false ? <AlertTriangle /> : <CheckCircle2 />}
            <span>
              <b>Diverge gate</b> {data?.diverge.note ?? "pending"}
            </span>
          </li>
        </ol>
      </section>
    </PublicShell>
  );
}