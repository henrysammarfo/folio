/**
 * FOLIO liquid-light brand stencil — pattern extracted from
 * manovHacksaw/aionis-app/landing (SVG mask + inertia-eased radial glow).
 * Brand name / copy / colors are FOLIO; not an Aionis clone.
 */
import { useEffect, useId, useRef } from "react";

type Props = {
  className?: string;
  /** Smaller type for lab thumbnails */
  compact?: boolean;
};

export function FolioLiquidStencil({ className, compact = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const maskId = `folio-stencil-mask-${uid}`;
  const gradId = `folio-liquid-grad-${uid}`;
  const blurId = `folio-glow-blur-${uid}`;
  const circleRef = useRef<SVGCircleElement>(null);
  const blurFilterRef = useRef<SVGFEGaussianBlurElement>(null);
  const stop1Ref = useRef<SVGStopElement>(null);
  const stop2Ref = useRef<SVGStopElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    const start = Date.now();
    let curX = 380;
    let curRadius = 280;
    let curBlur = 42;
    let curCore = 1;
    let curEdge = 0.95;

    const tick = () => {
      const elapsed = (Date.now() - start) % 12000;
      let targetX = 380;
      let targetRadius = 280;
      let targetBlur = 42;
      let targetCore = 1;
      let targetEdge = 0.95;

      if (elapsed < 2000) {
        targetX = 380;
      } else if (elapsed < 5000) {
        targetX = 1050;
      } else if (elapsed < 6000) {
        targetX = 1050;
      } else if (elapsed < 6200) {
        targetX = 1050;
        targetRadius = 140;
        targetBlur = 22;
        targetCore = 0.15;
        targetEdge = 0.1;
      } else if (elapsed < 7200) {
        const p = (elapsed - 6200) / 1000;
        targetX = 380;
        targetRadius = 560 - p * 280;
        targetBlur = 120 - p * 78;
        targetCore = Math.min(1, p * 1.6);
        targetEdge = Math.min(0.95, p * 1.6);
      }

      curX += (targetX - curX) * 0.022;
      curRadius += (targetRadius - curRadius) * 0.035;
      curBlur += (targetBlur - curBlur) * 0.035;
      curCore += (targetCore - curCore) * 0.07;
      curEdge += (targetEdge - curEdge) * 0.07;

      circleRef.current?.setAttribute("cx", curX.toFixed(2));
      circleRef.current?.setAttribute("r", curRadius.toFixed(2));
      blurFilterRef.current?.setAttribute("stdDeviation", curBlur.toFixed(2));
      stop1Ref.current?.setAttribute("stop-opacity", curCore.toFixed(3));
      stop2Ref.current?.setAttribute("stop-opacity", curEdge.toFixed(3));

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Match Aionis letter scale: ~260 / y=465 on 1400×550 — brand owns lower half */
  const fontSize = compact ? 200 : 260;
  const baseline = compact ? 380 : 465;
  const aspect = compact ? "xMidYMid meet" : "xMidYMax slice";

  return (
    <div className={className ?? "folio-stencil"} aria-hidden>
      <svg
        className="folio-stencil-svg"
        viewBox="0 0 1400 550"
        preserveAspectRatio={aspect}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect width="1400" height="550" fill="black" />
            <text
              x="50%"
              y={baseline}
              textAnchor="middle"
              className="folio-stencil-text"
              fontSize={fontSize}
            >
              FOLIO
            </text>
          </mask>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            {/* High-luminance ledger ice — Aionis pattern uses bright gold; FOLIO stays cool but must READ */}
            <stop offset="0%" stopColor="#ffffff" ref={stop1Ref} stopOpacity="1" />
            <stop offset="35%" stopColor="#e8f1fa" ref={stop2Ref} stopOpacity="1" />
            <stop offset="70%" stopColor="#9ec0dc" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#5a849f" stopOpacity="0" />
          </radialGradient>
          <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur ref={blurFilterRef} stdDeviation="42" />
          </filter>
        </defs>
        <g mask={`url(#${maskId})`}>
          <rect width="1400" height="550" fill="#000000" />
          {/* Soft floor so letterforms stay readable between animation peaks */}
          <rect width="1400" height="550" fill="#243040" opacity="0.55" />
          <circle
            ref={circleRef}
            cx="380"
            cy="280"
            r="280"
            fill={`url(#${gradId})`}
            filter={`url(#${blurId})`}
          />
        </g>
      </svg>
    </div>
  );
}
