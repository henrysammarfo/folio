import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Waves, CircleStop } from "lucide-react";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
// tones: green | amber | blue | neutral

export const Route = createFileRoute("/execution")({
  head: () => ({
    meta: [
      { title: "Guarded Execution — FOLIO" },
      {
        name: "description",
        content: "Fail-closed quote routing for Solana xStocks — missing signals stop the path.",
      },
      { property: "og:title", content: "Guarded Execution — FOLIO" },
      {
        property: "og:description",
        content: "Fail-closed quote routing for Solana xStocks — missing signals stop the path.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      eyebrow="Execution policy"
      title="Every gate is labeled. A missing signal stops the path."
      intro="FOLIO compares reference pricing, venue liquidity, and linked-flow pressure before offering a quote. Green is not a guarantee — it means the live check returned and cleared its band. Broadcast stays off on the ≤~$1 Stocklana budget."
    >
      <div className="three-features">
        <article>
          <ShieldCheck />
          <StatusBadge tone="amber">Labeled</StatusBadge>
          <h2>Oracle coherence</h2>
          <p>
            Pyth vs venue diverge is scored when both feeds are live. If Pyth is unavailable on this
            egress, the UI says so — we do not invent a pass.
          </p>
        </article>
        <article>
          <Waves />
          <StatusBadge tone="amber">Heuristic</StatusBadge>
          <h2>Wash pressure</h2>
          <p>
            Linked-flow heuristics from Bitquery when keyed. Missing key or dirty sample fail-closes
            size — never a silent green tape.
          </p>
        </article>
        <article>
          <CircleStop />
          <StatusBadge tone="blue">Quote only</StatusBadge>
          <h2>Jupiter path</h2>
          <p>
            Routes are inspected on mainnet. This build does not broadcast swaps or borrows until
            funding and an explicit unpause land.
          </p>
        </article>
      </div>
    </PublicShell>
  );
}
