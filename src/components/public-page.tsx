import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "./folio-brand";

const nav = [
  ["Truth", "/truth"],
  ["Execution", "/execution"],
  ["Credit", "/credit"],
  ["Network", "/network"],
  ["About", "/about"],
] as const;

export function PublicShell({
  eyebrow,
  title,
  intro,
  children,
  compactIntro = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  compactIntro?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="site-header">
        <Wordmark />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {nav.map(([label, to]) => (
            <Link
              key={to}
              to={to}
              className="nav-link"
              activeProps={{ className: "nav-link nav-link-active" }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link to="/desk" className="header-action">
          Open desk <ArrowUpRight />
        </Link>
      </header>
      <main>
        <section
          className={compactIntro ? "page-intro page-intro-compact" : "page-intro"}
        >
          <p className="eyebrow-dark">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </section>
        <div className="page-content">{children}</div>
      </main>
      <footer className="site-footer">
        <Wordmark />
        <p>Honest share counts for Solana xStocks.</p>
        <nav className="site-footer-legal" aria-label="Legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
        <p>Built by Henry Sam Marfo · Accra</p>
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
