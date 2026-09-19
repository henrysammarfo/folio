import { createFileRoute, Link } from "@tanstack/react-router";
import { AssetLogo } from "@/components/asset-logo";
import { DeskShell } from "@/components/desk-shell";
import { siteMeta } from "@/lib/site-meta";
import {
  LANE_META,
  XSTOCK_CATALOG,
  XSTOCK_SWAP_PAIRS,
  catalogByLane,
} from "@/lib/xstock-catalog";

export const Route = createFileRoute("/desk/markets")({
  head: () => ({
    meta: siteMeta({
      title: "Markets — FOLIO",
      description:
        "Mega, IPO, meme xStocks plus stock↔stock pairs, PreStocks, and Tessera.",
      path: "/desk/markets",
    }),
  }),
  component: Page,
});

function Page() {
  return (
    <DeskShell title="Markets">
      <section className="fx-page fx-markets">
        <header className="fx-preipo-hero">
          <p className="fx-hero-kicker">Desk map</p>
          <h1>Every lane, labeled.</h1>
          <p className="fx-sub">
            Public xStocks on Buy · private PreStocks · Tessera T-tokens · true
            stock↔stock pairs. No blurred issuers.
          </p>
        </header>

        <div className="fx-markets-lanes">
          {LANE_META.filter((l) => l.id !== "all").map((lane) => (
            <article key={lane.id} className="fx-card fx-markets-lane">
              <h2>{lane.title}</h2>
              <p>{lane.body}</p>
              {lane.id === "pairs" ? (
                <Link to="/desk/acquire" className="fx-btn fx-btn-sm">
                  Open pairs on Buy
                </Link>
              ) : (
                <ul className="fx-markets-symbols">
                  {catalogByLane(
                    lane.id === "pairs" ? "mega" : lane.id,
                  ).map((s) => (
                    <li key={s.symbol}>
                      <Link to="/desk/acquire">
                        <AssetLogo symbol={s.symbol} size={22} />
                        {s.underlying}
                        {!s.buyable ? <em>watch</em> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <div className="fx-markets-extra">
          <article className="fx-card">
            <h2>Pre-IPO · PreStocks</h2>
            <p>
              Anduril, Anthropic, OpenAI, SpaceX… live from prestocks.com. Kept
              PreStocks-only for Stocklana bounty eligibility.
            </p>
            <Link to="/desk/preipo" className="fx-btn fx-btn-primary fx-btn-sm">
              Open Pre-IPO
            </Link>
          </article>
          <article className="fx-card">
            <h2>Tessera T-tokens</h2>
            <p>
              T-OpenAI, T-Kalshi, T-SpaceX — separate desk so Tessera and
              PreStocks tracks do not collide.
            </p>
            <Link to="/desk/tessera" className="fx-btn fx-btn-primary fx-btn-sm">
              Open Tessera
            </Link>
          </article>
        </div>

        <article className="fx-card fx-markets-pairs">
          <h2>Stock ↔ stock presets</h2>
          <p className="fx-sub">
            Pay one xStock, receive another on Jupiter — not two USDC quotes
            side by side.
          </p>
          <ul>
            {XSTOCK_SWAP_PAIRS.map((p) => (
              <li key={`${p.pay}-${p.receive}`}>
                <Link to="/desk/acquire">
                  <b>{p.label}</b>
                  <span>{p.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="fx-ticket-sub">
            Catalog size: {XSTOCK_CATALOG.length} public xStocks ·{" "}
            {XSTOCK_SWAP_PAIRS.length} pair presets
          </p>
        </article>
      </section>
    </DeskShell>
  );
}
