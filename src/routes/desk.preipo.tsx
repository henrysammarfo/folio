import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DeskShell } from "@/components/desk-shell";
import { getPreipoBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/desk/preipo")({
  head: () => ({
    meta: siteMeta({
      title: "Pre-IPO · PreStocks — FOLIO",
      description:
        "Live PreStocks pre-IPO catalog with Jupiter quote-only buys on Solana.",
      path: "/desk/preipo",
    }),
  }),
  loader: async () => getPreipoBundle({ data: { spendUsdc: 1 } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchPreipo = useServerFn(getPreipoBundle);
  const [symbol, setSymbol] = useState(
    initial.selected?.symbol ?? "OPENAI",
  );
  const [amount, setAmount] = useState("1");
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0 && spendUsdc <= 25;

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["preipo", symbol, spendUsdc],
    queryFn: () => fetchPreipo({ data: { symbol, spendUsdc } }),
    enabled: ready,
    initialData:
      symbol === (initial.selected?.symbol ?? "OPENAI") && spendUsdc === 1
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
    <DeskShell title="Pre-IPO">
      <section className="fx-page fx-preipo">
        <header className="fx-preipo-hero">
          <p className="fx-hero-kicker">PreStocks only</p>
          <h1>Private companies. Live Solana quotes.</h1>
          <p className="fx-sub">
            Stocklana PreStocks bounty path — this desk never mixes Tessera or
            other pre-IPO issuers. Quote-only · fills paused.{" "}
            <Link to="/desk/tessera">Tessera T-tokens →</Link>
          </p>
        </header>

        <div className="fx-preipo-grid">
          <div className="fx-card">
            <h2>Catalog</h2>
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
                        {row.image ? (
                          <img src={row.image} alt="" width={36} height={36} />
                        ) : (
                          <span className="fx-logo fx-logo-fallback" aria-hidden>
                            {row.symbol.slice(0, 1)}
                          </span>
                        )}
                        <span>
                          <strong>{row.symbol}</strong>
                          <small>
                            {row.tokenPrice != null
                              ? `$${row.tokenPrice.toFixed(2)} mark`
                              : "Mark pending"}
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
              {selected?.name ?? "Select a PreStock"}
              {data?.note ? ` · ${data.note}` : ""}
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
              Decimals assumed {data?.assumedDecimals ?? 9} (labeled)
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
            {selected?.externalUrl ? (
              <p className="fx-ticket-sub">
                <a href={selected.externalUrl} target="_blank" rel="noreferrer">
                  PreStocks page
                </a>
              </p>
            ) : null}
          </aside>
        </div>
      </section>
    </DeskShell>
  );
}
