import { useState } from "react";
import { xStockLogoUrl } from "@/lib/xstock-catalog";

export function AssetLogo({
  symbol,
  logo,
  size = 40,
  className = "",
}: {
  symbol: string;
  logo?: string | null;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = logo?.trim() || xStockLogoUrl(symbol);
  if (broken) {
    return (
      <span
        className={`fx-logo fx-logo-fallback ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        aria-hidden
      >
        {symbol.replace(/x$/i, "").slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      className={`fx-logo ${className}`}
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}
