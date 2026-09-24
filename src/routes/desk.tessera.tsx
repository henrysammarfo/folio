import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AssetLogo } from "@/components/asset-logo";
import { BuyExecuteButton } from "@/components/buy-execute-button";
import { DeskShell } from "@/components/desk-shell";
import { getTesseraBundle } from "@/lib/desk.functions";
import { humanizeHonestyNote, humanizeWashNote } from "@/lib/humanize-copy";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/desk/tessera")({
  head: () => ({
    meta: siteMeta({
      title: "Tessera T-tokens — FOLIO",
      description:
        "OpenAI, Kalshi, SpaceX Tessera T-tokens — quote and buy inside FOLIO on Solana.",
      path: "/desk/tessera",
    }),
  }),
  loader: async () => getTesseraBundle({ data: { spendUsdc: 1 } }),
  component: Page,
});

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function shortVal(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return money(n);
}

function Page() {
  const initial = Route.useLoaderData();
  const fetchTessera = useServerFn(getTesseraBundle);
  const [symbol, setSymbol] = useState(initial.selected?.symbol ?? "T-OpenAI");
  const [amount, setAmount] = useState("1");
  const [err, setErr] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
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
  const broadcastPaused = data?.broadcastPaused !== false;
  const canBuy = Boolean(
    ready && data?.jupiter.ok && data.washOk && selected?.mint,
  );

  return (
    <DeskShell title="Tessera">
      <section className="fx-page fx-preipo">
        <header className="fx-preipo-hero">
          <p className="fx-hero-kicker">Tessera T-tokens</p>
          <h1>SpaceX, OpenAI, Kalshi — loan-participation quotes.</h1>
          <p className="fx-sub">
            Stocklana Tessera bounty — loan-participation quotes for SpaceX,
            OpenAI, Kalshi. Confirm buys inside FOLIO — no Tessera app hop.{" "}
            <Link to="/desk/preipo">PreStocks desk →</Link>
          </p>
        </header>

        <div className="fx-preipo-grid">
          <div className="fx-card">
            <h2>T-tokens</h2>
            {!data?.catalog.ok ? (
              <p className="fx-checks">
                {data?.catalog && !data.catalog.ok
                  ? humanizeHonestyNote(data.catalog.reason)
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
                        onClick={() => {
                          setSymbol(row.symbol);
                          setErr(null);
                          setLastSig(null);
                        }}
                      >
                        <AssetLogo symbol={row.symbol} size={36} />
                        <span>
                          <strong>{row.symbol}</strong>
                          <small>
                            {row.sector ?? "—"}
                            {row.markPrice != null
                              ? ` · ${money(row.markPrice)}`
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
              <AssetLogo symbol={selected?.symbol ?? "T-"} size={44} />
              <div>
                <p className="fx-hero-kicker">Buy in FOLIO</p>
                <h2>USDC → {selected?.symbol ?? "—"}</h2>
              </div>
            </div>
            <p className="fx-ticket-sub">
              {selected?.name ?? "Select a T-token"}
              {selected?.holders != null
                ? ` · ${selected.holders.toLocaleString()} holders`
                : ""}
            </p>
            {selected ? (
              <dl className="fx-preipo-marks">
                <div>
                  <dt>Mark</dt>
                  <dd>
                    {selected.markPrice != null
                      ? money(selected.markPrice)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Mark val</dt>
                  <dd>
                    {selected.markValuation != null
                      ? shortVal(selected.markValuation)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Sector</dt>
                  <dd>{selected.sector ?? "—"}</dd>
                </div>
                <div>
                  <dt>Holders</dt>
                  <dd>
                    {selected.holders != null
                      ? selected.holders.toLocaleString()
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
              Wash:{" "}
              {data?.washOk
                ? "clear"
                : humanizeWashNote(data?.washNote)}
              {" · "}
              {humanizeHonestyNote(data?.note)}
            </p>
            {err ? <p className="fx-checks" role="alert">{err}</p> : null}
            {lastSig ? (
              <p className="fx-checks">
                Landed ·{" "}
                <a
                  href={`https://solscan.io/tx/${lastSig}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  view on Solscan
                </a>
              </p>
            ) : null}
            <BuyExecuteButton
              canBuy={canBuy}
              isPair={false}
              broadcastPaused={broadcastPaused}
              symbol={selected?.symbol ?? "T-"}
              paySymbol="USDC"
              amount={spendUsdc}
              slippageBps={100}
              outputMint={selected?.mint}
              outputDecimals={data?.assumedDecimals ?? 9}
              pausedLabel="Quote ready — fills paused"
              confirmLabel={`Buy ${selected?.symbol ?? "T-token"}`}
              onError={setErr}
              onSuccess={(sig) => {
                setLastSig(sig);
                setErr(null);
                void refetch();
              }}
            />
            <button
              type="button"
              className="fx-btn fx-btn-ghost fx-btn-block"
              style={{ marginTop: "0.5rem" }}
              disabled={!ready}
              onClick={() => void refetch()}
            >
              Refresh quote
            </button>
          </aside>
        </div>
      </section>
    </DeskShell>
  );
}
