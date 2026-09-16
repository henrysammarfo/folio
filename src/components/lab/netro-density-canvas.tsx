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
              <strong>AAPLx</strong>
              <span>Share truth strip</span>
              <em>{multiplierLabel}</em>
            </div>
            <div className="netro-density-chart" role="presentation">
              <svg viewBox="0 0 640 160" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#1c1c1c"
                  strokeWidth="2"
                  points="0,110 40,104 80,98 120,100 160,86 200,90 240,72 280,78 320,60 360,68 400,52 440,58 480,44 520,50 560,38 600,42 640,30"
                />
                <polyline
                  fill="none"
                  stroke="#f4d014"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  points="0,120 80,118 160,116 240,114 320,112 400,110 480,108 560,106 640,104"
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
