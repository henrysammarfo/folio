import { Link, useRouterState } from "@tanstack/react-router";
import { FolioMark } from "./folio-brand";

/** Primary marketing IA — keep short so layout stays scannable. */
const nav = [
  ["Markets", "/markets"],
  ["Truth", "/truth"],
  ["Credit", "/credit"],
  ["Pre-IPO", "/preipo"],
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
  aside,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  compactIntro?: boolean;
  tone?: PublicTone;
  /** Optional live signal column beside the intro (metrics, status). */
  aside?: React.ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className={`mkt mkt-tone-${tone}`}>
      <header className="mkt-top">
        <Link to="/" className="mkt-brand" aria-label="FOLIO home">
          <FolioMark className="mkt-brand-mark" title="FOLIO" />
          <b>FOLIO</b>
        </Link>
        <nav className="mkt-nav" aria-label="Main navigation">
          {nav.map(([label, to]) => {
            const active = path === to || path.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                className={`mkt-link${active ? " is-active" : ""}`}
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

      <main className="mkt-main">
        <header
          className={
            compactIntro
              ? "mkt-intro mkt-intro-compact"
              : aside
                ? "mkt-intro mkt-intro-split"
                : "mkt-intro"
          }
        >
          <div className="mkt-intro-copy">
            <p className="mkt-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="mkt-lede">{intro}</p>
          </div>
          {aside ? <div className="mkt-intro-aside">{aside}</div> : null}
        </header>
        <div className="mkt-body">{children}</div>
      </main>

      <footer className="mkt-foot">
        <div className="mkt-foot-brand">
          <Link to="/" className="mkt-brand" aria-label="FOLIO home">
            <FolioMark className="mkt-brand-mark" title="FOLIO" />
            <b>FOLIO</b>
          </Link>
          <p>Honest share counts for Solana xStocks.</p>
        </div>
        <nav className="mkt-foot-cols" aria-label="Footer">
          <div>
            <strong>Product</strong>
            <Link to="/desk">Desk</Link>
            <Link to="/desk/acquire">Buy</Link>
            <Link to="/desk/markets">Live board</Link>
            <Link to="/desk/credit">Borrow</Link>
          </div>
          <div>
            <strong>Learn</strong>
            <Link to="/truth">Truth</Link>
            <Link to="/execution">Execution</Link>
            <Link to="/pairs">Pairs</Link>
            <Link to="/preipo">Pre-IPO</Link>
            <Link to="/whitepaper">Whitepaper</Link>
          </div>
          <div>
            <strong>Company</strong>
            <Link to="/about">About</Link>
            <Link to="/beta">Beta</Link>
            <Link to="/network">Network</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </nav>
        <p className="mkt-foot-by">Built by Henry Sam Marfo · Accra</p>
      </footer>
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

/** Numbered editorial section — one job per block. */
export function MktSection({
  n,
  title,
  children,
}: {
  n?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mkt-sec">
      <header className="mkt-sec-head">
        {n ? <span className="mkt-sec-n">{n}</span> : null}
        <h2>{title}</h2>
      </header>
      <div className="mkt-sec-body">{children}</div>
    </section>
  );
}
