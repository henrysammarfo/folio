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

      {/*
        Aionis landing composition (cloned + screened vs manovHacksaw/aionis-app/landing):
        1) full-bleed black plane
        2) brand stencil IS the hero — luminous letters own the lower half
        3) top bar = mark + primary CTA only (no competing headline in the void)
        4) horizon chrome floats just ABOVE the letterforms (bottom:55% — Aionis parity)
        5) supporting copy + CTAs live below the fold
      */}
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
            {liveLine} Corporate-action share truth before trade. Broadcast stays
            off until funded. The NetroBNB-density desk lives at{" "}
            <Link to="/desk">/desk</Link> — this landing hero stays the Aionis
            brand-plane.
          </p>
          <div className="home-cta-row">
            <Link to="/desk" className="home-cta">
              Open the desk <ArrowRight />
            </Link>
            <Link to="/truth" className="home-cta-secondary">
              See live truth
            </Link>
          </div>
        </div>
        <div className="home-below-links">
          <Link to="/lab/ui">Lab UI</Link>
          <Link to="/lab/shaders">Lab shaders</Link>
          <Link to="/network">Network</Link>
        </div>
      </section>

      <section className="home-section home-section-ink" aria-label="Honesty pillars">
        <h2>Truth before trade.</h2>
        <p>
          One job on Solana: honest share counts, refuse wash, quote-only routes,
          credit without selling. Labels stay fail-closed until keys land.
        </p>
        <div className="home-pillars">
          <article className="home-pillar">
            <strong>Share truth</strong>
            <p>Live xStocks multiplier + on-chain Scaled UI — never fixture 4×.</p>
          </article>
          <article className="home-pillar">
            <strong>Safe route</strong>
            <p>Wash fail-closed without Bitquery. Jupiter ≤$1 inspect · no broadcast.</p>
          </article>
          <article className="home-pillar">
            <strong>Credit spine</strong>
            <p>Kamino maxLTV reads labeled. NestUSD stays unavailable until verified.</p>
          </article>
        </div>
      </section>

      {/* Secondary hero/section — Netro density tease. Does NOT replace the Aionis brand-plane above. */}
      <section className="home-section home-section-netro" aria-label="Desk density section">
        <div className="home-desk-tease">
          <div>
            <h2>Share truth desk.</h2>
            <p>
              Henry-approved Netro density on <Link to="/desk">/desk</Link> —
              soft yellow fills, authentic accent <code>#f4d014</code>, collapsible
              honesty strips so cards stop crowding. Positions, Acquire, Credit keep
              the FOLIO sidebar (minimize when you need space).
            </p>
            <Link to="/desk" className="home-desk-preview-cta">
              Enter the desk <ArrowRight size={16} />
            </Link>
          </div>
          <div className="home-desk-preview" aria-hidden>
            <div className="home-desk-preview-row">
              <div className="home-desk-preview-card soft">
                <span>Analysis clock</span>
                <b>Make Analysis Easy</b>
              </div>
              <div className="home-desk-preview-card dark">
                <span>Today&apos;s share flow</span>
                <b>AAPLx · wash fail-closed</b>
              </div>
            </div>
            <div className="home-desk-preview-card">
              <span>Quote · inspect only</span>
              <b>USDC ≤ $1 → AAPLx · no broadcast</b>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section home-section-soft" aria-label="Empire keys">
        <h2>Paste Empire keys when ready.</h2>
        <p>
          Agents cannot invent Bitquery · Pyth · Privy · Supabase secrets. Follow the
          linked dashboards, paste into Vercel Preview + Production, then redeploy.
          Full runbook: <code>docs/KEYS_LANDING.md</code>.
        </p>
        <div className="home-keys-steps">
          <div className="home-keys-step">
            <strong>1 · Bitquery wash tape</strong>
            <p>
              Create an API key at{" "}
              <a href="https://account.bitquery.io/" target="_blank" rel="noreferrer">
                account.bitquery.io
              </a>{" "}
              → set <code>BITQUERY_API_KEY</code>.
            </p>
          </div>
          <div className="home-keys-step">
            <strong>2 · Pyth Hermes</strong>
            <p>
              Key from{" "}
              <a href="https://pyth.network/" target="_blank" rel="noreferrer">
                pyth.network
              </a>{" "}
              / Hermes docs → <code>PYTH_API_KEY</code>.
            </p>
          </div>
          <div className="home-keys-step">
            <strong>3 · Privy wallet identity</strong>
            <p>
              App ID + secret from{" "}
              <a href="https://dashboard.privy.io/" target="_blank" rel="noreferrer">
                dashboard.privy.io
              </a>
              .
            </p>
          </div>
          <div className="home-keys-step">
            <strong>4 · Supabase tenants</strong>
            <p>
              URL + anon + service-role (+ JWT secret) from{" "}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                supabase.com/dashboard
              </a>
              .
            </p>
          </div>
        </div>
        <div className="home-cta-row">
          <Link to="/desk/settings" hash="empire-readiness" className="home-cta-secondary">
            Open Settings readiness
          </Link>
        </div>
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
