import { Link } from "@tanstack/react-router";
import { FolioMark } from "@/components/folio-brand";
import { useEffect } from "react";

const VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_123836_11a3c5e0-713f-4bef-a8e9-7dd93bdea3b0.mp4";
const POSTER =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp";

/** Shared FOLIO marketing footer — do not restyle. */
export function FolioSimpleFooter() {
  return (
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
  );
}

export function NexeusCinematicLanding({
  eyebrow,
  title,
  lede,
  ctaLabel,
  ctaTo,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  ctaLabel: string;
  ctaTo: "/desk" | "/markets" | "/truth" | "/credit" | "/preipo" | "/about" | "/beta";
}) {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset["nxEntered"]) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    root.classList.add("js-enter");

    const EXPO = "cubic-bezier(.16,1,.3,1)";
    const SOFT = "cubic-bezier(.22,.65,.28,1)";
    const SETTLE = "cubic-bezier(.33,1,.68,1)";
    const narrow = window.matchMedia("(max-width: 648px)").matches;
    const d = narrow ? 0.62 : 1;
    const t = narrow ? 0.85 : 1;
    const anims: Animation[] = [];

    const rise = (el: Element | null, y: number, dur: number, delay: number, easing: string) => {
      if (!el || !("animate" in el)) return;
      anims.push(
        (el as HTMLElement).animate(
          [
            { opacity: 0, transform: `translate3d(0,${y * d}px,0)` },
            { opacity: 1, transform: "translate3d(0,0,0)" },
          ],
          { duration: dur, delay: delay * t, easing, fill: "forwards" },
        ),
      );
    };

    const scope = document.querySelector(".nx-viewport");
    if (!scope) return;

    rise(scope.querySelector(".nx-eyebrow"), 12, 560, 60, SOFT);
    const headline = scope.querySelector(".nx-headline");
    if (headline) {
      anims.push(
        (headline as HTMLElement).animate(
          [{ transform: "translate3d(0,118%,0)" }, { transform: "translate3d(0,0,0)" }],
          { duration: 950, delay: 170 * t, easing: EXPO, fill: "forwards" },
        ),
      );
    }
    rise(scope.querySelector(".nx-lede"), 14, 660, 430, SOFT);
    const cta = scope.querySelector(".nx-cta");
    if (cta) {
      anims.push(
        (cta as HTMLElement).animate(
          [
            { opacity: 0, transform: `translate3d(0,${12 * d}px,0) scale(.985)` },
            { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
          ],
          { duration: 580, delay: 620 * t, easing: SETTLE, fill: "forwards" },
        ),
      );
    }
    rise(scope.querySelector(".nx-foot-inner"), 10, 540, 700, SOFT);

    Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => {
      root.classList.remove("js-enter");
      anims.forEach((a) => {
        try {
          a.cancel();
        } catch {
          /* ignore */
        }
      });
      root.dataset["nxEntered"] = "1";
    });

    return () => {
      root.classList.remove("js-enter");
    };
  }, []);

  return (
    <div className="nx-viewport">
      <div className="nx-bg">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={POSTER}
          aria-label="Painted alpine panorama: a lone hiker with a pink backpack faces a snow-capped peak above a sea of clouds"
          src={VIDEO}
        />
      </div>
      <div className="nx-scrim" aria-hidden />
      <div className="nx-stage">
        <p className="nx-abs nx-eyebrow">{eyebrow}</p>
        <div className="nx-abs nx-headline-mask">
          <h1 className="nx-headline">{title}</h1>
        </div>
        <p className="nx-abs nx-lede">{lede}</p>
        <Link className="nx-abs nx-cta" to={ctaTo}>
          <span>{ctaLabel}</span>
        </Link>
      </div>
      <div className="nx-foot-slot">
        <div className="nx-foot-inner">
          <FolioSimpleFooter />
        </div>
      </div>
    </div>
  );
}
