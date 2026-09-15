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
  /** Prefetch live AAPLx multiplier so first viewport copy is not fixture theater. */
  loader: async () => getTruthBundle({ data: { symbol: "AAPLx" } }),
  component: Home,
});

function Home() {
  const truth = Route.useLoaderData();
  const mult = truth?.multiplier;
  const liveLine = mult?.ok
    ? `AAPLx live ${mult.data.currentMultiplier.toFixed(6)}× on Solana — not fixture 4×. Broadcast stays off.`
    : "Live share-count truth on Solana — never fixture 4×. Broadcast stays off until funded.";

  return (
    <div className="cinematic-home">
      <div className="home-media">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp"
          aria-label="Painted alpine panorama: a lone hiker with a pink backpack faces a snow-capped peak above a sea of clouds"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_123836_11a3c5e0-713f-4bef-a8e9-7dd93bdea3b0.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      <div className="home-scrim" />
      <main className="home-hero">
        <div className="home-brand-hero">
          <FolioMark className="size-10" />
          <span>FOLIO</span>
        </div>
        <p className="home-eyebrow">Corporate-action prime desk</p>
        <h1>Own the economic truth.</h1>
        <div className="home-copy">
          FOLIO keeps Solana stock share counts honest and refuses shady pools.{" "}
          {liveLine} Lab chrome waits on Henry’s approve.
        </div>
        <div className="home-cta-row">
          <Link to="/desk" className="home-cta">
            Open the desk <ArrowRight />
          </Link>
          <Link to="/lab/ui" className="home-cta-secondary">
            Approve desk UI
          </Link>
          <Link to="/lab/shaders" className="home-cta-secondary">
            Approve shaders
          </Link>
        </div>
        <p className="home-approve-hint">
          Open lab → pick one id → reply in chat. This hero does not change
          without your approve.
        </p>
      </main>
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
