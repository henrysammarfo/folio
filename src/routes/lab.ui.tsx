import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { LabApprovePanel } from "@/components/lab-approve-panel";
import { FolioLiquidStencil } from "@/components/folio-liquid-stencil";
import { NetroDensityCanvas } from "@/components/lab/netro-density-canvas";
import { FolioTradeJournalLab } from "@/components/lab/folio-trade-journal-lab";
import { ShaderBackground } from "@/components/lab/shader-background";
import { LAB_UI_IDS } from "@/lib/lab-pick";
import {
  isTwentyFirstConfigured,
  searchTwentyFirstComponents,
  type TwentyFirstHit,
} from "@/lib/lab/twentyfirst";
import { getTruthBundle } from "@/lib/desk.functions";

/** Prefer finance / desk / plasma — never surface random consumer-app heroes (e.g. recovery apps). */
function isFinanceRelevant(h: TwentyFirstHit): boolean {
  const blob = `${h.name} ${h.description ?? ""}`.toLowerCase();
  if (
    /sober|recovery|dating|fitness|recipe|travel|saas landing|accountability/i.test(
      blob,
    )
  ) {
    return false;
  }
  return /trade|journal|market|desk|dashboard|chart|finance|trading|shader|plasma|grain|stock|ledger/i.test(
    blob,
  );
}

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
    const [truth, deskSearch, shaderSearch] = await Promise.all([
      getTruthBundle({ data: { symbol: "AAPLx" } }),
      configured
        ? searchTwentyFirstComponents(
            "trade journal table market snapshot desk dashboard",
            8,
          )
        : Promise.resolve({ ok: false as const, reason: "API_KEY_21ST missing" }),
      configured
        ? searchTwentyFirstComponents(
            "shader background grain noise liquid plasma WebGL",
            6,
          )
        : Promise.resolve({ ok: false as const, reason: "API_KEY_21ST missing" }),
    ]);

    const hits: TwentyFirstHit[] = [];
    if (deskSearch.ok) {
      hits.push(...deskSearch.hits.filter(isFinanceRelevant));
    }
    if (shaderSearch.ok) {
      for (const h of shaderSearch.hits.filter(isFinanceRelevant)) {
        if (!hits.some((x) => String(x.id) === String(h.id))) hits.push(h);
      }
    }

    const tradeJournal =
      (deskSearch.ok
        ? deskSearch.hits.find((h) => /trade journal/i.test(h.name))
        : null) ??
      hits.find((h) => /trade journal/i.test(h.name)) ??
      null;

    const note = configured
      ? deskSearch.ok || shaderSearch.ok
        ? `21st MCP live · Plasma WebGL id 24346 adapted in-lab · ${hits.length} finance-filtered catalog hits`
        : `21st MCP error · ${"reason" in deskSearch ? deskSearch.reason : "unknown"}`
      : "API_KEY_21ST missing — set on Vercel preview + local .env for live catalog";

    const mult = truth?.multiplier;
    const multiplierLabel = mult?.ok
      ? `${mult.data.currentMultiplier.toFixed(6)}× live`
      : "live pending";

    return {
      twentyFirstConfigured: configured,
      twentyFirstNote: note,
      tradeJournal,
      gallery: hits.slice(0, 6),
      multiplierLabel,
    };
  },
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();

  return (
    <PublicShell
      compactIntro
      eyebrow="Approve gate · live extracts"
      title="Look at the stages. Then pick."
      intro="Cloned Aionis + NetroBNB, screened side-by-side, wired to 21st MCP. Visuals first — production stays frozen until your chat reply."
    >
      <div className="lab-status-row">
        <StatusBadge tone={data.twentyFirstConfigured ? "green" : "amber"}>
          {data.twentyFirstConfigured ? "21st MCP connected" : "API_KEY_21ST missing"}
        </StatusBadge>
        <span>{data.twentyFirstNote}</span>
      </div>

      {/* Visual stages FIRST — not buried under approve copy */}
      <div className="lab-stage-stack">
        <section className="lab-stage" id="stage-aionis">
          <header className="lab-stage-head">
            <StatusBadge tone="amber">aionis-brand-plane</StatusBadge>
            <h3>Aionis brand plane → production `/`</h3>
            <p>
              Live extract: luminous stencil owns the lower half (Aionis
              1400×550 / y=465 parity). No headline in the void. Horizon at
              bottom:55% (time + scroll only).
            </p>
          </header>
          <div className="lab-aionis-stage lab-aionis-stage-viewport">
            <FolioLiquidStencil />
            <div className="lab-aionis-horizon">
              <span>Live extract</span>
              <span>SCROLL ↓</span>
            </div>
          </div>
        </section>

        <section className="lab-stage" id="stage-netro">
          <header className="lab-stage-head">
            <StatusBadge tone="amber">netro-density</StatusBadge>
            <h3>NetroBNB 12-col desk density</h3>
            <p>
              Extracted from AbdullahBalfaqih/NetroBNB: grey canvas, yellow
              analysis clock, dark market strip, yellow AI rail — FOLIO truth
              tokens only.
            </p>
          </header>
          <NetroDensityCanvas multiplierLabel={data.multiplierLabel} />
        </section>

        <section className="lab-stage" id="stage-21st-hero">
          <header className="lab-stage-head">
            <StatusBadge tone={data.twentyFirstConfigured ? "green" : "amber"}>
              cinematic-landing-21st
            </StatusBadge>
            <h3>21st Plasma WebGL · id 24346 (FOLIO ink)</h3>
            <p>
              Pinned 21st.dev Shader Builder Plasma — live canvas retinted to
              ledger ice. Not a random catalog marketing preview. Production
              hero stays on the Aionis brand-plane extract until you Pick.
            </p>
          </header>
          <div className="lab-plasma-stage" aria-hidden>
            <ShaderBackground variant="ink-ledger" className="lab-plasma-canvas" />
            <div className="lab-plasma-caption">
              <span>21st MCP · Plasma 24346</span>
              <span>WebGL live · approve-gated</span>
            </div>
          </div>
        </section>

        <section className="lab-stage" id="stage-journal">
          <header className="lab-stage-head">
            <StatusBadge tone="amber">trade-journal-21st</StatusBadge>
            <h3>
              {data.tradeJournal?.name ?? "Trade journal"} · FOLIO honesty blotter
            </h3>
            <p>
              {data.tradeJournal
                ? `Adapted from 21st.dev MCP id ${data.tradeJournal.id}${
                    data.tradeJournal.author ? ` · @${data.tradeJournal.author}` : ""
                  } — paper honesty rows only.`
                : "21st MCP unavailable — blotter still shows local honesty rows."}
            </p>
          </header>
          <FolioTradeJournalLab />
          {data.gallery.length > 0 ? (
            <div className="lab-21st-gallery lab-21st-gallery-wide">
              {data.gallery
                .filter((g) => g.previewUrl)
                .slice(0, 6)
                .map((g) => (
                  <figure key={String(g.id)}>
                    <img src={g.previewUrl!} alt="" loading="lazy" />
                    <figcaption>
                      {g.name}
                      {g.author ? ` · @${g.author}` : ""}
                    </figcaption>
                  </figure>
                ))}
            </div>
          ) : null}
        </section>
      </div>

      <LabApprovePanel kind="ui" ids={[...LAB_UI_IDS]} />

      <p className="mt-6 text-sm opacity-80">
        Refs screened live:{" "}
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
