import { useEffect, useMemo, useState } from "react";
import {
  initialsForSymbol,
  logoCandidates,
} from "@/lib/logo-resolve";

export function AssetLogo({
  symbol,
  logo,
  underlying,
  size = 40,
  className = "",
}: {
  symbol: string;
  logo?: string | null;
  underlying?: string;
  size?: number;
  className?: string;
}) {
  const candidates = useMemo(
    () => logoCandidates({ symbol, underlying, logo }),
    [symbol, underlying, logo],
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [symbol, logo, underlying]);

  if (idx >= candidates.length) {
    return (
      <span
        className={`fx-logo fx-logo-fallback ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(11, size * 0.36),
        }}
        aria-hidden
        title={symbol}
      >
        {initialsForSymbol(symbol)}
      </span>
    );
  }

  return (
    <img
      className={`fx-logo ${className}`}
      src={candidates[idx]}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      style={{ width: size, height: size }}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}
