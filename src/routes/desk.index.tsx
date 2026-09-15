import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getCreditBundle, getPositionsBundle } from "@/lib/desk.functions";

export const Route = createFileRoute("/desk/")({
  head: () => ({
    meta: [
      { title: "Prime Desk — FOLIO" },
      { name: "description", content: "Live-labeled xStock desk overview." },
    ],
  }),
  /** Prefetch overview bundles so qty/credit honesty paints on first load. */
  loader: async () => {
    const [positions, credit] = await Promise.all([
      getPositionsBundle({ data: {} }),
      getCreditBundle({ data: {} }),
    ]);
    return { positions, credit };
  },
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchPositions = useServerFn(getPositionsBundle);
  const fetchCredit = useServerFn(getCreditBundle);
  const positions = useQuery({
    queryKey: ["positions-bundle"],
    queryFn: () => fetchPositions({ data: {} }),
    initialData: initial.positions,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });
  const credit = useQuery({
    queryKey: ["credit-bundle"],
    queryFn: () => fetchCredit({ data: {} }),
    initialData: initial.credit,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const rows = positions.data?.rows ?? [];
  const verified = rows.filter((r) => r.health === "Verified").length;
  const paperValue = rows.reduce((s, r) => s + (r.paperValueUsd ?? 0), 0);
  const walletRead = rows.some((r) => r.qtySource === "wallet-read");
  const creditLabel = credit.data?.paper.label === "wallet-read" ? "wallet-read" : "paper";

  return (
    <DeskShell eyebrow="Portfolio command" title="Prime desk">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Live marks</ModeBadge>
        <ModeBadge mode={walletRead ? "mainnet-read" : "paper"}>
          {walletRead ? "Wallet-read qty" : "Paper qty"}
        </ModeBadge>
        <ModeBadge mode="quote-only">Broadcast off</ModeBadge>
      </div>
      <div className="desk-metrics">
        <div>
          <span>{walletRead ? "Wallet-read economic value" : "Paper economic value"}</span>
          <b>
            {paperValue > 0
              ? paperValue.toLocaleString("en-US", { style: "currency", currency: "USD" })
              : "—"}
          </b>
          <small>Mainnet marks · {walletRead ? "wallet-read qty" : "paper qty"}</small>
        </div>
        <div>
          <span>Verified rows</span>
          <b>
            {verified} / {rows.length || "—"}
          </b>
          <small>Fail-closed when signals missing</small>
        </div>
        <div>
          <span>Illustrative credit</span>
          <b>
            {credit.data?.paper.illustrativeBorrowUsd != null
              ? credit.data.paper.illustrativeBorrowUsd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </b>
          <small>
            {creditLabel === "wallet-read" ? "Wallet-read × live Kamino LTV" : "Paper × live Kamino LTV"}
          </small>
        </div>
      </div>
      <div className="desk-grid">
        <Panel title="Economic positions" meta={<StatusBadge tone="green">{verified} verified</StatusBadge>}>
          <div className="position-list">
            {rows.map((p) => (
              <Link key={p.symbol} to="/desk/positions/$symbol" params={{ symbol: p.symbol }}>
                <span className="asset-icon">{p.symbol[0]}</span>
                <p>
                  <b>{p.symbol}</b>
                  <small>{p.name}</small>
                </p>
                <p>
                  <b>{p.economicShares != null ? p.economicShares.toFixed(4) : "—"}</b>
                  <small>economic shares</small>
                </p>
                <strong>
                  {p.paperValueUsd != null
                    ? p.paperValueUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })
                    : "—"}
                </strong>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Policy state" meta={<StatusBadge tone="green">Fail closed</StatusBadge>}>
          <div className="policy-list">
            <p>
              <span>Corporate actions</span>
              <b>{verified > 0 ? "Live API" : "Pending"}</b>
            </p>
            <p>
              <span>Kamino market</span>
              <b>{credit.data?.kamino.ok ? "Mainnet read" : "Unavailable"}</b>
            </p>
            <p>
              <span>Wash pressure</span>
              <b>Fail-closed until Bitquery</b>
            </p>
            <p>
              <span>Broadcast</span>
              <b>Disabled</b>
            </p>
          </div>
        </Panel>
      </div>
    </DeskShell>
  );
}
