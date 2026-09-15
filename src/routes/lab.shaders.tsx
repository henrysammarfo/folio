import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";

export const Route = createFileRoute("/lab/shaders")({
  head: () => ({
    meta: [
      { title: "Lab · Shaders — FOLIO" },
      {
        name: "description",
        content: "Approve-gated Shaders.com candidates. Not production chrome.",
      },
    ],
  }),
  component: Page,
});

const CANDIDATES = [
  {
    id: "ink-ledger",
    title: "Ink ledger dawn",
    note: "Cool ink wash — alpine hero stays; this is a desk/marketing backdrop option only.",
    swatch: "lab-swatch-ink",
  },
  {
    id: "ledger-mist",
    title: "Ledger mist",
    note: "Soft paper grain over glacial blue — pairs with FOLIO display type, no purple glow.",
    swatch: "lab-swatch-ledger",
  },
  {
    id: "aurora-grid",
    title: "Quiet aurora grid",
    note: "Low-chroma conic field for network/status surfaces — not a hero replacement.",
    swatch: "lab-swatch-aurora",
  },
] as const;

function Page() {
  return (
    <PublicShell
      eyebrow="Approve gate"
      title="Shaders candidates stay here until you say yes."
      intro="Production home hero media is locked. These are backdrop candidates for later marketing/desk chrome only. Reply with a candidate id to approve a merge."
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge tone="blue">Awaiting approval</StatusBadge>
        <StatusBadge tone="neutral">Hero media untouched</StatusBadge>
        <StatusBadge tone="neutral">Reply: ink-ledger · ledger-mist · aurora-grid</StatusBadge>
      </div>
      <div className="lab-grid">
        {CANDIDATES.map((c) => (
          <article key={c.id} className="lab-card">
            <StatusBadge tone="amber">{c.id}</StatusBadge>
            <h3>{c.title}</h3>
            <div className={`lab-swatch ${c.swatch}`} aria-hidden />
            <p className="text-sm opacity-80">{c.note}</p>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm opacity-80">
        Wire SHADERS_API_KEY / MCP for live shader frames next. Until then these static FOLIO-token
        studies hold the gate.{" "}
        <Link to="/" className="underline">
          Back to production hero
        </Link>
      </p>
    </PublicShell>
  );
}
