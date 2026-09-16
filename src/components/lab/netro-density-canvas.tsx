/**
 * Desk-density canvas — layout/UX extracted from AbdullahBalfaqih/NetroBNB
 * (12-col bento: profile · metrics stack · yellow AI rail · market strip).
 * Content + tokens are FOLIO stock-desk; no Binance/Netro brand clone.
 */
import { useEffect, useState } from "react";

type Props = {
  multiplierLabel: string;
};

export function NetroDensityCanvas({ multiplierLabel }: Props) {
  const [clock, setClock] = useState("00:00:00");

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(
        [n.getHours(), n.getMinutes(), n.getSeconds()]
          .map((x) => String(x).padStart(2, "0"))
          .join(":"),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="netro-density" aria-hidden>
      <header className="netro-density-title">
        <h3>Share truth desk</h3>
        <span>Mainnet-read · quote-only · broadcast off</span>
      </header>

      <div className="netro-density-grid">
        {/* Left 9-col block */}
        <div className="netro-density-left">
          <div className="netro-density-top">
            <div className="netro-density-profile">
              <p className="netro-density-hi">Hi, desk</p>
              <h4>
                Make
                <br />
                Analysis Easy
              </h4>
              <div className="netro-density-clock">{clock}</div>
              <button type="button" tabIndex={-1} className="netro-density-cta">
                Start truth pass
              </button>
            </div>

            <div className="netro-density-stack">
              <div className="netro-density-card netro-density-card-wide">
                <div className="netro-density-pills">
                  <span className="netro-pill netro-pill-on">Acquisition</span>
                  <span className="netro-pill">Holding</span>
                  <span className="netro-pill">Liquidity</span>
                </div>
                <b>{multiplierLabel}</b>
                <small>AAPLx Scaled UI · wash fail-closed · ≤$1 quote inspect</small>
              </div>
              <div className="netro-density-row">
                <div className="netro-density-card">
                  <span>Route</span>
                  <b>USDC → AAPLx</b>
                  <small>Jupiter TTL · stale on 429</small>
                </div>
                <div className="netro-density-card netro-density-card-dark">
                  <span>Paper mark</span>
                  <b>Live · not fixture</b>
                  <small>No invent-a-fill theater</small>
                </div>
              </div>
              <div className="netro-density-row">
                <div className="netro-density-card">
                  <span>Credit LTV</span>
                  <b>Kamino 0.40</b>
                  <small>Borrow CPI unavailable until funded</small>
                </div>
                <div className="netro-density-card">
                  <span>Nest</span>
                  <b>Nest.credit ≠ NestUSD</b>
                  <small>NestUSD capacity labeled unavailable</small>
                </div>
              </div>
            </div>
          </div>

          <div className="netro-density-market">
            <div className="netro-density-market-head">
              <strong>AAPLx / USDC</strong>
              <span>Share truth strip · mainnet-read</span>
              <em>{multiplierLabel}</em>
            </div>
            <div className="netro-density-chart netro-density-chart-dark" role="presentation">
              <div className="netro-density-chart-meta">
                <b>Truth strip</b>
                <span>15m · wash fail-closed</span>
              </div>
              <svg viewBox="0 0 640 180" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#f4d014"
                  strokeWidth="2.2"
                  points="0,140 40,132 80,128 120,118 160,122 200,108 240,98 280,104 320,86 360,92 400,74 440,80 480,62 520,70 560,52 600,58 640,44"
                />
                <polyline
                  fill="none"
                  stroke="rgba(255,255,255,.35)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  points="0,150 80,148 160,146 240,144 320,142 400,140 480,138 560,136 640,134"
                />
              </svg>
              <div className="netro-density-chart-foot">
                <span>Wash · fail-closed</span>
                <span>Pyth diverge · key gated</span>
                <span>Broadcast · paused</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3-col yellow AI rail */}
        <aside className="netro-density-rail">
          <p className="netro-density-rail-title">FOLIO agent</p>
          <p className="netro-density-rail-body">
            Ask about AAPLx multiplier, wash pressure, or credit LTV. Paper agent
            keeps the live spine — never fills while broadcast is paused.
          </p>
          <div className="netro-density-rail-actions">
            <span>Truth pass</span>
            <span>24h strip</span>
          </div>
          <div className="netro-density-rail-input">Ask about AAPLx…</div>
        </aside>
      </div>
    </div>
  );
}
