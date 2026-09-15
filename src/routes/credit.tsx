import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell, Metric } from "@/components/public-page";
import { StatusBadge } from "@/components/folio-brand";

export const Route = createFileRoute("/credit")({
  head: () => ({
    meta: [
      { title: "Credit Desk — FOLIO" },
      {
        name: "description",
        content: "Inspect credit paths against verified xStock balances.",
      },
      { property: "og:title", content: "Credit Desk — FOLIO" },
      {
        property: "og:description",
        content: "Inspect credit paths against verified xStock balances.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicShell
      eyebrow="Credit without selling"
      title="Keep the shares. Test the liquidity."
      intro="Credit capacity is computed from live Kamino reads against paper quantities — never from hardcoded dollar theater. Open the desk for labeled numbers."
    >
      <div className="metrics-grid">
        <Metric label="Eligible collateral" value="Desk live" detail="Paper qty × mainnet marks" />
        <Metric label="Illustrative capacity" value="Desk live" detail="Kamino maxLtv · no broadcast" />
        <Metric label="Borrow execution" value="Fork / off" detail="Unfunded ≤~$1 budget" />
      </div>
      <div className="protocol-list">
        <div>
          <span>Kamino</span>
          <StatusBadge tone="green">Mainnet read</StatusBadge>
          <b>xStocks market reserves (live LTV/APY)</b>
        </div>
        <div>
          <span>Jupiter Lend</span>
          <StatusBadge tone="blue">Mainnet read</StatusBadge>
          <b>Earn vaults observed — not an xStock borrow path</b>
        </div>
        <div>
          <span>NestUSD</span>
          <StatusBadge tone="amber">Risk labeled</StatusBadge>
          <b>Capacity hidden until verified public metrics</b>
        </div>
      </div>
      <p className="mt-6 text-sm">
        <Link to="/desk/credit" className="underline">
          Open live credit desk →
        </Link>
      </p>
    </PublicShell>
  );
}
