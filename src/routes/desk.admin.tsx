/**
 * Ops-only product analytics + fill-arm status.
 * Gated by FOLIO_OPS=1 — never expose key theater on consumer Account.
 */
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { DeskShell } from "@/components/desk-shell";
import { FOLIO_EVENTS } from "@/lib/analytics";
import { getSessionBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/desk/admin")({
  head: () => ({
    meta: siteMeta({
      title: "Ops admin — FOLIO",
      description: "Operator analytics schema and fill-arm status.",
      path: "/desk/admin",
    }),
  }),
  loader: async () => {
    const bundle = await getSessionBundle();
    if (!bundle.readiness.opsWallEnabled) {
      throw redirect({ to: "/desk/settings" });
    }
    return bundle;
  },
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  const fillsArmed = data.readiness.broadcastPaused === false;

  return (
    <DeskShell title="Ops admin">
      <section className="fx-page">
        <header className="fx-hero">
          <p className="fx-hero-kicker">Operator only</p>
          <h1 className="fx-title" style={{ margin: 0 }}>
            Analytics + fill arm
          </h1>
          <p className="fx-hero-sub">
            Custom events fire to Vercel Analytics after cookie Accept. No raw
            PII — hashed / coarse props only.
          </p>
        </header>

        <div className="fx-card fx-card-pad" style={{ marginBottom: "1rem" }}>
          <p className="fx-section-title">Fill arm</p>
          <p className="fx-sub">
            {fillsArmed
              ? "BROADCAST_PAUSED=false — user-signed Jupiter /execute is armed."
              : "Fills paused — set BROADCAST_PAUSED=false on preview, then prod."}
          </p>
          <p className="fx-sub">
            Borrow CPI / NestUSD still unavailable-until-funded. FOLIO does not
            sponsor gas.
          </p>
          <Link to="/desk/settings" search={{ wall: "ops" }} className="fx-text-btn">
            Open ops wall
          </Link>
        </div>

        <div className="fx-card fx-card-pad">
          <p className="fx-section-title">Event schema (Phase G)</p>
          <ul className="fx-list" aria-label="Analytics events">
            {FOLIO_EVENTS.map((ev) => (
              <li key={ev} className="fx-asset" style={{ cursor: "default" }}>
                <span className="fx-asset-main">
                  <strong>
                    <code>{ev}</code>
                  </strong>
                  <small>Consent-gated · Vercel Analytics track()</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="fx-sub" style={{ marginTop: "0.75rem" }}>
            Funnel charts live in the Vercel Analytics dashboard — this page is
            the schema + honesty wall, not a second warehouse.
          </p>
        </div>
      </section>
    </DeskShell>
  );
}
