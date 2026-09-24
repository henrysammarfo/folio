import { Link } from "@tanstack/react-router";

/**
 * Light Falcon-style product triptych for FOLIO — soft peach borders,
 * warm shadows, sans UI. No dark magazine cards / serif watermarks.
 */
export function LandingProductTriptych() {
  return (
    <section
      className="folio-triptych"
      aria-label="Product benefits"
    >
      <div className="folio-triptych-inner">
        <header className="folio-triptych-head">
          <p>How it works</p>
          <h2>Three moves. One desk.</h2>
        </header>

        <div className="folio-triptych-cards">
          {/* Card 1 — Share truth */}
          <article className="folio-tcard">
            <div className="folio-tcard-panel" aria-hidden>
              <div className="folio-bars">
                {[28, 42, 55, 48, 62, 58, 70, 66, 80, 74, 88, 100].map((h, i) => (
                  <i
                    key={i}
                    className={i === 11 ? "is-on" : undefined}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <span className="folio-chip">1.003×</span>
              <div className="folio-axis">
                <span>API</span>
                <span>On-chain</span>
                <span>Match</span>
              </div>
            </div>
            <div className="folio-tcard-copy">
              <h3>Honest share counts</h3>
              <p>
                Live multipliers checked against
                <br />
                Solana Scaled UI.
              </p>
              <Link to="/truth" className="folio-tcard-link">
                Open truth
              </Link>
            </div>
          </article>

          {/* Card 2 — Buy / route */}
          <article className="folio-tcard folio-tcard-anchor">
            <div className="folio-tcard-panel folio-tcard-panel-buy" aria-hidden>
              <div className="folio-assist">
                <span className="folio-badge">FOLIO</span>
                <span>Buy ticket</span>
              </div>
              <p className="folio-q">USDC → AAPLx</p>
              <div className="folio-prompt">
                Live Jupiter quote · wash fail-closed
                <br />
                Logos · catalog · fills paused
              </div>
              <Link to="/desk/acquire" className="folio-automate">
                Review quote
              </Link>
            </div>
            <div className="folio-tcard-copy">
              <h3>Safe buy path</h3>
              <p>
                Dirty tape stops the route.
                <br />
                Quotes stay labeled.
              </p>
              <Link to="/desk/acquire" className="folio-tcard-link">
                Open buy
              </Link>
            </div>
          </article>

          {/* Card 3 — Credit */}
          <article className="folio-tcard">
            <div className="folio-tcard-panel folio-tcard-panel-credit" aria-hidden>
              <div className="folio-metric">
                <span>Borrowing power</span>
                <strong>Up to 40%</strong>
                <em>AAPLx max LTV · read-only</em>
              </div>
              <div className="folio-flow" />
              <span className="folio-tag">Broadcast paused</span>
              <span className="folio-tag folio-tag-2">Kamino live</span>
            </div>
            <div className="folio-tcard-copy">
              <h3>Credit without selling</h3>
              <p>
                Keep the shares. See capacity
                <br />
                from live reads.
              </p>
              <Link to="/desk/credit" className="folio-tcard-link">
                Open borrow
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
