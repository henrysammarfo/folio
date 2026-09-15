import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { getCreditBundle, getPositionsBundle } from "@/lib/desk.functions";

const deskSearchSchema = z.object({
  /** Ephemeral mainnet-read inspect pubkey — not auth, not persisted. */
  inspect: z.string().max(64).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/")({
  head: () => ({
    meta: [
      { title: "Prime Desk — FOLIO" },
      { name: "description", content: "Live-labeled xStock desk overview." },
    ],
  }),
  validateSearch: (search) => deskSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ inspect: search.inspect }),
  /** Prefetch overview bundles so qty/credit honesty paints on first load. */
  loader: async ({ deps }) => {
    const [positions, credit] = await Promise.all([
      getPositionsBundle({ data: { inspectWallet: deps.inspect } }),
      getCreditBundle({ data: { inspectWallet: deps.inspect } }),
    ]);
    return { positions, credit };
  },
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const { inspect } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchPositions = useServerFn(getPositionsBundle);
  const fetchCredit = useServerFn(getCreditBundle);
  const [inspectInput, setInspectInput] = useState(inspect ?? "");
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
  const verified = rows.filter((r) => r.health === "Verified").length;
  const paperValue = rows.reduce((s, r) => s + (r.paperValueUsd ?? 0), 0);
  const walletRead = rows.some((r) => r.qtySource === "wallet-read");
  const creditLabel = credit.data?.paper.label === "wallet-read" ? "wallet-read" : "paper";
  const walletSource = positions.data?.walletSource ?? credit.data?.walletSource ?? null;

  return (
    <DeskShell eyebrow="Portfolio command" title="Prime desk">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Live marks</ModeBadge>
        <ModeBadge mode={walletRead ? "mainnet-read" : "paper"}>
          {walletRead ? "Wallet-read qty" : "Paper qty"}
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
              ? "Watch-wallet bound"
              : walletSource === "inspect"
                ? "Inspect (ephemeral)"
                : "Wallet unbound"}
        </ModeBadge>
        <ModeBadge mode="quote-only">Broadcast off</ModeBadge>
      </div>

      <Panel
        title="Inspect wallet (ephemeral)"
        meta={
          <StatusBadge tone={walletSource === "inspect" ? "green" : "neutral"}>
            {walletSource === "inspect" ? "Inspect active" : "No cookie"}
          </StatusBadge>
        }
      >
        <p className="mb-3 text-sm opacity-80">
          Mainnet-read overview qty + illustrative credit for a pubkey without a watch-wallet
          cookie or Privy session. Useful on Vercel before <code>FOLIO_SESSION_SECRET</code>{" "}
          lands. Inspect is <b>not</b> multi-tenant auth — and broadcast stays off.
        </p>
        <div className="form-grid">
          <label>
            Wallet pubkey
            <input
              value={inspectInput}
              onChange={(e) => setInspectInput(e.target.value)}
              placeholder="Base58 pubkey"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            className="wallet-pill"
            disabled={!inspectInput.trim()}
            onClick={() => {
              const next = inspectInput.trim();
              void navigate({
                search: (prev) => ({ ...prev, inspect: next || undefined }),
              });
            }}
          >
            Inspect
          </button>
          <button
            type="button"
            className="wallet-pill"
            disabled={!inspect}
            onClick={() => {
              setInspectInput("");
              void navigate({
                search: (prev) => {
                  const { inspect: _drop, ...rest } = prev as { inspect?: string };
                  return rest;
                },
              });
            }}
          >
            Clear inspect
          </button>
        </div>
        <p className="mt-3 text-sm opacity-70">
          Same <code>?inspect=</code> flows on{" "}
          <Link to="/desk/positions" search={inspect ? { inspect } : {}}>
            Positions
          </Link>{" "}
          and{" "}
          <Link to="/desk/credit" search={inspect ? { inspect } : {}}>
            Credit
          </Link>
          .
        </p>
      </Panel>

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
            {creditLabel === "wallet-read"
              ? "Wallet-read × live Kamino LTV"
              : "Paper × live Kamino LTV"}
          </small>
        </div>
      </div>
      <div className="desk-grid">
        <Panel
          title="Economic positions"
          meta={<StatusBadge tone="green">{verified} verified</StatusBadge>}
        >
          <div className="position-list">
            {rows.map((p) => (
              <Link
                key={p.symbol}
                to="/desk/positions/$symbol"
                params={{ symbol: p.symbol }}
                search={inspect ? { inspect } : {}}
              >
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
                    ? p.paperValueUsd.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
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
              <b>
                {(() => {
                  const aapl = rows.find((r) => r.symbol === "AAPLx") ?? rows[0];
                  if (!aapl || aapl.multiplier == null) return "Multiplier unavailable";
                  if (aapl.pendingMultiplier != null) {
                    return `Pending ${aapl.pendingMultiplier.toFixed(6)}×`;
                  }
                  return "Live · no pending";
                })()}
              </b>
            </p>
            <p>
              <span>Kamino market</span>
              <b>{credit.data?.kamino.ok ? "Mainnet read" : "Unavailable"}</b>
            </p>
            <p>
              <span>Nest.credit</span>
              <b>
                {credit.data?.nestCredit.ok
                  ? `${credit.data.nestCredit.data.vaultCount} vaults · not NestUSD`
                  : "Unavailable"}
              </b>
            </p>
            <p>
              <span>NestUSD borrow</span>
              <b>Fail-closed</b>
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
