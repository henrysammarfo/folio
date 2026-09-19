import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Github, Linkedin } from "lucide-react";
import { FolioMark } from "@/components/folio-brand";
import { FolioLiquidStencil } from "@/components/folio-liquid-stencil";
import { LandingSlideThrough } from "@/components/landing-slide";
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

      <section className="home-below" aria-label="What FOLIO does">
        <div className="home-below-copy">
          <p className="home-eyebrow">Stock desk on Solana</p>
          <h2>Own the economic truth.</h2>
          <p>
            {liveLine} FOLIO shows real share counts, refuses dirty tape, and
            quotes a live Solana route before you buy.
          </p>
          <div className="home-cta-row">
            <Link to="/desk" className="home-cta">
              Open the desk <ArrowRight />
            </Link>
            <Link to="/desk/acquire" className="home-cta-secondary">
              Buy AAPLx
            </Link>
          </div>
        </div>
        <aside className="home-live-chip" aria-label="Live signal">
          <span>Live</span>
          <strong>
            {mult?.ok
              ? `${mult.data.currentMultiplier.toFixed(6)}×`
              : "Pending"}
          </strong>
          <small>AAPLx share count</small>
        </aside>
      </section>

      <LandingSlideThrough />

      <section className="home-section home-section-signal" aria-label="Desk">
        <div className="home-desk-tease">
          <div>
            <p className="home-eyebrow dark">Product</p>
            <h2>Your desk. Not a dashboard of badges.</h2>
            <p>
              Holdings, live charts, quotes, and credit — sized for phones and
              wide screens. Logos, swap ticket, honest labels.
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

      <footer className="home-footer">
        <div className="home-brand">
          <div className="brand-lockup text-primary-foreground">
            <FolioMark className="size-7" />
            <span>FOLIO</span>
          </div>
          <p>Truth before trade. Credit without compromise.</p>
        </div>
        <nav className="home-nav">
          <div>
            <strong>PRODUCT</strong>
            <Link to="/desk">Desk</Link>
            <Link to="/desk/acquire">Buy</Link>
            <Link to="/desk/credit">Borrow</Link>
          </div>
          <div>
            <strong>LEARN</strong>
            <Link to="/truth">Share counts</Link>
            <Link to="/network">Network</Link>
            <Link to="/about">About</Link>
          </div>
          <div>
            <strong>CONNECT</strong>
            <a href="https://github.com/henrysammarfo">GitHub</a>
            <a href="https://x.com/henrysammarfo">@henrysammarfo</a>
            <Link to="/privacy">Privacy</Link>
          </div>
        </nav>
        <div className="home-bottom">
          <p>
            © 2026 FOLIO ·{" "}
            <Link to="/privacy">Privacy</Link> ·{" "}
            <Link to="/terms">Terms</Link>
          </p>
          <div>
            <a
              href="https://www.linkedin.com/in/henrysammarfo"
              aria-label="LinkedIn"
              rel="noreferrer"
              target="_blank"
            >
              <Linkedin />
            </a>
            <a
              href="https://github.com/henrysammarfo"
              aria-label="GitHub"
              rel="noreferrer"
              target="_blank"
            >
              <Github />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
