import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { FolioMark } from "@/components/folio-brand";
import { FolioLiquidStencil } from "@/components/folio-liquid-stencil";
import { LandingGlassFooter } from "@/components/landing-glass-footer";
import { getTruthBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: siteMeta({
      title: "FOLIO — Buy tokenized stocks on Solana",
      description:
        "Honest share counts, safe routes, and credit without selling.",
      path: "/",
    }),
  }),
  loader: async () => getTruthBundle({ data: { symbol: "AAPLx" } }),
  component: Home,
});

function LocalTime() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city = zone.split("/").pop()?.replace(/_/g, " ") ?? zone;
    const tick = () => {
      const t = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date());
      setLabel(`${t} ${city}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span>{label || "—"}</span>;
}

function Home() {
  const truth = Route.useLoaderData();
  const mult = truth?.multiplier;
  const liveLine = mult?.ok
    ? `AAPLx is ${mult.data.currentMultiplier.toFixed(6)}× right now — live from the corporate-action feed.`
    : "Live share-count truth on Solana before you trade.";

  return (
    <div className="cinematic-home">
      <div className="home-noise" aria-hidden />

      <section className="home-viewport" aria-label="FOLIO hero">
        <FolioLiquidStencil />

        <div className="home-safe">
          <header className="home-topbar">
            <div className="home-brand-hero">
              <span className="home-brand-badge" aria-hidden>
                <FolioMark className="size-5" />
              </span>
              <span>FOLIO</span>
            </div>
            <nav className="home-top-nav" aria-label="Marketing">
              <Link to="/truth">Truth</Link>
              <Link to="/markets">Markets</Link>
              <Link to="/preipo">Pre-IPO</Link>
              <Link to="/credit">Credit</Link>
              <Link to="/about">About</Link>
            </nav>
            <div className="home-topbar-actions">
              <Link to="/desk" className="home-top-cta">
                Open desk
              </Link>
            </div>
          </header>

          <div className="home-hero-copy">
            <p className="home-hero-brand">FOLIO</p>
            <h1>Buy US stocks on Solana — with honest share counts.</h1>
            <p>
              Live multipliers, wash refuse, and Jupiter quotes before you size.
              Fills stay paused until funded.
            </p>
            <div className="home-cta-row">
              <Link to="/desk" className="home-cta">
                Open the desk <ArrowRight />
              </Link>
              <Link to="/desk/acquire" className="home-cta-ghost-on-dark">
                Buy AAPLx
              </Link>
            </div>
          </div>
        </div>

        <div className="home-horizon" aria-label="Status">
          <div className="home-horizon-left">
            <span className="home-live-asterisk" aria-hidden>
              ✦
            </span>
            <LocalTime />
          </div>
          <p className="home-scroll-hint">
            Scroll <span aria-hidden>↓</span>
          </p>
        </div>
      </section>

      <section className="home-below home-below-light" aria-label="What FOLIO does">
        <div className="home-below-copy">
          <p className="home-eyebrow">Stock desk on Solana</p>
          <h2>Own the economic truth.</h2>
          <p>
            {liveLine} FOLIO shows real share counts, refuses dirty tape, and
            quotes a live Solana route before you buy.
          </p>
        </div>
        <aside className="home-live-signal" aria-label="Live signal">
          <span>Live · AAPLx</span>
          <strong>
            {mult?.ok
              ? `${mult.data.currentMultiplier.toFixed(6)}×`
              : "Pending"}
          </strong>
          <small>Share-count multiplier</small>
        </aside>
      </section>

      <section className="home-strip" aria-label="How FOLIO works">
        <header>
          <p className="home-eyebrow">How it works</p>
          <h2>Three moves. One desk.</h2>
        </header>
        <ol className="home-strip-list">
          <li>
            <b>Honest share counts</b>
            <span>
              Live multipliers checked against Solana Scaled UI — raw balances
              never silently lie after splits.
            </span>
            <Link to="/truth">Open truth →</Link>
          </li>
          <li>
            <b>Safe buy path</b>
            <span>
              Dirty tape stops the route. Jupiter quotes stay labeled.
              Quote-only until broadcast unlocks.
            </span>
            <Link to="/desk/acquire">Open buy →</Link>
          </li>
          <li>
            <b>Credit without selling</b>
            <span>
              Keep the shares. See borrow capacity from live Kamino reads —
              broadcast paused on purpose.
            </span>
            <Link to="/desk/credit">Open borrow →</Link>
          </li>
        </ol>
      </section>

      <section className="home-section home-section-soft-light" aria-label="Desk">
        <div className="home-desk-tease">
          <div>
            <p className="home-eyebrow">Product</p>
            <h2>Your desk. Not a badge wall.</h2>
            <p>
              Holdings, charts, quotes, and credit — logos, swap ticket, honest
              labels. Mega, IPO, and meme lanes with pair compares on Buy.
              PreStocks and Tessera stay on separate desks.
            </p>
            <Link to="/desk" className="home-desk-preview-cta">
              Enter the desk <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <LandingGlassFooter />
    </div>
  );
}
