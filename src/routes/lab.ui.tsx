import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";

export const Route = createFileRoute("/lab/ui")({
  head: () => ({
    meta: [
      { title: "Lab · 21st UI — FOLIO" },
      { name: "description", content: "Approve-gated 21st.dev / desk-card candidates." },
    ],
  }),
  component: Page,
});

const CARDS = [
  {
    id: "desk-density-a",
    title: "Dense ledger row",
    note: "NetroBNB-inspired density without cloning brand — tabular nums, one job per row.",
  },
  {
    id: "desk-density-b",
    title: "Quiet metric strip",
    note: "Aionis-like calm hierarchy for desk overview — no card soup, no glow pills.",
  },
  {
    id: "gate-chip",
    title: "Mode chip set",
    note: "mainnet-read / quote-only / paper / unavailable — already shipping as ModeBadge.",
  },
] as const;

function Page() {
  return (
    <PublicShell
      eyebrow="Approve gate"
      title="21st.dev / desk OS candidates land here first."
      intro="Install or sketch UI candidates on this lab route. Production desk tokens stay frozen until you approve a candidate id in chat."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge tone="blue">Awaiting approval</StatusBadge>
        <StatusBadge tone="neutral">API_KEY_21ST ready</StatusBadge>
      </div>
      <div className="lab-grid">
        {CARDS.map((c) => (
          <article key={c.id} className="lab-card">
            <StatusBadge tone="amber">{c.id}</StatusBadge>
            <h3>{c.title}</h3>
            <div className="lab-desk-preview" aria-hidden>
              <div>
                <span>AAPLx</span>
                <b>1.003269×</b><small> sample</small>
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
            <p className="text-sm opacity-80">{c.note}</p>
          </article>
        ))}
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
