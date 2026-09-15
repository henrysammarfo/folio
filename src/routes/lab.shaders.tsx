import { createFileRoute } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";

export const Route = createFileRoute("/lab/shaders")({
  head: () => ({
    meta: [
      { title: "Lab · Shaders — FOLIO" },
      { name: "description", content: "Approve-gated Shaders.com candidates. Not production chrome." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      eyebrow="Approve gate"
      title="Shaders candidates stay here until you say yes."
      intro="Production home hero is locked. Drop Shaders.com experiments on this route only. After you approve a candidate, we merge it into marketing chrome — never before."
    >
      <StatusBadge tone="blue">Awaiting approval</StatusBadge>
      <p className="mt-4 text-sm opacity-80">
        Wire SHADERS_API_KEY / MCP, generate 2–3 backgrounds, preview here, then approve in chat.
      </p>
    </PublicShell>
  );
}
