import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";

export const Route = createFileRoute("/lab/ui")({
  head: () => ({
    meta: [
      { title: "Lab · 21st UI — FOLIO" },
      { name: "description", content: "Approve-gated 21st.dev / desk-card candidates." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      eyebrow="Approve gate"
      title="21st.dev / desk OS candidates land here first."
      intro="Install or sketch UI candidates on this lab route. Production desk tokens stay frozen until you approve a candidate id in chat."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge tone="blue">Awaiting approval</StatusBadge>
        <StatusBadge tone="neutral">Reply: desk-density-a · desk-density-b · gate-chip</StatusBadge>
        <StatusBadge tone="neutral">API_KEY_21ST ready</StatusBadge>
      </div>
      <div className="lab-grid">
        <article className="lab-card">
          <StatusBadge tone="amber">desk-density-a</StatusBadge>
          <h3>Dense ledger row</h3>
          <div className="lab-desk-preview" aria-hidden>
            <div>
              <span>AAPLx</span>
              <b>
                1.003269×<small> sample</small>
              </b>
            </div>
            <div>
              <span>Wash</span>
              <b>fail-closed</b>
            </div>
            <div>
              <span>Quote</span>
              <b>USDC → AAPLx</b>
            </div>
          </div>
          <p className="text-sm opacity-80">
            NetroBNB-inspired density without cloning brand — tabular nums, one job per row.
          </p>
        </article>

        <article className="lab-card">
          <StatusBadge tone="amber">desk-density-b</StatusBadge>
          <h3>Quiet metric strip</h3>
          <div className="lab-metric-strip" aria-hidden>
            <div>
              <span>Multiplier</span>
              <b>1.003×</b>
            </div>
            <div>
              <span>Max LTV</span>
              <b>0.40</b>
            </div>
            <div>
              <span>Spend</span>
              <b>≤$1</b>
            </div>
          </div>
          <p className="text-sm opacity-80">
            Aionis-like calm hierarchy for desk overview — no card soup, no glow pills.
          </p>
        </article>

        <article className="lab-card">
          <StatusBadge tone="amber">gate-chip</StatusBadge>
          <h3>Mode chip set</h3>
          <div className="lab-chip-row" aria-hidden>
            <ModeBadge mode="mainnet-read">mainnet-read</ModeBadge>
            <ModeBadge mode="quote-only">quote-only</ModeBadge>
            <ModeBadge mode="paper">paper</ModeBadge>
            <ModeBadge mode="unavailable">unavailable</ModeBadge>
          </div>
          <p className="text-sm opacity-80">
            mainnet-read / quote-only / paper / unavailable — already shipping as ModeBadge;
            this candidate locks spacing + stagger for denser desk chrome.
          </p>
        </article>
      </div>
      <p className="mt-6 text-sm opacity-80">
        Next: pull 21st components via MCP into this route only.{" "}
        <Link to="/desk" className="underline">
          Production desk
        </Link>
      </p>
    </PublicShell>
  );
}
