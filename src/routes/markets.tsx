import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, MktSection } from "@/components/public-page";
import { LANE_META, XSTOCK_SWAP_PAIRS } from "@/lib/xstock-catalog";

export const Route = createFileRoute("/markets")({
  head: () => ({
    meta: [
      { title: "Markets — FOLIO" },
      {
        name: "description",
        content:
          "Mega, IPO, and meme xStocks, stock pairs, PreStocks, and Tessera — organized desks on Solana.",
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
      title="Every stock has a home on FOLIO."
      intro="Public xStocks in mega, IPO, and meme lanes. Stock↔stock pairs on Buy. Private PreStocks and Tessera stay on their own desks — on purpose."
    >
      <MktSection n="01" title="Public lanes">
        <ul className="mkt-dir">
          {lanes.map((lane) => (
            <li key={lane.id}>
              <div>
                <h3>{lane.title}</h3>
                <p>{lane.body}</p>
              </div>
              <Link to="/desk/markets">{lane.label} board →</Link>
            </li>
          ))}
        </ul>
      </MktSection>

      <MktSection n="02" title="Stock ↔ stock">
        <p>
          Rotate without cashing out first — one clean route from the stock you
          pay to the stock you receive. Presets include{" "}
          {XSTOCK_SWAP_PAIRS.slice(0, 3)
            .map((p) => p.label)
            .join(", ")}
          .
        </p>
        <p className="mkt-links">
          <Link to="/pairs">How pairs work →</Link>
          <Link to="/desk/acquire">Trade on Buy →</Link>
        </p>
      </MktSection>

      <MktSection n="03" title="Private desks">
        <p>
          <b>PreStocks</b> and <b>Tessera</b> each get their own desk so private
          names never blur into public IPO era listings.
        </p>
        <p className="mkt-links">
          <Link to="/preipo">PreStocks explainer</Link>
          <Link to="/desk/preipo">PreStocks desk</Link>
          <Link to="/desk/tessera">Tessera desk</Link>
        </p>
      </MktSection>
    </PublicShell>
  );
}
