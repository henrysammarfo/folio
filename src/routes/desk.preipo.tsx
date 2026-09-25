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
      title: "Pre-IPO · PreStocks — FOLIO",
      description:
        "Live PreStocks pre-IPO catalog with Jupiter buys inside FOLIO on Solana.",
      path: "/desk/preipo",
    }),
  }),
  loader: async () =>
    getPreipoBundle({
      data: { spendUsdc: 1, paySymbol: "USDC", side: "buy" },
    }),
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
  const [symbol, setSymbol] = useState(initial.selected?.symbol ?? "OPENAI");
  const [pay, setPay] = useState<"USDC" | "USDT">("USDC");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("1");
  const [err, setErr] = useState<string | null>(null);
  const [lastSig, setLastSig] = useState<string | null>(null);
  const spendUsdc = Number(amount);
  const ready = Number.isFinite(spendUsdc) && spendUsdc > 0 && spendUsdc <= 25;

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["preipo", symbol, spendUsdc, pay, side],
    queryFn: () =>
      fetchPreipo({
        data: { symbol, spendUsdc, paySymbol: pay, side },
      }),
    enabled: ready,
    initialData:
      symbol === (initial.selected?.symbol ?? "OPENAI") &&
      spendUsdc === 1 &&
      pay === "USDC" &&
      side === "buy"
        ? initial
        : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
  });

  const rows = data?.catalog.ok ? data.catalog.data.rows : [];
  const partnerOptions: TokenOption[] = useMemo(
    () =>
      rows.map((r) => {
        const opt: TokenOption = {
          symbol: r.symbol,
          name: r.name,
          kind: "partner",
        };
        if (r.image) opt.logo = r.image;
        return opt;
      }),
    [rows],
  );
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
  const broadcastPaused = data?.broadcastPaused !== false;
  const canBuy = Boolean(
    ready && data?.jupiter.ok && data.washOk && selected?.mint,
  );

  const payLeg = side === "buy" ? pay : symbol;
  const receiveLeg = side === "buy" ? symbol : pay;

  function flip() {
    setSide((s) => (s === "buy" ? "sell" : "buy"));
    setErr(null);
  }

  return (
    <DeskShell title="Pre-IPO">
      <section className="fx-page fx-preipo">
        <header className="fx-preipo-hero">
          <p className="fx-hero-kicker">PreStocks</p>
          <h1>Private names. Honest desk.</h1>
          <p className="fx-sub">
            SPV-backed exposure — search, flip, confirm inside FOLIO. Tessera
            T-tokens stay on their own desk.{" "}
            <Link to="/desk/tessera">Tessera desk →</Link>
          </p>
        </header>

        <div className="fx-preipo-grid">
          <div className="fx-card fx-partner-ticket">
            <h2>Ticket</h2>
            <div className="fx-swap-leg">
              <span>{side === "buy" ? "You pay" : "You sell"}</span>
              <div className="fx-swap-row">
                <input
                  className="fx-swap-amt"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErr(null);
                  }}
                  aria-label="Amount"
                />
                {side === "buy" ? (
                  <TokenSelectButton
                    value={pay}
                    allowUsdc
                    allowXstocks={false}
                    onChange={(s) => {
                      if (s === "USDC" || s === "USDT") setPay(s);
                    }}
                    aria-label="Pay stable"
                  />
                ) : (
                  <TokenSelectButton
                    value={symbol}
                    allowUsdc={false}
                    allowXstocks={false}
                    extraOptions={partnerOptions}
                    onChange={setSymbol}
                    aria-label="Sell PreStock"
                  />
                )}
              </div>
            </div>

            <button
              type="button"
              className="fx-swap-mid"
              onClick={flip}
              aria-label="Flip pay and receive"
            >
              <ArrowDownUp size={18} strokeWidth={2} />
            </button>

            <div className="fx-swap-leg">
              <span>You receive</span>
              <div className="fx-swap-row">
                <p className="fx-swap-out-line" style={{ margin: 0, flex: 1 }}>
                  {out ? (
                    <>
                      <b>{out}</b> {receiveLeg}
                    </>
                  ) : (
                    <span className="fx-muted">Quote pending</span>
                  )}
                </p>
                {side === "buy" ? (
                  <TokenSelectButton
                    value={symbol}
                    allowUsdc={false}
                    allowXstocks={false}
                    extraOptions={partnerOptions}
                    onChange={setSymbol}
                    aria-label="Receive PreStock"
                  />
                ) : (
                  <TokenSelectButton
                    value={pay}
                    allowUsdc
                    allowXstocks={false}
                    onChange={(s) => {
                      if (s === "USDC" || s === "USDT") setPay(s);
                    }}
                    aria-label="Receive stable"
                  />
                )}
              </div>
            </div>

            <p className="fx-checks">
              {isFetching ? "Refreshing…" : data?.note ?? "—"}
            </p>
            <p className="fx-checks">
              {data?.washOk
                ? "Wash clear"
                : humanizeWashNote(data?.washNote ?? "Wash pending")}
            </p>
            {err ? <p className="fx-checks fx-err">{err}</p> : null}
            {lastSig ? (
              <p className="fx-checks">
                Last sig{" "}
                <a
                  href={`https://solscan.io/tx/${lastSig}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {lastSig.slice(0, 8)}…
                </a>
              </p>
            ) : null}

            <BuyExecuteButton
              canBuy={canBuy}
              isPair={false}
              broadcastPaused={broadcastPaused}
              symbol={selected?.symbol ?? "PRE"}
              paySymbol={side === "buy" ? pay : selected?.symbol ?? symbol}
              amount={spendUsdc}
              slippageBps={100}
              {...(side === "buy" && selected?.mint
                ? {
                    outputMint: selected.mint,
                    outputDecimals: data?.assumedDecimals ?? 9,
                  }
                : { outputDecimals: data?.assumedDecimals ?? 9 })}
              pausedLabel={
                !data?.washOk
                  ? "Paused — thin PreStock tape"
                  : "Quote ready — fills paused"
              }
              confirmLabel={
                side === "buy"
                  ? `Buy ${selected?.symbol ?? "PreStock"}`
                  : `Sell ${selected?.symbol ?? "PreStock"}`
              }
              onError={setErr}
              onSuccess={(sig) => setLastSig(sig)}
            />
            <button
              type="button"
              className="fx-btn fx-btn-ghost fx-btn-block"
              style={{ marginTop: "0.5rem" }}
              onClick={() => void refetch()}
            >
              Refresh quote
            </button>
          </div>

          <aside className="fx-card fx-ticket">
            <div className="fx-ticket-brand">
              <AssetLogo
                symbol={symbol}
                {...(selected?.image ? { logo: selected.image } : {})}
                size={44}
              />
              <div>
                <p className="fx-hero-kicker">
                  {side === "buy" ? "Buy in FOLIO" : "Sell in FOLIO"}
                </p>
                <h2>
                  {payLeg} → {receiveLeg}
                </h2>
              </div>
            </div>
            {selected ? (
              <>
                <p className="fx-ticket-sub">{selected.name}</p>
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
                    <dt>Premium</dt>
                    <dd>
                      {premium != null
                        ? `${premium >= 0 ? "+" : ""}${premium.toFixed(1)}%`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Impl</dt>
                    <dd>
                      {selected.impliedValuation != null
                        ? shortVal(selected.impliedValuation)
                        : selected.markValuation != null
                          ? shortVal(selected.markValuation)
                          : "—"}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="fx-checks">
                {data?.catalog && !data.catalog.ok
                  ? humanizeHonestyNote(data.catalog.reason)
                  : "Select a PreStock"}
              </p>
            )}
          </aside>
        </div>
      </section>
    </DeskShell>
  );
}
