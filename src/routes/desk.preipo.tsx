import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AssetLogo } from "@/components/asset-logo";
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

function money(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  });
}

function shortVal(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return money(n, 0);
}

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
  const premium =
    selected?.tokenPrice != null &&
    selected?.markPrice != null &&
    selected.markPrice > 0
      ? ((selected.tokenPrice - selected.markPrice) / selected.markPrice) * 100
      : null;

  return (
    <DeskShell title="Pre-IPO">
      <section className="fx-page fx-preipo">
        <header className="fx-preipo-hero">
          <p className="fx-hero-kicker">PreStocks only</p>
          <h1>Private companies. Live Solana quotes.</h1>
          <p className="fx-sub">
            Stocklana PreStocks bounty path — SPV-backed economic exposure, not
            Tessera T-tokens. Quote-only · fills paused.{" "}
            <Link to="/desk/tessera">Tessera desk →</Link>
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
                        <AssetLogo
                          symbol={row.symbol}
                          logo={row.image}
                          size={36}
                        />
                        <span>
                          <strong>{row.symbol}</strong>
                          <small>
                            {row.tokenPrice != null
                              ? `${money(row.tokenPrice)} token`
                              : "Mark pending"}
                            {row.impliedValuation != null
                              ? ` · ${shortVal(row.impliedValuation)} impl`
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
            <div className="fx-ticket-brand">
              <AssetLogo
                symbol={selected?.symbol ?? "—"}
                logo={selected?.image}
                size={44}
              />
              <div>
                <p className="fx-hero-kicker">Buy</p>
                <h2>USDC → {selected?.symbol ?? "—"}</h2>
              </div>
            </div>
            <p className="fx-ticket-sub">
              {selected?.name ?? "Select a PreStock"}
              {data?.note ? ` · ${data.note}` : ""}
            </p>
            {selected ? (
              <dl className="fx-preipo-marks">
                <div>
                  <dt>Token</dt>
                  <dd>
                    {selected.tokenPrice != null
                      ? money(selected.tokenPrice)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Mark</dt>
                  <dd>
                    {selected.markPrice != null
                      ? money(selected.markPrice)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>vs mark</dt>
                  <dd>
                    {premium != null
                      ? `${premium >= 0 ? "+" : ""}${premium.toFixed(1)}%`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Implied</dt>
                  <dd>
                    {selected.impliedValuation != null
                      ? shortVal(selected.impliedValuation)
                      : "—"}
                  </dd>
                </div>
              </dl>
            ) : null}
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
