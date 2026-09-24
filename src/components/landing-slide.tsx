import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SLIDES = [
  {
    id: "truth",
    kicker: "01",
    title: "Share counts that hold.",
    body: "Live corporate-action multipliers checked against Solana Token-2022 Scaled UI — before you trade.",
    cue: "Truth",
    to: "/truth" as const,
    tone: "ink" as const,
  },
  {
    id: "route",
    kicker: "02",
    title: "Dirty tape stops here.",
    body: "Wash pressure fail-closes when the signal is missing or dirty. No silent green routes.",
    cue: "Route",
    to: "/execution" as const,
    tone: "ink" as const,
  },
  {
    id: "buy",
    kicker: "03",
    title: "Buy the stock you mean.",
    body: "USDC → xStock with a live Jupiter quote, logos, and a ticket you can actually read.",
    cue: "Buy",
    to: "/desk/acquire" as const,
    tone: "light" as const,
  },
  {
    id: "borrow",
    kicker: "04",
    title: "Credit without selling.",
    body: "Keep the shares. See illustrative borrow power from live Kamino reads — broadcast still paused.",
    cue: "Borrow",
    to: "/desk/credit" as const,
    tone: "azure" as const,
  },
] as const;

export function LandingSlideThrough() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const slides = [...root.querySelectorAll<HTMLElement>("[data-slide]")];
    const io = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best?.target) return;
        const i = slides.indexOf(best.target as HTMLElement);
        if (i >= 0) setIndex(i);
      },
      { root, threshold: [0.55, 0.7] },
    );
    slides.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      goTo((index + 1) % SLIDES.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [index, paused]);

  function goTo(i: number) {
    const root = scrollerRef.current;
    if (!root) return;
    const el = root.querySelectorAll<HTMLElement>("[data-slide]")[i];
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setIndex(i);
  }

  return (
    <section
      className="land-slide"
      aria-label="How FOLIO works"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div className="land-slide-head">
        <p className="land-slide-kicker">Slide through</p>
        <h2>Four beats. One desk.</h2>
        <div className="land-slide-controls">
          <button
            type="button"
            className="land-slide-arrow"
            aria-label="Previous slide"
            onClick={() => goTo((index - 1 + SLIDES.length) % SLIDES.length)}
          >
            <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
          </button>
          <div className="land-slide-dots" role="tablist" aria-label="Slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}: ${s.cue}`}
                className={`land-slide-dot${i === index ? " is-on" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="land-slide-arrow"
            aria-label="Next slide"
            onClick={() => goTo((index + 1) % SLIDES.length)}
          >
            <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      </div>

      <div className="land-slide-track" ref={scrollerRef} tabIndex={0}>
        {SLIDES.map((s) => (
          <article
            key={s.id}
            data-slide={s.id}
            className={`land-slide-panel land-slide-${s.tone}`}
            aria-label={s.cue}
          >
            <div className="land-slide-meta">
              <span>{s.kicker}</span>
              <em>{s.cue}</em>
            </div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <Link to={s.to} className="land-slide-link">
              Open {s.cue.toLowerCase()}
            </Link>
            <div className="land-slide-mark" aria-hidden>
              {s.cue}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
