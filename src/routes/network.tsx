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
      { title: "Network honesty — FOLIO" },
      {
        name: "description",
        content:
          "What is live, paused, or unavailable on FOLIO — labeled clearly.",
      },
      { property: "og:title", content: "Network honesty — FOLIO" },
      {
        property: "og:description",
        content:
          "What is live, paused, or unavailable on FOLIO — labeled clearly.",
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
      eyebrow="Live status"
      title="No blurred lines between demo and live."
      intro="Every capability is labeled. Share counts and prices read mainnet. Buys and borrows need your signature when armed. NestUSD shows risk metrics; Nest execute stays on their app for now. We never invent a fill."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Live mainnet reads</ModeBadge>
        <ModeBadge mode="quote-only">Live quotes</ModeBadge>
        <ModeBadge mode={data?.broadcastPaused !== false ? "unavailable" : "mainnet-read"}>
          {data?.broadcastPaused !== false ? "Fills paused" : "Fills armed"}
        </ModeBadge>
      </div>

      {isLoading ? <p>Loading live status…</p> : null}
      {isError ? (
        <StatusBadge tone="amber">Status error: {String(error)}</StatusBadge>
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
        <h2>Read the label, not the hype</h2>
        <p>
          Live read means a real probe returned. Quote means you can review a
          route. Unavailable is intentional — not a broken badge waiting for a
          screenshot.
        </p>
      </section>
    </PublicShell>
  );
}