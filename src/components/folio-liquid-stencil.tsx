/**
 * FOLIO liquid-light brand stencil — pattern extracted from
 * manovHacksaw/aionis-app/landing (SVG mask + inertia-eased radial glow).
 * Brand name / copy / colors are FOLIO; not an Aionis clone.
 *
 * Screened against live Aionis @ :3110: letters must READ luminous in the
 * lower half — never a dim footer strip. FOLIO is 5 glyphs vs AIONIS 6, so
 * we bump type size so mass matches the reference plane.
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
    // Match Aionis physics: pool left, drift right, blackout, bloom reset
    let curX = 380;
    let curRadius = 240;
    let curBlur = 48;
    let curCore = 1;
    let curEdge = 0.95;

    const tick = () => {
      const elapsed = (Date.now() - start) % 12000;
      let targetX = 380;
      let targetRadius = 240;
      let targetBlur = 48;
      let targetCore = 1;
      let targetEdge = 0.95;

      if (elapsed < 2000) {
        targetX = 380;
      } else if (elapsed < 5000) {
        targetX = 1050;
        targetBlur = 50;
      } else if (elapsed < 6000) {
        targetX = 1050;
      } else if (elapsed < 6200) {
        targetX = 1050;
        targetRadius = 120;
        targetBlur = 24;
        targetCore = 0;
        targetEdge = 0;
      } else if (elapsed < 7200) {
        const p = (elapsed - 6200) / 1000;
        targetX = 380;
        targetRadius = 600 - p * 360;
        targetBlur = 160 - p * 112;
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

  /* Extra viewBox depth below baseline lifts letter mass out of the foot
     (Aionis y≈465 / 550; we pad to 640 so YMax doesn't bury FOLIO). */
  const fontSize = compact ? 210 : 320;
  const baseline = compact ? 390 : 440;
  const viewH = compact ? 550 : 640;
  const aspect = compact ? "xMidYMid meet" : "xMidYMax slice";

  return (
    <div className={className ?? "folio-stencil"} aria-hidden>
      <svg
        className="folio-stencil-svg"
        viewBox={`0 0 1400 ${viewH}`}
        preserveAspectRatio={aspect}
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect width="1400" height={viewH} fill="black" />
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
            <stop offset="0%" stopColor="#ffffff" ref={stop1Ref} stopOpacity="1" />
            <stop offset="40%" stopColor="#d7ecfa" ref={stop2Ref} stopOpacity="1" />
            <stop offset="100%" stopColor="#8eb8d8" stopOpacity="0" />
          </radialGradient>
          <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur ref={blurFilterRef} stdDeviation="52" />
          </filter>
        </defs>
        <g mask={`url(#${maskId})`}>
          <rect width="1400" height={viewH} fill="#000000" />
          {/* Always-readable letter floor — Aionis gold reads; FOLIO ice must too */}
          <rect width="1400" height={viewH} fill="#3d5166" opacity="0.55" />
          <circle
            ref={circleRef}
            cx="380"
            cy="300"
            r="280"
            fill={`url(#${gradId})`}
            filter={`url(#${blurId})`}
          />
        </g>
      </svg>
    </div>
  );
}
