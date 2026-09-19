import { useEffect, useRef, useState } from "react";

const WIDGET_SCRIPT =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

/** Map FOLIO xStock symbols → underlying equity TradingView symbols. */
export function equityTvSymbol(xStock: string): string {
  const base = xStock.replace(/x$/i, "").toUpperCase();
  const map: Record<string, string> = {
    AAPL: "NASDAQ:AAPL",
    NVDA: "NASDAQ:NVDA",
    TSLA: "NASDAQ:TSLA",
    MSFT: "NASDAQ:MSFT",
    META: "NASDAQ:META",
    GOOG: "NASDAQ:GOOGL",
    AMZN: "NASDAQ:AMZN",
  };
  return map[base] ?? `NASDAQ:${base}`;
}

/**
 * Live TradingView Advanced Chart widget (hosted — no API key).
 * Attribution retained per TradingView widget terms.
 * For self-hosted Charting Library / private datafeed, Henry must apply for a license
 * (see docs/KEYS_LANDING.md).
 */
export function TradingViewChart({
  symbol,
  height = 420,
  interval = "60",
  theme = "light",
}: {
  /** FOLIO xStock (AAPLx) or raw TV symbol (NASDAQ:AAPL). */
  symbol: string;
  height?: number;
  interval?: string;
  theme?: "light" | "dark";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const tvSymbol = symbol.includes(":") ? symbol : equityTvSymbol(symbol);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    const widgetHost = document.createElement("div");
    widgetHost.className = "tradingview-widget-container__widget";
    widgetHost.style.height = "calc(100% - 28px)";
    widgetHost.style.width = "100%";
    container.appendChild(widgetHost);

    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval,
      timezone: "exchange",
      theme,
      style: "1",
      locale: "en",
      backgroundColor: theme === "light" ? "#ffffff" : "#0b1220",
      gridColor: theme === "light" ? "rgba(14,165,201,0.08)" : "rgba(14,165,201,0.12)",
      hide_side_toolbar: false,
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      withdateranges: true,
      hide_top_toolbar: false,
      save_image: false,
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = WIDGET_SCRIPT;
    script.async = true;
    script.textContent = JSON.stringify(config);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [mounted, tvSymbol, interval, theme]);

  return (
    <div
      className="folio-tv-chart"
      style={{ height }}
      data-testid="tradingview-chart"
      data-symbol={tvSymbol}
      role="img"
      aria-label={`${tvSymbol} live price chart`}
    >
      {!mounted ? (
        <div className="folio-tv-chart-skeleton" aria-hidden>
          Loading chart…
        </div>
      ) : null}
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: "100%", width: "100%" }}
      />
      <p className="folio-tv-chart-attr">
        <a
          href={`https://www.tradingview.com/symbols/${tvSymbol.replace(":", "-")}/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {tvSymbol} chart
        </a>{" "}
        by TradingView
      </p>
    </div>
  );
}
