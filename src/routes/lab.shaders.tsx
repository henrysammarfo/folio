import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { LabApprovePanel } from "@/components/lab-approve-panel";
import { LAB_SHADER_IDS } from "@/lib/lab-pick";
import { probeShadersApi } from "@/lib/lab/shaders-status";

export const Route = createFileRoute("/lab/shaders")({
  head: () => ({
    meta: [
      { title: "Lab · Shaders — FOLIO" },
      {
        name: "description",
        content: "Approve-gated shader studies. SHADERS_API_KEY probed; live frames when API allows.",
      },
    ],
  }),
  loader: async () => probeShadersApi(),
  component: Page,
});

const CANDIDATES = [
  {
    id: "ink-ledger" as const,
    title: "Ink ledger dawn",
    note: "Cool ink wash over glacial blue — FOLIO desk/marketing backdrop. Alpine hero media stays until you approve a merge.",
    swatch: "lab-swatch-ink",
  },
  {
    id: "ledger-mist" as const,
    title: "Ledger mist",
    note: "Soft paper grain → ink depth. Pairs with display type; no purple glow, no card soup.",
    swatch: "lab-swatch-ledger",
  },
  {
    id: "aurora-grid" as const,
    title: "Quiet aurora grid",
    note: "Low-chroma conic field for network/status — secondary surface only, not a hero replacement.",
    swatch: "lab-swatch-aurora",
  },
];

function Page() {
  const status = Route.useLoaderData();

  return (
    <PublicShell
      eyebrow="Approve gate · shaders connected"
      title="Shader studies — SHADERS_API_KEY probed."
      intro="Production home hero media is locked. These are FOLIO-token backdrop candidates with real motion. Live Shaders.com frames wire in when the API accepts the key (Clerk gate may still fail)."
    >
      <p className="mb-4 text-sm opacity-80">
        Shaders:{" "}
        <StatusBadge tone={status.keyPresent ? (status.reachable ? "green" : "amber") : "amber"}>
          {status.keyPresent
            ? status.reachable
              ? "key + API ok"
              : "key set · API gated"
            : "SHADERS_API_KEY missing"}
        </StatusBadge>{" "}
        · {status.detail}
      </p>

      <LabApprovePanel kind="shaders" ids={[...LAB_SHADER_IDS]} />

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
        Key present does not invent live frames — we label Clerk/API failures honestly.{" "}
        <Link to="/" className="underline">
          Back to production hero
        </Link>
      </p>
    </PublicShell>
  );
}
