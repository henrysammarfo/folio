import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { getNetworkBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/execution")({
  head: () => ({
    meta: [
      { title: "Guarded Execution — FOLIO" },
      {
        name: "description",
        content:
          "Fail-closed quote routing for Solana xStocks — missing signals stop the path.",
      },
      { property: "og:title", content: "Guarded Execution — FOLIO" },
      {
        property: "og:description",
        content:
          "Fail-closed quote routing for Solana xStocks — missing signals stop the path.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  /** Prefetch live matrix so wash / quote / broadcast honesty shows on first paint. */
  loader: async () => getNetworkBundle(),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchNetwork = useServerFn(getNetworkBundle);
  const { data } = useQuery({
    queryKey: ["public-execution-network"],
    queryFn: () => fetchNetwork(),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const byCap = Object.fromEntries(
    (data?.rows ?? []).map((r) => [r.capability, r] as const),
  );
  const wash = byCap["Wash / linked-flow gate"];
  const quote = byCap["Jupiter swap quote"];
  const pyth = byCap["Pyth Hermes equity reference"];
  const broadcastPaused = data?.broadcastPaused !== false;

  return (
    <PublicShell
      tone="execution"
      eyebrow="Execution policy"
      title="Every gate is labeled. A missing signal stops the path."
      intro="FOLIO compares reference pricing, venue liquidity, and linked-flow pressure before offering a quote. Green is not a guarantee — it means the live check returned and cleared its band. Broadcast stays off on the ≤~$1 Stocklana budget."
    >
      <div className="mkt-status-row">
        <StatusBadge tone={wash?.mode === "mainnet-read" ? "green" : "amber"}>
          Wash · {wash?.mode ?? "unavailable"}
        </StatusBadge>
        <StatusBadge
          tone={
            quote?.mode === "quote-only" || quote?.mode === "mainnet-read"
              ? "blue"
              : "amber"
          }
        >
          Quote · {quote?.mode ?? "unavailable"}
        </StatusBadge>
        <StatusBadge tone={broadcastPaused ? "neutral" : "amber"}>
          {broadcastPaused ? "Broadcast paused" : "Broadcast armed"}
        </StatusBadge>
      </div>

      <ol className="mkt-stack">
        <li>
          <div className="mkt-stack-meta">
            <StatusBadge tone={pyth?.mode === "mainnet-read" ? "green" : "amber"}>
              {pyth?.mode === "mainnet-read" ? "Live" : "Labeled"}
            </StatusBadge>
          </div>
          <h2>Oracle coherence</h2>
          <p>
            {pyth?.detail ??
              "Pyth vs venue diverge is scored when both feeds are live. If Pyth is unavailable on this egress, the UI says so — we do not invent a pass."}
          </p>
        </li>
        <li>
          <div className="mkt-stack-meta">
            <StatusBadge tone={wash?.mode === "mainnet-read" ? "green" : "amber"}>
              {wash?.mode === "mainnet-read" ? "Keyed" : "Fail-closed"}
            </StatusBadge>
          </div>
          <h2>Wash pressure</h2>
          <p>
            {wash?.detail ??
              "Linked-flow heuristics from Bitquery when keyed. Missing key or dirty sample fail-closes size — never a silent green tape."}
          </p>
        </li>
        <li>
          <div className="mkt-stack-meta">
            <StatusBadge tone="blue">Quote only</StatusBadge>
          </div>
          <h2>Jupiter path</h2>
          <p>
            {quote?.detail ??
              "Routes are inspected on mainnet. This build does not broadcast swaps or borrows until funding and an explicit unpause land."}{" "}
            {broadcastPaused ? "Broadcast remains paused." : null}
          </p>
        </li>
      </ol>

      <section className="mkt-block" aria-label="What execution means here">
        <h2>Guarded, not gamified</h2>
        <p>
          IPO and meme lanes sit behind the same wash and Scaled UI checks as
          mega names. A pair compare on Buy never softens a blocked route into a
          green “go.”
        </p>
        <p className="mkt-links">
          <Link to="/desk/acquire">Open acquire desk →</Link>
          <Link to="/network">Full network matrix →</Link>
        </p>
      </section>
    </PublicShell>
  );
}
