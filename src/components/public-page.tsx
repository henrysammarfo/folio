import { Link, useRouterState } from "@tanstack/react-router";
import { FolioMark } from "./folio-brand";
import { FolioSimpleFooter } from "./nexeus-cinematic";

const VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_123836_11a3c5e0-713f-4bef-a8e9-7dd93bdea3b0.mp4";
const POSTER =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp";

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
    <div className={`mkt mkt-cine mkt-tone-${tone}`}>
      <div className="mkt-cine-bg" aria-hidden>
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={POSTER}
          src={VIDEO}
        />
        <div className="mkt-cine-scrim" />
      </div>

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

      <FolioSimpleFooter />
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
  detail?: string;
}) {
  return (
    <article className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </article>
  );
}

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
