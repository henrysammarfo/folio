import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Github, Linkedin } from "lucide-react";
import { FolioMark } from "@/components/folio-brand";
import { FolioLiquidStencil } from "@/components/folio-liquid-stencil";
import { getTruthBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FOLIO — Own the economic truth" },
      {
        name: "description",
        content: "A corporate-action prime desk for Solana xStocks.",
      },
      { property: "og:title", content: "FOLIO — Own the economic truth" },
      {
        property: "og:description",
        content: "A corporate-action prime desk for Solana xStocks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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
    ? `AAPLx live ${mult.data.currentMultiplier.toFixed(6)}× — not fixture theater.`
    : "Live share-count truth on Solana — never fixture 4×.";

  return (
    <div className="cinematic-home">
      <div className="home-noise" aria-hidden />

      <section className="home-viewport" aria-label="FOLIO hero">
        <FolioLiquidStencil />

        <header className="home-topbar">
          <div className="home-brand-hero">
            <FolioMark className="size-8" />
            <span>FOLIO</span>
          </div>
          <div className="home-topbar-actions">
            <Link to="/lab/ui" className="home-top-link">
              Lab UI
            </Link>
            <Link to="/lab/shaders" className="home-top-link">
              Shaders
            </Link>
            <Link to="/desk" className="home-top-cta">
              Open desk
            </Link>
          </div>
        </header>

        <div className="home-midband">
          <div className="home-midband-left">
            <span className="home-live-dot" aria-hidden />
            <LocalTime />
          </div>
          <p className="home-scroll-hint">Scroll to explore ↓</p>
        </div>

        <main className="home-hero">
          <p className="home-hero-tagline">Own the economic truth.</p>
          <p className="home-copy">
            Honest stock desk on Solana. {liveLine} Broadcast stays off until funded.
          </p>
          <div className="home-cta-row">
            <Link to="/desk" className="home-cta">
              Open the desk <ArrowRight />
            </Link>
            <Link to="/truth" className="home-cta-secondary">
              See live truth
            </Link>
          </div>
        </main>
      </section>

      <footer className="home-footer">
        <div className="home-brand">
          <div className="brand-lockup text-primary-foreground">
            <FolioMark className="size-7" />
            <span>FOLIO</span>
          </div>
          <p>Truth before trade. Credit without compromise.</p>
          <p className="home-footer-lab">
            Premium chrome: pick on{" "}
            <Link to="/lab/ui">/lab/ui</Link> · <Link to="/lab/shaders">/lab/shaders</Link> then
            reply in chat.
          </p>
        </div>
        <nav className="home-nav">
          <div>
            <strong>PRODUCT</strong>
            <Link to="/truth">Share truth</Link>
            <Link to="/execution">Guarded execution</Link>
            <Link to="/credit">Credit desk</Link>
          </div>
          <div>
            <strong>SYSTEM</strong>
            <Link to="/network">Network status</Link>
            <Link to="/lab/ui">Lab UI (approve)</Link>
            <Link to="/lab/shaders">Lab shaders (approve)</Link>
          </div>
          <div>
            <strong>COMPANY</strong>
            <Link to="/about">About FOLIO</Link>
            <a href="https://github.com/henrysammarfo">GitHub</a>
            <a href="https://x.com/henrysammarfo">@henrysammarfo</a>
          </div>
        </nav>
        <div className="home-bottom">
          <p>© 2026 FOLIO. Mainnet read · broadcast disabled.</p>
          <div>
            <a href="https://www.linkedin.com" aria-label="LinkedIn">
              <Linkedin />
            </a>
            <a href="https://github.com/henrysammarfo" aria-label="GitHub">
              <Github />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
