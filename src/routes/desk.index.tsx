import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DeskShell } from "@/components/desk-shell";
import {
  getCreditBundle,
  getPositionsBundle,
} from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

const deskSearchSchema = z.object({
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/")({
  head: () => ({
    meta: siteMeta({
      title: "Desk — FOLIO",
      description: "Buy, hold, and borrow tokenized stocks on Solana.",
      path: "/desk",
    }),
  }),
  validateSearch: (search) => deskSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  loader: async ({ deps }) => {
    const [positions, credit] = await Promise.all([
      getPositionsBundle({ data: { inspectWallet: deps.inspect } }),
      getCreditBundle({ data: { inspectWallet: deps.inspect } }),
    ]);
    return { positions, credit };
  },
  component: Page,
});

/** Fallback overview when Netro chrome is not approved — still product-clean. */
function Page() {
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const fetchPositions = useServerFn(getPositionsBundle);
  const fetchCredit = useServerFn(getCreditBundle);
  const positions = useQuery({
    queryKey: ["positions-bundle", inspect ?? ""],
    queryFn: () => fetchPositions({ data: { inspectWallet: inspect } }),
    initialData: initial.positions,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });
  const credit = useQuery({
    queryKey: ["credit-bundle", inspect ?? ""],
    queryFn: () => fetchCredit({ data: { inspectWallet: inspect } }),
    initialData: initial.credit,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const rows = positions.data?.rows ?? [];
  const total = rows.reduce((s, r) => s + (r.paperValueUsd ?? 0), 0);
  const borrow = credit.data?.paper.illustrativeBorrowUsd;

  return (
    <DeskShell title="Home">
      <section className="prod-page">
        <header className="prod-lead">
          <p className="prod-kicker">Your desk</p>
          <h1 className="prod-value">
            {total > 0
              ? total.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </h1>
          <p className="prod-sub">
            Holdings estimate ·{" "}
            {borrow != null
              ? `borrow up to ${borrow.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}`
              : "borrow opens soon"}
          </p>
        </header>
        <div className="prod-cta-row">
          <Link to="/desk/acquire" className="prod-cta">
            Buy AAPLx
          </Link>
          <Link to="/desk/positions" className="prod-ghost">
            Holdings
          </Link>
        </div>
        <ul className="prod-list" aria-label="Holdings">
          {rows.slice(0, 3).map((p) => (
            <li key={p.symbol}>
              <Link
                to="/desk/positions/$symbol"
                params={{ symbol: p.symbol }}
                search={inspect ? { inspect } : {}}
                className="prod-row"
              >
                <span className="prod-row-mark" aria-hidden>
                  {p.symbol[0]}
                </span>
                <span className="prod-row-main">
                  <strong>{p.symbol}</strong>
                  <small>{p.name}</small>
                </span>
                <span className="prod-row-value">
                  {p.paperValueUsd != null
                    ? p.paperValueUsd.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })
                    : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </DeskShell>
  );
}
