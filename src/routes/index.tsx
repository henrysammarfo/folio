import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Github, Linkedin } from "lucide-react";
import { FolioMark } from "@/components/folio-brand";
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
      {
        property: "og:image",
        content:
          "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp",
      },
    ],
  }),
  loader: async () => getTruthBundle({ data: { symbol: "AAPLx" } }),
  component: Home,
});

function Home() {
  const truth = Route.useLoaderData();
  const mult = truth?.multiplier;
  const liveLine = mult?.ok
    ? `AAPLx live ${mult.data.currentMultiplier.toFixed(6)}× — not fixture theater.`
    : "Live share-count truth on Solana — never fixture 4×.";

  return (
    <div className="cinematic-home">
      {/* First viewport: brand + headline + one sentence + CTA · full-bleed media */}
      <section className="home-viewport" aria-label="FOLIO hero">
        <div className="home-media" aria-hidden>
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_123836_11a3c5e0-713f-4bef-a8e9-7dd93bdea3b0.mp4"
              type="video/mp4"
            />
          </video>
        </div>
        <div className="home-scrim" aria-hidden />

        <header className="home-topbar">
          <div className="home-brand-hero">
            <FolioMark className="size-9" />
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

        <main className="home-hero">
          <h1>FOLIO</h1>
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

        <p className="home-scroll-hint" aria-hidden>
          Scroll
        </p>
      </section>

      {/* Below fold — never steals first viewport */}
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
