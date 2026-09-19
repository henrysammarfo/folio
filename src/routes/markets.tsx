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
  return (
    <PublicShell
      tone="truth"
      eyebrow="Market map"
      title="Public xStocks. Private pre-IPO. Real pairs."
      intro="FOLIO organizes Solana stock exposure into honest lanes — mega caps, IPO-era listings, meme beta, stock↔stock swaps, plus separate PreStocks and Tessera desks for Stocklana bounty tracks."
    >
      <div className="three-features">
        {LANE_META.filter((l) => l.id !== "all").slice(0, 3).map((lane) => (
          <article key={lane.id}>
            <h2>{lane.title}</h2>
            <p>{lane.body}</p>
          </article>
        ))}
      </div>

      <section className="mkt-aside-band" aria-label="Pairs">
        <h2>Stock ↔ stock — not two cash buys</h2>
        <p>
          Pair presets route Jupiter with the pay mint as input and the receive
          mint as output. Examples: {XSTOCK_SWAP_PAIRS.slice(0, 3).map((p) => p.label).join(" · ")}.
        </p>
        <p className="mt-3 text-sm">
          <Link to="/desk/acquire" className="underline">
            Open Buy pairs →
          </Link>
          {" · "}
          <Link to="/pairs" className="underline">
            How pairs work →
          </Link>
        </p>
      </section>

      <section className="mkt-aside-band mt-6" aria-label="Pre-IPO">
        <h2>Pre-IPO tracks stay separate</h2>
        <p>
          <b>PreStocks</b> (Anduril, Anthropic, OpenAI…) and <b>Tessera</b>{" "}
          (T-OpenAI, T-Kalshi, T-SpaceX) each get their own desk so Stocklana
          bounty eligibility is never mixed.
        </p>
        <p className="mt-3 text-sm">
          <Link to="/preipo" className="underline">
            Pre-IPO explainer →
          </Link>
          {" · "}
          <Link to="/desk/preipo" className="underline">
            PreStocks desk →
          </Link>
          {" · "}
          <Link to="/desk/tessera" className="underline">
            Tessera desk →
          </Link>
        </p>
      </section>
    </PublicShell>
  );
}
