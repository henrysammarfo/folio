import { createFileRoute, Link } from "@tanstack/react-router";
import { FolioMark } from "@/components/folio-brand";
import { NexeusCinematicLanding } from "@/components/nexeus-cinematic";
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
          <Link to="/preipo">Pre-IPO</Link>
          <Link to="/about">About</Link>
        </nav>
        <Link to="/desk" className="nx-top-cta">
          Open desk
        </Link>
      </header>

      <NexeusCinematicLanding
        eyebrow="Ready when you are"
        title="Buy US stocks with honest share counts"
        lede="From live share-count truth to wash-safe routes and credit without selling — everything you need to size on Solana starts here."
        ctaLabel="Open desk"
        ctaTo="/desk"
      />
    </div>
  );
}
