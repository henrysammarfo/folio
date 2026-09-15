import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";

export const Route = createFileRoute("/lab/ui")({
  head: () => ({
    meta: [
      { title: "Lab · 21st UI — FOLIO" },
      { name: "description", content: "Approve-gated 21st.dev component candidates." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      eyebrow="Approve gate"
      title="21st.dev installs land here first."
      intro="Desk chrome will learn from NetroBNB card density and Aionis motion — but 21st candidates must be reviewed on this lab route before they touch production tokens."
    >
      <StatusBadge tone="blue">Awaiting approval</StatusBadge>
      <p className="mt-4 text-sm opacity-80">
        Use API_KEY_21ST / MCP to install candidates into this lab surface, then approve.
      </p>
    </PublicShell>
  );
}
