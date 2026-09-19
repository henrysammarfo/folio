import { Link, useRouterState } from "@tanstack/react-router";
import { FolioMark } from "./folio-brand";
import { LandingGlassFooter } from "./landing-glass-footer";

const nav = [
  ["Truth", "/truth"],
  ["Execution", "/execution"],
  ["Credit", "/credit"],
  ["Network", "/network"],
  ["About", "/about"],
] as const;

export type PublicTone =
  | "truth"
  | "execution"
  | "credit"
  | "network"
  | "about"
  | "legal";

export function PublicShell({
  eyebrow,
  title,
  intro,
  children,
  compactIntro = false,
  tone = "truth",
  glassFooter = true,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  compactIntro?: boolean;
  /** Per-page atmosphere — marketing pages must not share one bland shell. */
  tone?: PublicTone;
  /** Liquid-glass template footer (default on). */
  glassFooter?: boolean;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className={`mkt mkt-tone-${tone}`}>
      <header className="mkt-top">
        <Link to="/" className="mkt-brand" aria-label="FOLIO home">
          <span className="mkt-brand-badge" aria-hidden>
            <FolioMark className="mkt-brand-mark" title="FOLIO" />
          </span>
          <b>FOLIO</b>
        </Link>
        <nav className="mkt-nav" aria-label="Main navigation">
          {nav.map(([label, to]) => {
            const active = path === to || path.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`mkt-pill${active ? " is-active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <Link to="/desk" className="mkt-cta">
          Open desk
        </Link>
      </header>

      <main>
        <section
          className={
            compactIntro ? "mkt-intro mkt-intro-compact" : "mkt-intro"
          }
        >
          <p className="mkt-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="mkt-lede">{intro}</p>
        </section>
        <div className="mkt-content">{children}</div>
      </main>

      {glassFooter ? (
        <LandingGlassFooter />
      ) : (
        <footer className="mkt-foot">
          <Link to="/" className="mkt-brand" aria-label="FOLIO home">
            <span className="mkt-brand-badge" aria-hidden>
              <FolioMark className="mkt-brand-mark" title="FOLIO" />
            </span>
            <b>FOLIO</b>
          </Link>
          <p>Honest share counts for Solana xStocks.</p>
          <nav className="mkt-foot-links" aria-label="Legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/desk">Desk</Link>
          </nav>
          <p className="mkt-foot-by">Built by Henry Sam Marfo · Accra</p>
        </footer>
      )}
    </div>
  );
}

export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}
