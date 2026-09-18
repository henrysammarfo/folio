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
        content: "Buy tokenized stocks on Solana with honest share counts.",
      },
      { property: "og:title", content: "FOLIO — Own the economic truth" },
      {
        property: "og:description",
        content: "Buy tokenized stocks on Solana with honest share counts.",
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
              <FolioMark className="size-8" />
              <span>FOLIO</span>
            </div>
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
      </section>

      <section className="home-section home-section-ink" aria-label="How it works">
        <h2>Three steps. Then you own it.</h2>
        <p>
          Built so a first-time user can grasp the flow without a glossary —
          truth, safe route, then buy.
        </p>
        <div className="home-pillars">
          <article className="home-pillar">
            <strong>1 · See the truth</strong>
            <p>Live multiplier + on-chain Scaled UI for the stock you want.</p>
          </article>
          <article className="home-pillar">
            <strong>2 · Safe route</strong>
            <p>Wash checks fail closed. Jupiter quotes stay live and labeled.</p>
          </article>
          <article className="home-pillar">
            <strong>3 · Buy or borrow</strong>
            <p>Acquire with a clear ticket. Credit without selling your shares.</p>
          </article>
        </div>
      </section>

      <section className="home-section home-section-signal" aria-label="Desk">
        <div className="home-desk-tease">
          <div>
            <h2>Your stock desk on Solana.</h2>
            <p>
              Positions, live charts, quotes, and credit in one place — sized for
              phones and wide screens. Open the desk and follow the Buy flow.
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
                <b>AAPLx · safe route</b>
              </div>
            </div>
            <div className="home-desk-preview-card">
              <span>Buy ticket</span>
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
            <Link to="/desk/credit">Credit</Link>
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
            <Link to="/desk/settings">Settings</Link>
          </div>
        </nav>
        <div className="home-bottom">
          <p>© 2026 FOLIO</p>
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
