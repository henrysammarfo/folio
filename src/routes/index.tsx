import { createFileRoute, Link } from "@tanstack/react-router";
import { FolioMark } from "@/components/folio-brand";
import { NexeusCinematicLanding } from "@/components/nexeus-cinematic";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: siteMeta({
      title: "FOLIO — Buy US stocks on Solana",
      description:
        "Honest share counts, safe routes, and credit without selling. Open the desk.",
      path: "/",
    }),
  }),
  component: Home,
});

function Home() {
  return (
    <div className="nx-home">
      <header className="nx-topbar">
        <Link to="/" className="home-brand-hero" aria-label="FOLIO home">
          <span className="home-brand-badge" aria-hidden>
            <FolioMark className="size-5" />
          </span>
          <span>FOLIO</span>
        </Link>
        <nav className="nx-top-nav" aria-label="Marketing">
          <Link to="/markets">Markets</Link>
          <Link to="/truth">Truth</Link>
          <Link to="/credit">Credit</Link>
          <Link to="/preipo">PreStocks</Link>
          <Link to="/about">About</Link>
        </nav>
        <Link to="/desk" className="nx-top-cta">
          Open desk
        </Link>
      </header>

      <NexeusCinematicLanding
        eyebrow="The honest stock desk"
        title="Buy US stocks. Keep the share count true."
        lede="FOLIO shows the real economic shares after dividends and splits, refuses dirty routes, and lets you borrow cash without selling — all on Solana."
        ctaLabel="Open desk"
        ctaTo="/desk"
      />
    </div>
  );
}
