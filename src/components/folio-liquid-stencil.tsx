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
    let curX = 320;
    let curRadius = 220;
    let curBlur = 48;
    let curCore = 1;
    let curEdge = 0.92;

    const tick = () => {
      const elapsed = (Date.now() - start) % 12000;
      let targetX = 320;
      let targetRadius = 220;
      let targetBlur = 48;
      let targetCore = 1;
      let targetEdge = 0.92;

      if (elapsed < 2000) {
        targetX = 320;
      } else if (elapsed < 5000) {
        targetX = 980;
      } else if (elapsed < 6000) {
        targetX = 980;
      } else if (elapsed < 6200) {
        targetX = 980;
        targetRadius = 110;
        targetBlur = 22;
        targetCore = 0;
        targetEdge = 0;
      } else if (elapsed < 7200) {
        const p = (elapsed - 6200) / 1000;
        targetX = 320;
        targetRadius = 560 - p * 340;
        targetBlur = 150 - p * 102;
        targetCore = Math.min(1, p * 1.6);
        targetEdge = Math.min(0.92, p * 1.6);
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

  const fontSize = compact ? 200 : 240;
  const baseline = compact ? 420 : 455;

  return (
    <div className={className ?? "folio-stencil"} aria-hidden>
      <svg
        className="folio-stencil-svg"
        viewBox="0 0 1400 550"
        preserveAspectRatio="xMidYMax slice"
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
            <stop offset="0%" stopColor="#c8d6e5" ref={stop1Ref} stopOpacity="1" />
            <stop offset="55%" stopColor="#7a9bb8" ref={stop2Ref} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#3d5a73" stopOpacity="0" />
          </radialGradient>
          <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur ref={blurFilterRef} stdDeviation="56" />
          </filter>
        </defs>
        <g mask={`url(#${maskId})`}>
          <rect width="1400" height="550" fill="#05070a" />
          <circle
            ref={circleRef}
            cx="320"
            cy="250"
            r="220"
            fill={`url(#${gradId})`}
            filter={`url(#${blurId})`}
          />
        </g>
      </svg>
    </div>
  );
}
