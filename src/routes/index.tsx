import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { FolioMark } from "@/components/folio-brand";
import { FolioLiquidStencil } from "@/components/folio-liquid-stencil";
import { BenefitsSection } from "@/components/landing-benefits";
import { LandingGlassFooter } from "@/components/landing-glass-footer";
import { GlowingFeaturesSection } from "@/components/landing-glow-features";
import { LandingProductTriptych } from "@/components/landing-product-triptych";
import { getTruthBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: siteMeta({
      title: "FOLIO — Buy tokenized stocks on Solana",
      description: "Honest share counts, safe routes, and credit without selling.",
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
              <Link to="/execution">Execution</Link>
              <Link to="/credit">Credit</Link>
              <Link to="/about">About</Link>
            </nav>
            <div className="home-topbar-actions">
              <Link to="/desk" className="home-top-cta">
                Open desk
              </Link>
            </div>
          </header>
        </div>

        <div className="home-horizon" aria-label="Status">
          <div className="home-horizon-left">
            <span className="home-live-asterisk" aria-hidden>
              ✦
            </span>
            <LocalTime />
          </div>
          <p className="home-scroll-hint">
            Scroll to explore <span aria-hidden>↓</span>
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
          <div className="home-cta-row">
            <Link to="/desk" className="home-cta home-cta-ink">
              Open the desk <ArrowRight />
            </Link>
            <Link to="/desk/acquire" className="home-cta-ghost">
              Buy AAPLx
            </Link>
          </div>
        </div>
        <aside className="home-live-chip home-live-chip-light" aria-label="Live signal">
          <span>Live</span>
          <strong>
            {mult?.ok
              ? `${mult.data.currentMultiplier.toFixed(6)}×`
              : "Pending"}
          </strong>
          <small>AAPLx share count</small>
        </aside>
      </section>

      <LandingProductTriptych />

      <BenefitsSection />

      <GlowingFeaturesSection />

      <section className="home-section home-section-soft-light" aria-label="Desk">
        <div className="home-desk-tease">
          <div>
            <p className="home-eyebrow">Product</p>
            <h2>Your desk. Not a badge wall.</h2>
            <p>
              Holdings, charts, quotes, and credit — logos, swap ticket, honest
              labels. Mega, IPO, and meme lanes with pair compares on Buy.
            </p>
            <Link to="/desk" className="home-desk-preview-cta">
              Enter the desk <ArrowRight size={16} />
            </Link>
          </div>
          <div className="home-desk-preview" aria-hidden>
            <div className="home-desk-preview-row">
              <div className="home-desk-preview-card soft">
                <span>Share count</span>
                <b>Live × before trade</b>
              </div>
              <div className="home-desk-preview-card dark">
                <span>Market</span>
                <b>AAPLx · TradingView</b>
              </div>
            </div>
            <div className="home-desk-preview-card">
              <span>Swap</span>
              <b>USDC → AAPLx · live quote</b>
            </div>
          </div>
        </div>
      </section>

      <LandingGlassFooter />
    </div>
  );
}
