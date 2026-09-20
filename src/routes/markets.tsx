import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/public-page";
import { LANE_META, XSTOCK_SWAP_PAIRS } from "@/lib/xstock-catalog";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets — FOLIO" },
      {
        name: "description",
        content:
          "Mega, IPO, meme xStocks, stock↔stock pairs, PreStocks, and Tessera on Solana.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const lanes = LANE_META.filter((l) => l.id !== "all" && l.id !== "pairs");

  return (
    <PublicShell
      tone="truth"
      eyebrow="Market map"
      title="Public xStocks. Private pre-IPO. Real pairs."
      intro="FOLIO organizes Solana stock exposure into honest lanes — mega caps, IPO-era listings, meme beta, stock↔stock swaps, plus separate PreStocks and Tessera desks."
    >
      <ol className="mkt-stack">
        {lanes.map((lane) => (
          <li key={lane.id}>
            <h2>{lane.title}</h2>
            <p>{lane.body}</p>
          </li>
        ))}
      </ol>

      <section className="mkt-block" aria-label="Pairs">
        <h2>Stock ↔ stock — not two cash buys</h2>
        <p>
          Pair presets route Jupiter with the pay mint as input and the receive
          mint as output. Examples:{" "}
          {XSTOCK_SWAP_PAIRS.slice(0, 3)
            .map((p) => p.label)
            .join(" · ")}
          .
        </p>
        <p className="mkt-links">
          <Link to="/desk/acquire">Open Buy pairs →</Link>
          <Link to="/pairs">How pairs work →</Link>
        </p>
      </section>

      <section className="mkt-block" aria-label="Pre-IPO">
        <h2>Pre-IPO tracks stay separate</h2>
        <p>
          <b>PreStocks</b> (Anduril, Anthropic, OpenAI…) and <b>Tessera</b>{" "}
          (T-OpenAI, T-Kalshi, T-SpaceX) each get their own desk so Stocklana
          bounty eligibility is never mixed.
        </p>
        <p className="mkt-links">
          <Link to="/preipo">Pre-IPO explainer →</Link>
          <Link to="/desk/preipo">PreStocks desk →</Link>
          <Link to="/desk/tessera">Tessera desk →</Link>
        </p>
      </section>
    </PublicShell>
  );
}
