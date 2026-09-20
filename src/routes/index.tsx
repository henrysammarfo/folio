import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { FolioMark } from "@/components/folio-brand";
import { FolioLiquidStencil } from "@/components/folio-liquid-stencil";
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

      {/* Viewport 1: brand stencil only — no copy overlay */}
      <section className="home-viewport" aria-label="FOLIO">
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
              <Link to="/markets">Markets</Link>
              <Link to="/truth">Truth</Link>
              <Link to="/credit">Credit</Link>
              <Link to="/preipo">Pre-IPO</Link>
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

      {/* Story: one job per section */}
      <div className="home-story">
        <section className="home-story-pitch" aria-label="What FOLIO is">
          <div className="home-story-pitch-copy">
            <p className="home-eyebrow">Stock desk on Solana</p>
            <h2>Buy US stocks with honest share counts.</h2>
            <p>
              {liveLine} FOLIO refuses dirty tape, quotes a live Jupiter route,
              and keeps credit labeled — fills stay paused until funded.
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
          <aside className="home-story-live" aria-label="Live share count">
            <span>Live · AAPLx</span>
            <strong>
              {mult?.ok
                ? `${mult.data.currentMultiplier.toFixed(6)}×`
                : "Pending"}
            </strong>
            <small>Share-count multiplier</small>
          </aside>
        </section>

        <section className="home-story-path" aria-label="How FOLIO works">
          <header>
            <p className="home-eyebrow">The path</p>
            <h2>Three checks before you size.</h2>
          </header>
          <ol className="home-path-list">
            <li>
              <span className="home-path-n">01</span>
              <div>
                <h3>Prove the shares</h3>
                <p>
                  Live multipliers checked against Solana Scaled UI — raw
                  balances never silently lie after splits.
                </p>
                <Link to="/truth">Truth →</Link>
              </div>
            </li>
            <li>
              <span className="home-path-n">02</span>
              <div>
                <h3>Refuse dirty routes</h3>
                <p>
                  Wash gate fail-closes size. Jupiter quotes stay labeled.
                  Quote-only until broadcast unlocks.
                </p>
                <Link to="/execution">Execution →</Link>
              </div>
            </li>
            <li>
              <span className="home-path-n">03</span>
              <div>
                <h3>Credit without selling</h3>
                <p>
                  See borrow capacity from live Kamino reads. Broadcast stays
                  paused on purpose.
                </p>
                <Link to="/credit">Credit →</Link>
              </div>
            </li>
          </ol>
        </section>

        <section className="home-story-desk" aria-label="Enter the desk">
          <p className="home-eyebrow">Product</p>
          <h2>Your desk — holdings, buy, board, borrow.</h2>
          <p>
            Mega, IPO, and meme lanes. Stock↔stock pairs on Buy. PreStocks and
            Tessera on separate desks so bounty tracks stay honest.
          </p>
          <div className="home-cta-row">
            <Link to="/desk" className="home-cta home-cta-ink">
              Enter the desk <ArrowRight />
            </Link>
            <Link to="/markets" className="home-cta-ghost">
              Market map
            </Link>
          </div>
        </section>
      </div>

      <footer className="home-simple-foot">
        <Link to="/" className="home-brand-hero" aria-label="FOLIO home">
          <span className="home-brand-badge" aria-hidden>
            <FolioMark className="size-4" />
          </span>
          <span>FOLIO</span>
        </Link>
        <nav aria-label="Footer">
          <Link to="/whitepaper">Whitepaper</Link>
          <Link to="/beta">Beta</Link>
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/desk">Desk</Link>
        </nav>
        <p>Built by Henry Sam Marfo · Accra</p>
      </footer>
    </div>
  );
}
