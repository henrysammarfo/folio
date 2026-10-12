import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownUp } from "lucide-react";
import { useMemo, useState } from "react";
import { AssetLogo } from "@/components/asset-logo";
import { BuyExecuteButton } from "@/components/buy-execute-button";
import { DeskShell } from "@/components/desk-shell";
import {
  TokenSelectButton,
  type TokenOption,
} from "@/components/token-select-button";
import { getPreipoBundle } from "@/lib/desk.functions";
import { humanizeHonestyNote, humanizeWashNote } from "@/lib/humanize-copy";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/desk/preipo")({
  head: () => ({
    meta: siteMeta({
      title: "PreStocks · FOLIO",
      description:
        "Live PreStocks catalog with Jupiter buys inside FOLIO on Solana.",
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
  const [payStable, setPayStable] = useState<"USDC" | "USDT">("USDC");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("1");
  const [err, setErr] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0 && spendUsdc <= 25;

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["preipo", symbol, spendUsdc, payStable, side],
    queryFn: () =>
      fetchPreipo({
        data: { symbol, spendUsdc, paySymbol: payStable, side },
      }),
    enabled: ready,
    initialData:
      symbol === (initial.selected?.symbol ?? "OPENAI") &&
      spendUsdc === 1 &&
      payStable === "USDC" &&
      side === "buy"
        ? initial
        : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const rows = data?.catalog.ok ? data.catalog.data.rows : [];
  const selected = data?.selected;
  const partnerOptions: TokenOption[] = useMemo(
    () =>
      rows.map((row) => ({
        symbol: row.symbol,
        name: row.name ?? row.symbol,
        logo: row.image ?? null,
        kind: "partner" as const,
      })),
    [rows],
  );
  const out = data?.jupiter.ok
    ? data.jupiter.data.outUiAmount.toFixed(6)
    : null;
  const premium =
    selected?.tokenPrice != null &&
    selected?.markPrice != null &&
    selected.markPrice > 0
      ? ((selected.tokenPrice - selected.markPrice) / selected.markPrice) * 100
      : null;
  const broadcastPaused = data?.broadcastPaused !== false;
  const canBuy = Boolean(
    ready && data?.jupiter.ok && data.washOk && selected?.mint,
  );

  const paySym = side === "buy" ? payStable : (selected?.symbol ?? symbol);
  const recvSym = side === "buy" ? (selected?.symbol ?? symbol) : payStable;

  function pickSymbol(next: string) {
    setSymbol(next);
    setErr(null);
    setLastSig(null);
  }

  function flipTicket() {
    setSide((s) => (s === "buy" ? "sell" : "buy"));
    setAmount((a) => {
      const n = Number(a);
      if (!Number.isFinite(n)) return side === "buy" ? "0.01" : "1";
      return side === "buy" ? (n >= 1 ? "0.01" : a) : n < 0.5 ? "1" : a;
    });
    setErr(null);
    setLastSig(null);
  }

  function onPayToken(sym: string) {
    if (/^(USDC|USDT)$/i.test(sym)) {
      setPayStable(sym.toUpperCase() as "USDC" | "USDT");
      if (side === "sell") setSide("buy");
      setAmount((a) => (Number(a) <= 0.25 ? "1" : a));
    } else {
      pickSymbol(sym);
      if (side === "buy") setSide("sell");
      setAmount((a) => (Number(a) >= 1 ? "0.01" : a));
    }
    setErr(null);
    setLastSig(null);
  }

  function onRecvToken(sym: string) {
    if (/^(USDC|USDT)$/i.test(sym)) {
      setPayStable(sym.toUpperCase() as "USDC" | "USDT");
      if (side === "buy") setSide("sell");
      setAmount((a) => (Number(a) >= 1 ? "0.01" : a));
    } else {
      pickSymbol(sym);
      if (side === "sell") setSide("buy");
      setAmount((a) => (Number(a) <= 0.25 ? "1" : a));
    }
    setErr(null);
    setLastSig(null);
  }

  return (
    <DeskShell title="PreStocks">
      <section className="fx-page fx-preipo">
        <header className="fx-preipo-hero">
          <p className="fx-hero-kicker">PreStocks</p>
          <h1>Private companies. Live quotes.</h1>
          <p className="fx-sub">
            Pick from the catalog, size in USDC or USDT, confirm in FOLIO.{" "}
            <Link to="/desk/tessera">Tessera desk</Link>
          </p>
        </header>

        <div className="fx-preipo-grid">
          <div className="fx-card">
            <h2>Catalog</h2>
            {!data?.catalog.ok && isFetching ? (
              <ul
                className="fx-preipo-list"
                aria-busy="true"
                aria-label="Loading PreStocks"
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <li key={i} className="fx-skel-row">
                    <span className="netro-skel-face" />
                    <span className="netro-skel-lines">
                      <i />
                      <i />
                    </span>
                  </li>
                ))}
              </ul>
            ) : !data?.catalog.ok ? (
              <p className="fx-checks">
                {data?.catalog && !data.catalog.ok
                  ? humanizeHonestyNote(data.catalog.reason)
                  : "Catalog unavailable"}
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
                        onClick={() => pickSymbol(row.symbol)}
                      >
                        <AssetLogo
                          symbol={row.symbol}
                          logo={row.image ?? null}
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
                logo={selected?.image ?? null}
                size={44}
              />
              <div>
                <p className="fx-hero-kicker">
                  {side === "buy" ? "Buy in FOLIO" : "Sell in FOLIO"}
                </p>
                <h2>
                  {paySym} → {recvSym}
                </h2>
              </div>
            </div>
            <p className="fx-ticket-sub">
              {selected?.name ?? "Select a PreStock"}
              {data?.note ? ` · ${humanizeHonestyNote(data.note)}` : ""}
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

            <div className="fx-swap">
              <div className="fx-swap-leg">
                <span>You pay</span>
                <div className="fx-swap-row">
                  <TokenSelectButton
                    value={paySym}
                    allowUsdc
                    allowXstocks={false}
                    extraOptions={partnerOptions}
                    exclude={[recvSym]}
                    aria-label="Pay token"
                    onChange={onPayToken}
                  />
                  <input
                    className="fx-swap-amt"
                    value={amount}
                    inputMode="decimal"
                    onChange={(e) => setAmount(e.target.value)}
                    aria-label={
                      side === "buy"
                        ? `Amount in ${payStable}`
                        : `Amount in ${selected?.symbol ?? "token"}`
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                className="fx-swap-mid"
                aria-label="Flip pay and receive"
                onClick={flipTicket}
              >
                <ArrowDownUp size={16} strokeWidth={2.2} />
              </button>

              <div className="fx-swap-leg">
                <span>You receive</span>
                <div className="fx-swap-row">
                  <TokenSelectButton
                    value={recvSym}
                    allowUsdc={side === "sell"}
                    allowXstocks={false}
                    extraOptions={partnerOptions}
                    exclude={[paySym]}
                    aria-label="Receive token"
                    onChange={onRecvToken}
                  />
                  <b className="fx-swap-out">
                    {isFetching
                      ? "…"
                      : out
                        ? out
                        : "—"}
                  </b>
                </div>
              </div>
            </div>

            <div className="fx-chip-row">
              {(side === "buy" ? ["1", "5", "10", "25"] : ["0.01", "0.05", "0.1", "1"]).map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    className={`fx-chip${amount === c ? " is-on" : ""}`}
                    onClick={() => setAmount(c)}
                  >
                    {side === "buy" ? `$${c}` : c}
                  </button>
                ),
              )}
            </div>

            <p className="fx-checks">
              {data?.jupiter.ok
                ? `Live quote · ${spendUsdc} ${side === "buy" ? payStable : (selected?.symbol ?? "")}`
                : "Quote cooling. Refresh soon."}
              {" · "}
              Decimals labeled {data?.assumedDecimals ?? 9}
            </p>
            {!data?.washOk ? (
              <div className="fx-wash-banner" role="status">
                <strong>Size paused. Thin PreStock flow.</strong>
                {humanizeWashNote(data?.washNote)}. Quote stays live; we won’t
                invent a clear wash. Refresh after more trades land.
              </div>
            ) : (
              <p className="fx-checks">Wash clear</p>
            )}
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
              symbol={selected?.symbol ?? "PRE"}
              paySymbol={payStable}
              amount={spendUsdc}
              slippageBps={100}
              outputMint={selected?.mint ?? null}
              outputDecimals={data?.assumedDecimals ?? 9}
              side={side}
              pausedLabel={
                !data?.washOk
                  ? "Paused. Thin PreStock flow."
                  : "Quote ready. Fills paused."
              }
              confirmLabel={
                side === "buy"
                  ? `Buy ${selected?.symbol ?? "PreStock"}`
                  : `Sell ${selected?.symbol ?? "PreStock"}`
              }
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
