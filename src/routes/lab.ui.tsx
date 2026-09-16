import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";
import { LabApprovePanel } from "@/components/lab-approve-panel";
import { FolioLiquidStencil } from "@/components/folio-liquid-stencil";
import { NetroDensityCanvas } from "@/components/lab/netro-density-canvas";
import { FolioTradeJournalLab } from "@/components/lab/folio-trade-journal-lab";
import { LAB_UI_IDS } from "@/lib/lab-pick";
import {
  isTwentyFirstConfigured,
  searchTwentyFirstComponents,
  type TwentyFirstHit,
} from "@/lib/lab/twentyfirst";
import { getTruthBundle } from "@/lib/desk.functions";

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
    const [truth, deskSearch, heroSearch] = await Promise.all([
      getTruthBundle({ data: { symbol: "AAPLx" } }),
      configured
        ? searchTwentyFirstComponents(
            "trade journal table market snapshot desk dashboard",
            6,
          )
        : Promise.resolve({ ok: false as const, reason: "API_KEY_21ST missing" }),
      configured
        ? searchTwentyFirstComponents(
            "cinematic landing hero financial dashboard",
            6,
          )
        : Promise.resolve({ ok: false as const, reason: "API_KEY_21ST missing" }),
    ]);

    const hits: TwentyFirstHit[] = [];
    if (deskSearch.ok) hits.push(...deskSearch.hits);
    if (heroSearch.ok) {
      for (const h of heroSearch.hits) {
        if (!hits.some((x) => String(x.id) === String(h.id))) hits.push(h);
      }
    }

    const cinematicHero =
      (heroSearch.ok
        ? heroSearch.hits.find((h) => /cinematic landing/i.test(h.name))
        : null) ??
      (heroSearch.ok ? heroSearch.hits[0] : null) ??
      null;

    const tradeJournal =
      (deskSearch.ok
        ? deskSearch.hits.find((h) => /trade journal/i.test(h.name))
        : null) ??
      hits.find((h) => /trade journal|financial hero|dashboard/i.test(h.name)) ??
      hits[0] ??
      null;

    const note = configured
      ? deskSearch.ok || heroSearch.ok
        ? `21st MCP live · ${hits.length} catalog hits (search free; code fetch paid)`
        : `21st MCP error · ${"reason" in deskSearch ? deskSearch.reason : "unknown"}`
      : "API_KEY_21ST missing — set on Vercel preview + local .env for live catalog";

    const mult = truth?.multiplier;
    const multiplierLabel = mult?.ok
      ? `${mult.data.currentMultiplier.toFixed(6)}× live`
      : "live pending";

    return {
      twentyFirstConfigured: configured,
      twentyFirstNote: note,
      cinematicHero,
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
      eyebrow="Approve gate · refs extracted + 21st MCP"
      title="UI candidates from NetroBNB + Aionis + 21st.dev."
      intro="Real extracted chrome — not postcard fakes. Pick one desk chrome ID, then reply in Cursor chat. Production stays frozen until you approve."
    >
      <p className="mb-4 text-sm opacity-80">
        21st:{" "}
        <StatusBadge tone={data.twentyFirstConfigured ? "green" : "amber"}>
          {data.twentyFirstConfigured ? "API_KEY_21ST · MCP connected" : "key missing"}
        </StatusBadge>{" "}
        · {data.twentyFirstNote}
      </p>

      <LabApprovePanel kind="ui" ids={[...LAB_UI_IDS]} />

      <div className="lab-grid lab-grid-tall">
        <article className="lab-card lab-card-span">
          <StatusBadge tone="amber">aionis-brand-plane</StatusBadge>
          <h3>Aionis brand plane → production `/`</h3>
          <div className="lab-aionis-stage lab-aionis-stage-tall">
            <FolioLiquidStencil />
          </div>
          <p className="text-sm opacity-80">
            Extracted from manovHacksaw/aionis-app/landing: brand stencil owns the lower
            half (xMidYMax + y≈465), horizon chrome at bottom:55% (time + scroll only),
            supporting copy below the fold. Production home now mirrors that — not a
            midband stacked on the letters.
          </p>
        </article>

        <article className="lab-card lab-card-span">
          <StatusBadge tone="amber">netro-density</StatusBadge>
          <h3>NetroBNB desk density</h3>
          <NetroDensityCanvas multiplierLabel={data.multiplierLabel} />
          <p className="text-sm opacity-80">
            Extracted from AbdullahBalfaqih/NetroBNB: grey #E5E7EB canvas, 12-col bento,
            soft figma shadows, yellow analysis rail + live clock — FOLIO truth tokens
            only (no Netro/Binance brand).
          </p>
        </article>

        <article className="lab-card lab-card-span">
          <StatusBadge tone={data.twentyFirstConfigured ? "green" : "amber"}>
            cinematic-landing-21st
          </StatusBadge>
          <h3>{data.cinematicHero?.name ?? "21st cinematic landing"}</h3>
          {data.cinematicHero?.previewUrl ? (
            <img
              className="lab-preview-frame lab-preview-frame-lg"
              src={data.cinematicHero.previewUrl}
              alt={`${data.cinematicHero.name} preview from 21st.dev`}
              loading="lazy"
            />
          ) : (
            <div className="lab-desk-preview" aria-hidden>
              <div>
                <span>21st MCP</span>
                <b>catalog offline</b>
              </div>
            </div>
          )}
          <p className="text-sm opacity-80">
            {data.cinematicHero
              ? `Live 21st.dev MCP · id ${data.cinematicHero.id}${
                  data.cinematicHero.author ? ` · @${data.cinematicHero.author}` : ""
                }. Reference only — FOLIO production uses the Aionis brand-plane extract, not a SaaS card hero clone.`
              : "21st MCP unavailable — set API_KEY_21ST on Vercel for live previews."}
          </p>
        </article>

        <article className="lab-card lab-card-span">
          <StatusBadge tone="amber">trade-journal-21st</StatusBadge>
          <h3>
            {data.tradeJournal?.name ?? "Trade journal"} · FOLIO honesty blotter
          </h3>
          <FolioTradeJournalLab />
          {data.tradeJournal?.previewUrl ? (
            <img
              className="lab-preview-frame lab-preview-frame-lg"
              src={data.tradeJournal.previewUrl}
              alt={`${data.tradeJournal.name} upstream preview from 21st.dev`}
              loading="lazy"
            />
          ) : null}
          {data.gallery.length > 1 ? (
            <div className="lab-21st-gallery">
              {data.gallery
                .filter((g) => g.previewUrl)
                .slice(0, 4)
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
          <p className="text-sm opacity-80">
            {data.tradeJournal
              ? `Adapted from 21st.dev MCP get_component id ${data.tradeJournal.id}${
                  data.tradeJournal.author ? ` · @${data.tradeJournal.author}` : ""
                } — FOLIO rows are paper honesty (Open / Blocked / Quoted), never invent fills. Merge still needs your approve.`
              : "21st MCP unavailable — blotter still shows local honesty rows."}
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
