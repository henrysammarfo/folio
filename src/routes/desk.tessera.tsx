import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DeskShell } from "@/components/desk-shell";
import { getTesseraBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/desk/tessera")({
  head: () => ({
    meta: siteMeta({
      title: "Tessera T-tokens — FOLIO",
      description:
        "OpenAI, Kalshi, SpaceX Tessera T-tokens with Jupiter quote-only on Solana.",
      path: "/desk/tessera",
    }),
  }),
  loader: async () => getTesseraBundle({ data: { spendUsdc: 1 } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchTessera = useServerFn(getTesseraBundle);
  const [symbol, setSymbol] = useState(initial.selected?.symbol ?? "T-OpenAI");
  const [amount, setAmount] = useState("1");
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0 && spendUsdc <= 25;

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["tessera", symbol, spendUsdc],
    queryFn: () => fetchTessera({ data: { symbol, spendUsdc } }),
    enabled: ready,
    initialData:
      symbol === (initial.selected?.symbol ?? "T-OpenAI") && spendUsdc === 1
        ? initial
        : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const rows = data?.catalog.ok ? data.catalog.data.rows : [];
  const selected = data?.selected;
  const out = data?.jupiter.ok
    ? data.jupiter.data.outUiAmount.toFixed(6)
    : null;

  return (
    <DeskShell title="Tessera">
      <section className="fx-page fx-preipo">
        <header className="fx-preipo-hero">
          <p className="fx-hero-kicker">Tessera T-tokens</p>
          <h1>SpaceX, OpenAI, Kalshi — permissionless quotes.</h1>
          <p className="fx-sub">
            Stocklana Tessera bounty path — kept separate from PreStocks so each
            track stays eligible. Quote-only · fills paused.{" "}
            <Link to="/desk/preipo">PreStocks desk →</Link>
          </p>
        </header>

        <div className="fx-preipo-grid">
          <div className="fx-card">
            <h2>T-tokens</h2>
            {!data?.catalog.ok ? (
              <p className="fx-checks">
                {data?.catalog && !data.catalog.ok
                  ? data.catalog.reason
                  : "Loading…"}
              </p>
            ) : (
              <ul className="fx-preipo-list">
                {rows.map((row) => {
                  const on = row.symbol === selected?.symbol;
                  return (
                    <li key={row.mint}>
                      <button
                        type="button"
                        className={`fx-preipo-item${on ? " is-on" : ""}`}
                        onClick={() => setSymbol(row.symbol)}
                      >
                        <span className="fx-logo fx-logo-fallback" aria-hidden>
                          {row.symbol.replace(/^T-?/i, "").slice(0, 2)}
                        </span>
                        <span>
                          <strong>{row.symbol}</strong>
                          <small>
                            {row.sector ?? "—"}
                            {row.markPrice != null
                              ? ` · $${row.markPrice.toFixed(2)}`
                              : ""}
                          </small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <aside className="fx-card fx-ticket">
            <p className="fx-hero-kicker">Buy</p>
            <h2>USDC → {selected?.symbol ?? "—"}</h2>
            <p className="fx-ticket-sub">
              {selected?.name ?? "Select a T-token"}
              {selected?.holders != null
                ? ` · ${selected.holders.toLocaleString()} holders`
                : ""}
            </p>
            <label className="fx-field">
              Amount (USDC)
              <input
                value={amount}
                inputMode="decimal"
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <p className="fx-swap-out-line">
              You receive{" "}
              <b>{isFetching ? "…" : out ? `${out} ${selected?.symbol}` : "—"}</b>
            </p>
            <p className="fx-checks">
              Wash: {data?.washOk ? "clear" : data?.washNote ?? "…"}
              {" · "}
              {data?.note}
            </p>
            <button
              type="button"
              className="fx-btn fx-btn-primary fx-btn-block"
              disabled={!ready || !data?.jupiter.ok}
              onClick={() => void refetch()}
            >
              {data?.jupiter.ok
                ? "Quote ready — fills paused"
                : "Refresh quote"}
            </button>
            <p className="fx-ticket-sub">
              <a
                href="https://app.tessera.pe"
                target="_blank"
                rel="noreferrer"
              >
                Tessera app
              </a>
            </p>
          </aside>
        </div>
      </section>
    </DeskShell>
  );
}
