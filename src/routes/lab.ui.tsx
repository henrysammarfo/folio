import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { LabApprovePanel } from "@/components/lab-approve-panel";
import { LAB_UI_IDS } from "@/lib/lab-pick";
import {
  isTwentyFirstConfigured,
  searchTwentyFirstComponents,
} from "@/lib/lab/twentyfirst";

export const Route = createFileRoute("/lab/ui")({
  head: () => ({
    meta: [
      { title: "Lab · UI candidates — FOLIO" },
      {
        name: "description",
        content:
          "Approve-gated UI from NetroBNB density, Aionis brand-plane, and live 21st.dev catalog.",
      },
    ],
  }),
  loader: async () => {
    const configured = isTwentyFirstConfigured();
    const search = configured
      ? await searchTwentyFirstComponents(
          "trade journal table market snapshot desk dashboard",
          6,
        )
      : ({ ok: false as const, reason: "API_KEY_21ST missing" });
    const tradeJournal =
      search.ok
        ? search.hits.find((h) => /trade journal/i.test(h.name)) ??
          search.hits[0] ??
          null
        : null;
    return {
      twentyFirstConfigured: configured,
      twentyFirstNote: search.ok
        ? `21st MCP live · ${search.hits.length} hits`
        : search.reason,
      tradeJournal,
    };
  },
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();

  return (
    <PublicShell
      eyebrow="Approve gate · refs extracted"
      title="UI candidates from NetroBNB + Aionis + 21st.dev."
      intro="Cloned NetroBNB (desk density) and Aionis (brand-as-hero plane). Live 21st.dev MCP search feeds the third candidate. Production stays frozen until you Pick + reply in chat."
    >
      <p className="mb-4 text-sm opacity-80">
        21st:{" "}
        <StatusBadge tone={data.twentyFirstConfigured ? "green" : "amber"}>
          {data.twentyFirstConfigured ? "API_KEY_21ST set" : "key missing"}
        </StatusBadge>{" "}
        · {data.twentyFirstNote}
      </p>

      <LabApprovePanel kind="ui" ids={[...LAB_UI_IDS]} />

      <div className="lab-grid">
        <article className="lab-card">
          <StatusBadge tone="amber">netro-density</StatusBadge>
          <h3>NetroBNB desk density</h3>
          <div className="lab-netro-canvas" aria-hidden>
            <div>
              <span>Profile</span>
              <b>AAPLx</b>
            </div>
            <div>
              <span>Attendance</span>
              <b>1.003× live</b>
            </div>
            <div className="lab-netro-wide">
              <span>Market strip</span>
              <b>Wash fail-closed · Quote-only · ≤$1</b>
            </div>
          </div>
          <p className="text-sm opacity-80">
            Extracted from AbdullahBalfaqih/NetroBNB: Outfit-like calm cards, soft figma
            shadows, 12-col density — FOLIO tokens only, no Binance brand clone.
          </p>
        </article>

        <article className="lab-card">
          <StatusBadge tone="amber">aionis-brand-plane</StatusBadge>
          <h3>Aionis brand plane</h3>
          <div className="lab-aionis-plane" aria-hidden>
            <strong>FOLIO</strong>
          </div>
          <p className="text-sm opacity-80">
            From manovHacksaw/aionis-app/landing: brand is the hero stencil, liquid light motion,
            footer never steals the first viewport. Pattern for FOLIO home — not their copy.
          </p>
        </article>

        <article className="lab-card">
          <StatusBadge tone="amber">trade-journal-21st</StatusBadge>
          <h3>
            {data.tradeJournal?.name ?? "21st Trade Journal"}
          </h3>
          {data.tradeJournal?.previewUrl ? (
            <img
              className="lab-preview-frame"
              src={data.tradeJournal.previewUrl}
              alt={`${data.tradeJournal.name} preview from 21st.dev`}
              loading="lazy"
            />
          ) : (
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
          )}
          <p className="text-sm opacity-80">
            {data.tradeJournal
              ? `Live 21st.dev catalog · id ${data.tradeJournal.id}${
                  data.tradeJournal.author ? ` · @${data.tradeJournal.author}` : ""
                }. Preview only — code fetch is paid quota; merge still needs your approve.`
              : "21st MCP unavailable — fallback desk row until API_KEY_21ST lands."}
          </p>
        </article>
      </div>
      <p className="mt-6 text-sm opacity-80">
        Refs:{" "}
        <a href="https://github.com/AbdullahBalfaqih/NetroBNB" className="underline">
          NetroBNB
        </a>{" "}
        ·{" "}
        <a href="https://github.com/manovHacksaw/aionis-app" className="underline">
          Aionis
        </a>{" "}
        ·{" "}
        <a href="https://21st.dev" className="underline">
          21st.dev MCP
        </a>
        .{" "}
        <Link to="/desk" className="underline">
          Production desk
        </Link>
      </p>
    </PublicShell>
  );
}
