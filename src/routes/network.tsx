import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getNetworkBundle } from "@/lib/desk.functions";
import type { IntegrationMode } from "@/lib/adapters/types";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Network Truth — FOLIO" },
      {
        name: "description",
        content: "Exact network availability across the FOLIO stack.",
      },
      { property: "og:title", content: "Network Truth — FOLIO" },
      {
        property: "og:description",
        content: "Exact network availability across the FOLIO stack.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  /** Prefetch live matrix so NestUSD / wash / broadcast honesty is visible on first paint. */
  loader: async () => getNetworkBundle(),
  component: Page,
});

function toneFor(mode: IntegrationMode): "green" | "amber" | "blue" | "neutral" {
  if (mode === "mainnet-read") return "green";
  if (mode === "quote-only" || mode === "fork") return "blue";
  if (mode === "paper") return "amber";
  return "neutral";
}

function Page() {
  const initial = Route.useLoaderData();
  const fetchNetwork = useServerFn(getNetworkBundle);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["network-matrix"],
    queryFn: () => fetchNetwork(),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <PublicShell
      tone="network"
      eyebrow="Network matrix"
      title="No blurred lines between demo and live."
      intro="Stocklana + Colosseum World’s Fair path: mainnet READ for truth, Jupiter quote-only, borrow CPI unavailable until funded (no fork harness on this budget). Custom mainnet program deploy is out of the ≤~$1 budget. Broadcast stays paused until funded and explicitly confirmed."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Mainnet-primary truth</ModeBadge>
        <ModeBadge mode="quote-only">Quote-only swaps</ModeBadge>
        <ModeBadge mode={data?.broadcastPaused !== false ? "unavailable" : "mainnet-read"}>
          {data?.broadcastPaused !== false ? "Broadcast paused" : "Broadcast armed"}
        </ModeBadge>
      </div>

      {isLoading ? <p>Loading live capability probe…</p> : null}
      {isError ? (
        <StatusBadge tone="amber">Matrix error: {String(error)}</StatusBadge>
      ) : null}

      <div className="network-table">
        {(data?.rows ?? []).map((row) => (
          <div key={row.capability}>
            <span>
              {row.capability}
              <small className="mt-1 block opacity-70">{row.detail}</small>
            </span>
            <StatusBadge tone={toneFor(row.mode)}>{row.mode}</StatusBadge>
          </div>
        ))}
      </div>
      <section className="mkt-aside-band" aria-label="How to read this matrix">
        <h2>Read the mode, not the marketing</h2>
        <p>
          Mainnet-read means a live probe returned. Quote-only means Jupiter
          routes without broadcast. Unavailable is intentional — not a broken
          badge waiting for a screenshot.
        </p>
      </section>
    </PublicShell>
  );
}