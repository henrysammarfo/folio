import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PublicShell, MktSection } from "@/components/public-page";
import { getNetworkBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/execution")({
  head: () => ({
    meta: [
      { title: "Safe routes — FOLIO" },
      {
        name: "description",
        content:
          "FOLIO checks price, liquidity, and wash pressure before you buy — missing signals pause the path.",
      },
      { property: "og:title", content: "Safe routes — FOLIO" },
      {
        property: "og:description",
        content:
          "FOLIO checks price, liquidity, and wash pressure before you buy — missing signals pause the path.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
      eyebrow="Safe routes"
      title="Every gate is labeled. Missing signals pause the path."
      intro="FOLIO checks reference price, venue liquidity, and wash pressure before you buy. Green means the live check cleared — not a guarantee. When a signal is missing or dirty, size pauses instead of going silent green."
      aside={
        <div className="mkt-status-col" aria-label="Execution status">
          <div
            className="mkt-status-line"
            data-ok={String(wash?.mode === "mainnet-read")}
          >
            <b>Wash</b>
            <span>{wash?.mode ?? "unavailable"}</span>
          </div>
          <div
            className="mkt-status-line"
            data-ok={String(
              quote?.mode === "quote-only" || quote?.mode === "mainnet-read",
            )}
          >
            <b>Quote</b>
            <span>{quote?.mode ?? "unavailable"}</span>
          </div>
          <div className="mkt-status-line" data-ok={String(broadcastPaused)}>
            <b>Broadcast</b>
            <span>{broadcastPaused ? "Paused" : "Armed"}</span>
          </div>
        </div>
      }
    >
      <MktSection n="01" title="Price check">
        <p>
          {pyth?.detail ??
            "When both reference and venue prices are live, we score the gap. If a feed is down, the UI says so — we do not invent a pass."}
        </p>
      </MktSection>

      <MktSection n="02" title="Wash pressure">
        <p>
          {wash?.detail ??
            "We watch linked-flow pressure when the tape is live. Missing or dirty samples pause size — never a silent green light."}
        </p>
      </MktSection>

      <MktSection n="03" title="Buy path">
        <p>
          {quote?.detail ??
            "Routes are inspected on mainnet. You review the quote; your wallet signs the fill when buys are armed."}{" "}
          {broadcastPaused ? "Fills are paused on this build." : null}
        </p>
        <p className="mkt-links">
          <Link to="/desk/acquire">Open Buy →</Link>
          <Link to="/network">Live network status →</Link>
        </p>
      </MktSection>
    </PublicShell>
  );
}
