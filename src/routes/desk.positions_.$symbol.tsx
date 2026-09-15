import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getPositionsBundle } from "@/lib/desk.functions";

const detailSearchSchema = z.object({
  /** Ephemeral mainnet-read inspect pubkey — not auth, not persisted. */
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/positions_/$symbol")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol} — FOLIO` },
      { name: "description", content: `Live multiplier and paper economics for ${params.symbol}.` },
    ],
  }),
  validateSearch: (search) => detailSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  /** Prefetch so wallet-read vs paper qty label is honest on first paint (incl. ?inspect=). */
  loader: async ({ deps }) =>
    getPositionsBundle({
      data: { inspectWallet: deps.inspect },
    }),
  component: Page,
});

function Page() {
  const { symbol } = Route.useParams();
  const { inspect } = Route.useSearch();
  const initial = Route.useLoaderData();
  const fetchPositions = useServerFn(getPositionsBundle);
  const { data, isFetching } = useQuery({
    queryKey: ["positions-bundle", inspect ?? ""],
    queryFn: () =>
      fetchPositions({
        data: { inspectWallet: inspect },
      }),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });
  const row = data?.rows.find((r) => r.symbol.toLowerCase() === symbol.toLowerCase());
  const walletSource = data?.walletSource ?? null;

  return (
    <DeskShell
      eyebrow="Position detail"
      title={symbol}
      actions={
        <Link
          to="/desk/positions"
          search={inspect ? { inspect } : {}}
          className="text-sm underline"
        >
          All positions
        </Link>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Live multipliers</ModeBadge>
        <ModeBadge mode={row?.qtySource === "wallet-read" ? "mainnet-read" : "paper"}>
          {row?.qtySource === "wallet-read" ? "Wallet-read qty" : "Paper qty"}
        </ModeBadge>
        <ModeBadge
          mode={
            walletSource === "session" ||
            walletSource === "watch-wallet" ||
            walletSource === "inspect"
              ? "mainnet-read"
              : "unavailable"
          }
        >
          {walletSource === "session"
            ? "Session bound"
            : walletSource === "watch-wallet"
              ? "Watch-wallet"
              : walletSource === "inspect"
                ? "Inspect ephemeral"
                : "No wallet bind"}
        </ModeBadge>
      </div>
      <Panel
        title={row?.name ?? symbol}
        meta={
          <StatusBadge tone={isFetching ? "blue" : row?.qtySource === "wallet-read" ? "green" : "neutral"}>
            {isFetching ? "…" : row?.qtySource === "wallet-read" ? "Wallet-read" : "Paper"}
          </StatusBadge>
        }
      >
        {!row ? (
          <p>No live row for {symbol}. Open from the positions list.</p>
        ) : (
          <div className="policy-list">
            <p>
              <span>Display qty</span>
              <b>
                {row.qty.toFixed(4)}{" "}
                <small>({row.qtySource === "wallet-read" ? "wallet-read" : "paper"})</small>
              </b>
            </p>
            <p>
              <span>Paper raw (fallback)</span>
              <b>{row.paperRaw.toFixed(4)}</b>
            </p>
            <p>
              <span>API multiplier</span>
              <b>{row.multiplier != null ? `${row.multiplier.toFixed(6)}×` : "unavailable"}</b>
            </p>
            <p>
              <span>Pending corporate action</span>
              <b>
                {row.pendingMultiplier != null
                  ? `${row.pendingMultiplier.toFixed(6)}×`
                  : row.multiplier != null
                    ? "None on live feed"
                    : "unavailable"}
              </b>
            </p>
            <p>
              <span>On-chain effective</span>
              <b>
                {row.onchainEffectiveMultiplier != null
                  ? `${row.onchainEffectiveMultiplier.toFixed(6)}×`
                  : "unavailable"}
              </b>
            </p>
            <p>
              <span>Economic shares</span>
              <b>{row.economicShares != null ? row.economicShares.toFixed(6) : "—"}</b>
            </p>
            <p>
              <span>Venue USD</span>
              <b>
                {row.usdPrice != null
                  ? row.usdPrice.toLocaleString("en-US", { style: "currency", currency: "USD" })
                  : "—"}
              </b>
            </p>
            <p>
              <span>Paper value</span>
              <b>
                {row.paperValueUsd != null
                  ? row.paperValueUsd.toLocaleString("en-US", { style: "currency", currency: "USD" })
                  : "—"}
              </b>
            </p>
            <p>
              <span>Mint</span>
              <b className="font-mono text-xs">{row.mint ?? "—"}</b>
            </p>
            <p>
              <span>Labels</span>
              <b>{row.labels.join(" · ")}</b>
            </p>
            {walletSource === "inspect" ? (
              <p>
                <span>Inspect</span>
                <b className="font-mono text-xs">
                  ephemeral · not auth · not multi-tenant
                </b>
              </p>
            ) : null}
          </div>
        )}
      </Panel>
    </DeskShell>
  );
}
