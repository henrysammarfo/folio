import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { XSTOCK_SWAP_PAIRS } from "@/lib/xstock-catalog";

export const Route = createFileRoute("/pairs")({
  head: () => ({
    meta: [
      { title: "Stock pairs — FOLIO" },
      {
        name: "description",
        content:
          "Swap one Solana xStock for another on Jupiter — true stock↔stock routes.",
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
      title="Pay Apple. Receive Microsoft. One route."
      intro="Pair mode on Buy sets Jupiter’s input mint to the stock you pay and the output mint to the stock you receive. That is not two USDC buys glued together — it is a single quote-only path."
    >
      <div className="three-features">
        <article>
          <h2>Mega rotations</h2>
          <p>
            AAPL → MSFT, NVDA → AVGO, COIN → HOOD — liquid names for clean pair
            discovery.
          </p>
        </article>
        <article>
          <h2>IPO ↔ mega</h2>
          <p>
            ARM → NVDA, RDDT → META — recent public listings into mega-cap
            exposure. Still xStocks, not PreStocks private.
          </p>
        </article>
        <article>
          <h2>Meme ↔ mega</h2>
          <p>
            GME → AAPL / TSLA — high-beta into calmer mega. Same wash + Scaled UI
            gates; never a soft-sold fill.
          </p>
        </article>
      </div>

      <section className="mkt-aside-band">
        <h2>Preset board</h2>
        <ul className="mkt-pair-list">
          {XSTOCK_SWAP_PAIRS.map((p) => (
            <li key={`${p.pay}-${p.receive}`}>
              <b>{p.label}</b>
              <span>{p.blurb}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link to="/desk/acquire" className="underline">
            Trade pairs on Buy →
          </Link>
        </p>
      </section>
    </PublicShell>
  );
}
