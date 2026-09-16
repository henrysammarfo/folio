/**
 * Desk-density canvas — layout/UX extracted from AbdullahBalfaqih/NetroBNB
 * (12-col bento, soft figma shadows, Outfit-like calm type, yellow rail).
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
      <div className="netro-density-grid">
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
          <div className="netro-density-card">
            <span>Attendance · share count</span>
            <b>{multiplierLabel}</b>
            <small>Wash fail-closed · quote-only · ≤$1</small>
          </div>
          <div className="netro-density-row">
            <div className="netro-density-card">
              <span>Acquisition</span>
              <b>USDC → AAPLx</b>
            </div>
            <div className="netro-density-card">
              <span>Holding</span>
              <b>Live · not fixture</b>
            </div>
          </div>
          <div className="netro-density-row">
            <div className="netro-density-card">
              <span>Liquidity</span>
              <b>Jupiter TTL</b>
            </div>
            <div className="netro-density-card">
              <span>Credit</span>
              <b>Nest.credit ≠ NestUSD</b>
            </div>
          </div>
        </div>

        <div className="netro-density-rail">
          <p className="netro-density-rail-title">FOLIO agent</p>
          <p className="netro-density-rail-body">
            Market intelligence rail — ask about AAPLx multiplier, wash, or
            credit. Broadcast stays off until funded.
          </p>
          <div className="netro-density-rail-actions">
            <span>Truth</span>
            <span>24h strip</span>
          </div>
          <div className="netro-density-rail-input">Ask about AAPLx…</div>
        </div>
      </div>
    </div>
  );
}
