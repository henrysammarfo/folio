import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, MktSection } from "@/components/public-page";
import { XSTOCK_SWAP_PAIRS } from "@/lib/xstock-catalog";

export const Route = createFileRoute("/pairs")({
  head: () => ({
    meta: [
      { title: "Stock pairs — FOLIO" },
      {
        name: "description",
        content:
          "Pay one stock, receive another — rotate without cashing out first.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      tone="execution"
      eyebrow="Stock ↔ stock"
      title="Pay one stock. Receive another."
      intro="Rotate without cashing out first. On Buy, pick the stock you pay and the stock you receive — one clean route, one quote, you confirm."
    >
      <MktSection n="01" title="What pairs are for">
        <ul className="mkt-dir mkt-dir-plain">
          <li>
            <div>
              <h3>Mega rotations</h3>
              <p>AAPL → MSFT, NVDA → AVGO, COIN → HOOD — liquid names.</p>
            </div>
          </li>
          <li>
            <div>
              <h3>IPO ↔ mega</h3>
              <p>
                ARM → NVDA, RDDT → META — recent public listings into mega-cap.
                Still xStocks, not PreStocks.
              </p>
            </div>
          </li>
          <li>
            <div>
              <h3>Meme ↔ mega</h3>
              <p>
                GME → AAPL / TSLA — high-beta into calmer mega. Same honest
                share count and wash checks.
              </p>
            </div>
          </li>
        </ul>
      </MktSection>

      <MktSection n="02" title="Preset board">
        <ul className="mkt-pair-list">
          {XSTOCK_SWAP_PAIRS.map((p) => (
            <li key={`${p.pay}-${p.receive}`}>
              <b>{p.label}</b>
              <span>{p.blurb}</span>
            </li>
          ))}
        </ul>
        <p className="mkt-links">
          <Link to="/desk/acquire">Trade pairs on Buy →</Link>
        </p>
      </MktSection>
    </PublicShell>
  );
}
