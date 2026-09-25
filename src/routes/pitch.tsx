/**
 * Startup-grade FOLIO pitch deck — keyboard arrows / click to advance.
 * Soft pitch only. No invented counts. Never claim unhackable.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolioMark } from "@/components/folio-brand";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/pitch")({
  head: () => ({
    meta: siteMeta({
      title: "Pitch deck · FOLIO",
      description:
        "FOLIO pitch deck. Honest stock desk on Solana. Soft pitch, ten year vision.",
      path: "/pitch",
    }),
  }),
  component: PitchDeck,
});

type Slide = {
  id: string;
  kicker?: string;
  title: string;
  body?: string[];
  bullets?: string[];
  footer?: string;
  tone?: "dark" | "azure" | "light" | "ink";
  logos?: string[];
  big?: string;
};

const SLIDES: Slide[] = [
  {
    id: "title",
    tone: "dark",
    kicker: "Stocklana · Colosseum · ten years",
    title: "FOLIO",
    big: "Honest stock desk on Solana",
    body: [
      "We buy the US stocks you want on Solana. We keep share counts honest. We will not buy in shady pools. We let you borrow cash without selling.",
    ],
    footer: "folio-tawny-one.vercel.app",
  },
  {
    id: "problem",
    tone: "ink",
    kicker: "The pain",
    title: "Tokenized stocks already trade. Trust still does not.",
    bullets: [
      "After dividends and splits, a raw token balance is not the share story.",
      "Dirty or thin pools can look deep until you try to size.",
      "Swap screens do not build a holdings habit.",
      "Borrow often means sell the position you wanted to keep.",
      "Private PreStocks and Tessera get mixed into public equity theater.",
    ],
  },
  {
    id: "insight",
    tone: "azure",
    kicker: "Insight",
    title: "The desk is the product.",
    body: [
      "Not another raw router. A place people open every week. Truth before size. Refuse before regret. Buy and borrow without leaving the story.",
    ],
    bullets: [
      "Share math as a habit, not a footnote.",
      "Routes that fail closed and say why.",
      "One Solana-native desk for public and private rooms.",
    ],
  },
  {
    id: "solution",
    tone: "light",
    kicker: "Solution",
    title: "One job. Locked pitch order.",
    bullets: [
      "Honest share counts",
      "Refuse wash",
      "Buy on Solana",
      "Borrow without selling",
      "Guarded agent",
    ],
    footer: "Soft pitch stays soft. Residual risk stays documented.",
  },
  {
    id: "product",
    tone: "dark",
    kicker: "Live product",
    title: "Spine you can click today",
    logos: ["xStocks", "Jupiter", "Kamino", "Privy"],
    bullets: [
      "Truth · live multiplier and Scaled UI compare",
      "Wash · thin or missing tape pauses size",
      "Buy · TokenSelect, flip, Jupiter quote, user signs",
      "Markets · multi venue board, universe search, no invented marks",
      "Borrow · Kamino LTV in desk · NestUSD metrics labeled",
    ],
  },
  {
    id: "tracks",
    tone: "light",
    kicker: "Stocklana bounty tracks",
    title: "Three tracks. One doctrine.",
    logos: ["Meteora DBC", "Tessera", "PreStocks"],
    bullets: [
      "Best Use of Meteora DBC · $5k · stock curve · weekend refuse · labeled network matrix",
      "Best Use of Tessera, Pre-IPO stocks · $6k · live T tokens · catalog + flip · buys in FOLIO",
      "Best Use of PreStocks · $10k · live private catalog · catalog + flip · no Tessera mix",
    ],
    footer: "Fail closed on every lane. Catalogs kept. Issuers never cross. No invented DBC pool.",
  },
  {
    id: "partners",
    tone: "ink",
    kicker: "Partner rooms",
    title: "Separate rooms keep the story clean.",
    logos: ["PreStocks", "Tessera"],
    bullets: [
      "PreStocks · SPV backed private companies · catalog list plus Buy flip",
      "Tessera · T OpenAI, T SpaceX, T Kalshi · loan participation labeled",
      "Cross issuer mixing refused on purpose for bounty clarity and UX",
    ],
  },
  {
    id: "moat",
    tone: "azure",
    kicker: "Why we win",
    title: "Honesty compounds.",
    bullets: [
      "Fail closed adapters · no mocks · no silent greens · no fake fills",
      "Network matrix labels live, paused, quote only, unavailable",
      "Weekend refuse when the curve cannot see the bell",
      "Flaws published · Jupiter 429s, DBC SSR trap, Solami Blur GB, Nest boundary",
    ],
    footer: "We never claim unhackable. That is the brand.",
  },
  {
    id: "market",
    tone: "light",
    kicker: "Beachhead",
    title: "Build in Accra. Serve EU and APAC non US first.",
    body: [
      "People who want US equity exposure on Solana without a brokerage that lies about the share count. Soft pitch. Real desk. Partner rooms when private names matter.",
    ],
    bullets: [
      "Public xStocks habit first",
      "PreStocks and Tessera as clean adjacent rooms",
      "Colosseum World’s Fair next after Stocklana credibility",
    ],
  },
  {
    id: "model",
    tone: "dark",
    kicker: "Business",
    title: "Revenue follows balances and volume.",
    bullets: [
      "Near term · volume and spread share on desk flow when fills arm",
      "Balances · credit and retention as holdings habit grows",
      "Partners · clean rooms that earn trust without mixing issuers",
      "Never · vanity market cap theater or invented AUM claims",
    ],
  },
  {
    id: "ten-years",
    tone: "azure",
    kicker: "Ten year vision",
    title: "Still the desk people open first.",
    body: [
      "In ten years FOLIO is still the honest stock desk on Solana. Share truth is boring infrastructure. Routes still refuse junk. Credit still does not force a sale. New partner rooms appear without breaking the doctrine.",
    ],
    bullets: [
      "Habit over hype",
      "Honesty over theater",
      "Rooms over soup",
      "Accra build base · global users",
    ],
  },
  {
    id: "ask",
    tone: "ink",
    kicker: "Ask",
    title: "Judge the working spine.",
    bullets: [
      "Open the live desk · folio-tawny-one.vercel.app",
      "Watch Pitch and Technical videos · scripts in docs/VIDEO_SCRIPTS.md",
      "Read the README Mermaid · Meteora DBC · Tessera · PreStocks · flaws",
      "Invite teammates · edit until close · then Colosseum",
    ],
  },
  {
    id: "close",
    tone: "dark",
    kicker: "FOLIO",
    title: "Buy. Hold. Borrow. Tell the truth.",
    big: "folio-tawny-one.vercel.app",
    body: [
      "We buy the US stocks you want on Solana. We keep share counts honest. We will not buy in shady pools. We let you borrow cash without selling.",
    ],
    footer: "Built in Accra. Shipped for the world.",
  },
];

function PitchDeck() {
  const [i, setI] = useState(0);
  const slide = SLIDES[i]!;
  const n = SLIDES.length;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setI((v) => Math.min(n - 1, v + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setI((v) => Math.max(0, v - 1));
      }
      if (e.key === "Home") setI(0);
      if (e.key === "End") setI(n - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);

  return (
    <div
      className={`fx-pitch fx-pitch-${slide.tone ?? "dark"}`}
      data-testid="folio-pitch-deck"
      onClick={(e) => {
        const x = e.clientX;
        const mid = window.innerWidth / 2;
        if (x > mid) setI((v) => Math.min(n - 1, v + 1));
        else setI((v) => Math.max(0, v - 1));
      }}
    >
      <header className="fx-pitch-chrome">
        <Link to="/" className="fx-pitch-brand" onClick={(e) => e.stopPropagation()}>
          <FolioMark className="fx-pitch-mark" />
          <span>FOLIO</span>
        </Link>
        <nav className="fx-pitch-links" onClick={(e) => e.stopPropagation()}>
          <a href="https://folio-tawny-one.vercel.app/desk">Live desk</a>
          <Link to="/">Home</Link>
          <a href="https://github.com/henrysammarfo/folio">Repo</a>
        </nav>
        <p className="fx-pitch-count">
          {i + 1} / {n}
        </p>
      </header>

      <article className="fx-pitch-stage" key={slide.id}>
        {slide.kicker ? <p className="fx-pitch-kicker">{slide.kicker}</p> : null}
        <h1>{slide.title}</h1>
        {slide.big ? <p className="fx-pitch-big">{slide.big}</p> : null}
        {slide.logos ? (
          <ul className="fx-pitch-logos" aria-label="Partners">
            {slide.logos.map((name) => (
              <li key={name}>
                <span className="fx-pitch-logo-mark" aria-hidden>
                  {name.slice(0, 1)}
                </span>
                {name}
              </li>
            ))}
          </ul>
        ) : null}
        {slide.body?.map((p) => (
          <p key={p} className="fx-pitch-body">
            {p}
          </p>
        ))}
        {slide.bullets ? (
          <ul className="fx-pitch-bullets">
            {slide.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
        {slide.footer ? <p className="fx-pitch-footer">{slide.footer}</p> : null}
      </article>

      <footer className="fx-pitch-bar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="fx-pitch-nav"
          disabled={i === 0}
          onClick={() => setI((v) => Math.max(0, v - 1))}
        >
          Prev
        </button>
        <div className="fx-pitch-dots" role="tablist" aria-label="Slides">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={idx === i}
              className={idx === i ? "is-on" : undefined}
              onClick={() => setI(idx)}
              title={s.title}
            />
          ))}
        </div>
        <button
          type="button"
          className="fx-pitch-nav"
          disabled={i === n - 1}
          onClick={() => setI((v) => Math.min(n - 1, v + 1))}
        >
          Next
        </button>
      </footer>
    </div>
  );
}
