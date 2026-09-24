import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownUp, ChevronDown, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AssetLogo } from "@/components/asset-logo";
import { BuyExecuteButton } from "@/components/buy-execute-button";
import { DeskShell } from "@/components/desk-shell";
import { TokenSelectButton } from "@/components/token-select-button";
import { TradingViewChart } from "@/components/tradingview-chart";
import { trackFolioEvent } from "@/lib/analytics";
import { getAcquireBundle } from "@/lib/desk.functions";
import {
  humanizeGateReason,
  humanizeHonestyNote,
} from "@/lib/humanize-copy";
import { siteMeta } from "@/lib/site-meta";
import {
  XSTOCK_CATALOG,
  XSTOCK_SWAP_PAIRS,
  catalogByLane,
  findCatalogItem,
  laneMeta,
  type XStockLane,
} from "@/lib/xstock-catalog";

const USDC_CHIPS = ["1", "5", "10", "25"] as const;
const PAIR_CHIPS = ["0.01", "0.05", "0.1", "0.25"] as const;
const SLIPPAGE_CHIPS = [
  { id: "50", label: "0.5%", bps: 50 },
  { id: "100", label: "1%", bps: 100 },
  { id: "200", label: "2%", bps: 200 },
] as const;

type Tab = XStockLane | "all" | "pairs";
type GasPref = "best" | "usdc" | "sol";

export const Route = createFileRoute("/desk/acquire")({
  head: () => ({
    meta: siteMeta({
      title: "Buy — FOLIO",
      description:
        "Buy xStocks with USDC or swap stock↔stock on Solana — mega, IPO, meme lanes.",
      path: "/desk/acquire",
    }),
  }),
  loader: async () =>
    getAcquireBundle({ data: { symbol: "AAPLx", spendUsdc: 1 } }),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const [tab, setTab] = useState<Tab>("all");
  const [receive, setReceive] = useState("AAPLx");
  const [pay, setPay] = useState<"USDC" | string>("USDC");
  const [amount, setAmount] = useState("1");
  const [query, setQuery] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [slippageBps, setSlippageBps] = useState(50);
  const [gasPref, setGasPref] = useState<GasPref>("best");
  const [fillSig, setFillSig] = useState<string | null>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  const isPair = pay !== "USDC";
  const payAmount = Number(amount);
  const ready =
    Number.isFinite(payAmount) && payAmount > 0 && payAmount <= 25;
  const selected = findCatalogItem(receive) ?? XSTOCK_CATALOG[0]!;
  const payItem = isPair ? findCatalogItem(pay) : null;
  const meta = laneMeta(tab);

  const filtered = useMemo(() => {
    if (tab === "pairs") return catalogByLane("all");
    const base = catalogByLane(tab === "all" ? "all" : tab);
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.underlying.toLowerCase().includes(q),
    );
  }, [query, tab]);

  const pairGroups = useMemo(() => {
    const groups: Record<string, typeof XSTOCK_SWAP_PAIRS> = {
      mega: [],
      ipo: [],
      meme: [],
      cross: [],
    };
    for (const p of XSTOCK_SWAP_PAIRS) {
      groups[p.group] = [...(groups[p.group] ?? []), p];
    }
    return groups;
  }, []);

  const fetchAcquire = useServerFn(getAcquireBundle);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["acquire", receive, pay, payAmount],
    queryFn: () =>
      fetchAcquire({
        data: isPair
          ? { symbol: receive, paySymbol: pay, amount: payAmount }
          : { symbol: receive, spendUsdc: payAmount },
      }),
    enabled: ready && Boolean(selected?.buyable !== false || isPair),
    initialData:
      receive === "AAPLx" && pay === "USDC" && payAmount === 1
        ? initial
        : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
  });

  const out = data?.jupiter.ok ? data.jupiter.data.outUiAmount.toFixed(6) : null;
  const impactPct =
    data?.jupiter.ok && data.jupiter.data.priceImpactPct != null
      ? Number(data.jupiter.data.priceImpactPct)
      : null;
  const routeHops = data?.jupiter.ok ? data.jupiter.data.routePlanLength : null;
  const canBuy =
    Boolean(data?.gates.canReview) &&
    !isFetching &&
    ready &&
    !honeypot.trim() &&
    Boolean(selected?.buyable) &&
    (!isPair || Boolean(payItem?.buyable));

  const scaledStatus =
    data?.scaledUiCompare.status === "match"
      ? "Match"
      : data?.scaledUiCompare.status === "mismatch"
        ? "Mismatch"
        : "Pending";

  const checkLines = [
    ...(data?.gates.blockedReasons ?? []).map(humanizeGateReason),
    ...(data?.gates.honestyNotes ?? []).map(humanizeHonestyNote),
    !selected?.buyable
      ? selected?.blurb ?? "Watchlist only — mint not confirmed"
      : null,
    isPair && !payItem?.buyable
      ? "Pay side is watchlist-only — cannot size a stock↔stock quote"
      : null,
  ].filter(Boolean) as string[];

  function pickReceive(symbol: string) {
    setReceive(symbol);
    setReviewed(false);
    setErr(null);
    if (pay === symbol) setPay("USDC");
  }

  function applyPair(paySym: string, recvSym: string) {
    setTab("pairs");
    setPay(paySym);
    setReceive(recvSym);
    setAmount("0.01");
    setReviewed(false);
    setErr(null);
  }

  function flipPair() {
    if (isPair) {
      const nextPay = receive;
      const nextRecv = pay;
      setPay(nextPay);
      setReceive(nextRecv);
      setReviewed(false);
      setErr(null);
      return;
    }
    // USDC → stock: flip into stock↔stock with this stock as pay
    const stock = receive;
    const other =
      XSTOCK_CATALOG.find((i) => i.buyable && i.symbol !== stock)?.symbol ??
      "MSFTx";
    setTab("pairs");
    setPay(stock);
    setReceive(other);
    setAmount("0.01");
    setReviewed(false);
    setErr(null);
  }

  function onPayToken(sym: string) {
    if (sym.toUpperCase() === "USDC") {
      setPay("USDC");
      setAmount((a) => (Number(a) <= 0.25 ? "1" : a));
      if (tab === "pairs") setTab("all");
    } else {
      setPay(sym);
      setTab("pairs");
      if (receive === sym) {
        const other =
          XSTOCK_CATALOG.find((i) => i.buyable && i.symbol !== sym)?.symbol ??
          "AAPLx";
        setReceive(other);
      }
      setAmount((a) => (Number(a) >= 1 ? "0.01" : a));
    }
    setReviewed(false);
    setErr(null);
  }

  function onReceiveToken(sym: string) {
    if (sym.toUpperCase() === "USDC") return;
    pickReceive(sym);
    if (pay === sym) setPay("USDC");
  }

  return (
    <DeskShell title="Buy">
      <section className="fx-buy fx-page">
        <div className="fx-buy-stack">
          <div className="fx-card fx-buy-chart">
            <div className="fx-buy-chart-stage">
              <TradingViewChart
                symbol={receive}
                height={380}
                interval="60"
                theme="light"
                hideAttr
              />
              <div className="fx-buy-chart-mark" aria-hidden>
                <img src="/folio-mark.svg" alt="" />
                <span>FOLIO</span>
              </div>
            </div>
          </div>

          <div className="fx-card fx-picker">
            <div className="fx-picker-head">
              <h2>Markets</h2>
              <input
                className="fx-picker-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search AAPL, GME, Arm…"
                aria-label="Search tokenized stocks"
                disabled={tab === "pairs"}
              />
            </div>

            <div className="fx-lane-row" role="tablist" aria-label="Market lane">
              {(
                [
                  ["all", "All"],
                  ["mega", "Mega"],
                  ["ipo", "IPO"],
                  ["meme", "Meme"],
                  ["pairs", "Pairs"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={`fx-lane${tab === id ? " is-on" : ""}`}
                  onClick={() => {
                    setTab(id);
                    if (id === "pairs" && pay === "USDC") {
                      setPay("AAPLx");
                      setReceive("MSFTx");
                      setAmount("0.01");
                    }
                    if (id !== "pairs" && pay !== "USDC") {
                      setPay("USDC");
                      setAmount("1");
                    }
                  }}
                >
                  {label}
                </button>
              ))}
              <Link
                to="/desk/preipo"
                className="fx-lane fx-lane-link"
                title="PreStocks Pre-IPO desk"
              >
                Pre-IPO
              </Link>
              <Link
                to="/desk/tessera"
                className="fx-lane fx-lane-link"
                title="Tessera T-token desk"
              >
                Tessera
              </Link>
            </div>

            <div className="fx-lane-explain">
              <strong>{meta.title}</strong>
              <p>{meta.body}</p>
              <p className="fx-lane-links">
                Private pre-IPO?{" "}
                <Link to="/desk/preipo">PreStocks</Link>
                {" · "}
                <Link to="/desk/tessera">Tessera</Link>
                {" · "}
                <Link to="/desk/markets">All markets</Link>
              </p>
            </div>

            {tab === "pairs" ? (
              <div className="fx-pair-board">
                {(
                  [
                    ["mega", "Mega rotations"],
                    ["ipo", "IPO ↔ mega"],
                    ["meme", "Meme ↔ mega"],
                    ["cross", "Cross-lane"],
                  ] as const
                ).map(([group, title]) => (
                  <div key={group} className="fx-pair-group">
                    <h3>{title}</h3>
                    <ul>
                      {(pairGroups[group] ?? []).map((p) => {
                        const on = pay === p.pay && receive === p.receive;
                        return (
                          <li key={`${p.pay}-${p.receive}`}>
                            <button
                              type="button"
                              className={`fx-pair-card${on ? " is-on" : ""}`}
                              onClick={() => applyPair(p.pay, p.receive)}
                            >
                              <span className="fx-pair-card-title">{p.label}</span>
                              <span className="fx-pair-card-blurb">{p.blurb}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul
                className="fx-picker-grid"
                role="listbox"
                aria-label="Tokenized stocks"
              >
                {filtered.map((item) => {
                  const on = item.symbol === receive;
                  return (
                    <li key={item.symbol}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={on}
                        className={`fx-picker-item${on ? " is-on" : ""}${
                          !item.buyable ? " is-watch" : ""
                        }`}
                        onClick={() => pickReceive(item.symbol)}
                      >
                        <AssetLogo
                          symbol={item.symbol}
                          underlying={item.underlying}
                          size={36}
                        />
                        <span className="fx-picker-copy">
                          <strong>{item.underlying}</strong>
                          <small>
                            {item.symbol}
                            {item.lane !== "mega" ? ` · ${item.lane}` : ""}
                            {!item.buyable ? " · watch" : ""}
                          </small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {tab !== "pairs" && filtered.length === 0 ? (
              <p className="fx-ticket-sub" style={{ padding: "0 1rem 1rem" }}>
                No matches in this lane.
              </p>
            ) : null}
          </div>
        </div>

        <aside className="fx-card fx-ticket">
          <div className="fx-ticket-top">
            <div>
              <p className="fx-hero-kicker">
                {isPair ? "Stock ↔ stock" : "Swap"}
              </p>
              <h1>
                {isPair
                  ? `${pay} → ${selected.symbol}`
                  : `USDC → ${selected.symbol}`}
              </h1>
              <p className="fx-ticket-sub">
                {isPair
                  ? data && "broadcastPaused" in data && data.broadcastPaused === false
                    ? "True Jupiter pair route · user-signed fills"
                    : "True Jupiter pair route · fills arm when enabled"
                  : selected.blurb ??
                    (data && "broadcastPaused" in data && data.broadcastPaused === false
                      ? "Live Jupiter quote · confirm to fill"
                      : "Live Jupiter quote · fills arm when enabled")}
              </p>
            </div>
            <button
              type="button"
              className="fx-sheet-gear"
              aria-label="Swap settings"
              data-testid="acquire-settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={18} strokeWidth={2.1} />
            </button>
          </div>

          <div className="fx-mode-row" role="group" aria-label="Pay with">
            <button
              type="button"
              className={`fx-mode${pay === "USDC" ? " is-on" : ""}`}
              onClick={() => {
                setPay("USDC");
                setAmount("1");
                setTab(tab === "pairs" ? "all" : tab);
                setReviewed(false);
              }}
            >
              Pay USDC
            </button>
            <button
              type="button"
              className={`fx-mode${isPair ? " is-on" : ""}`}
              onClick={() => {
                setTab("pairs");
                setPay(receive === "AAPLx" ? "MSFTx" : "AAPLx");
                if (receive === "AAPLx") setReceive("MSFTx");
                setAmount("0.01");
                setReviewed(false);
              }}
            >
              Pay stock
            </button>
          </div>

          <div className="fx-swap">
            <div className="fx-swap-leg">
              <span>You pay</span>
              <div className="fx-swap-row">
                <TokenSelectButton
                  value={isPair ? pay : "USDC"}
                  allowUsdc
                  exclude={[receive]}
                  aria-label="Pay token"
                  onChange={onPayToken}
                />
                <input
                  className="fx-swap-amt"
                  value={amount}
                  inputMode="decimal"
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErr(null);
                    setReviewed(false);
                  }}
                  aria-label={isPair ? "Amount in pay stock" : "Amount in USDC"}
                />
              </div>
            </div>

            <button
              type="button"
              className="fx-swap-mid"
              aria-label="Flip pay and receive"
              onClick={flipPair}
            >
              <ArrowDownUp size={16} strokeWidth={2.2} />
            </button>

            <div className="fx-swap-leg">
              <span>You receive</span>
              <div className="fx-swap-row">
                <TokenSelectButton
                  value={selected.symbol}
                  allowUsdc={false}
                  exclude={isPair ? [pay] : []}
                  aria-label="Receive token"
                  onChange={onReceiveToken}
                />
                <b className="fx-swap-out">
                  {isFetching ? "…" : out ? out : "—"}
                </b>
              </div>
            </div>
          </div>

          <div className="fx-chip-row">
            {(isPair ? PAIR_CHIPS : USDC_CHIPS).map((c) => (
              <button
                key={c}
                type="button"
                className={`fx-chip${amount === c ? " is-on" : ""}`}
                onClick={() => {
                  setAmount(c);
                  setErr(null);
                  setReviewed(false);
                }}
              >
                {isPair ? c : `$${c}`}
              </button>
            ))}
          </div>

          <div className="fx-swap-sheet" data-testid="acquire-swap-sheet">
            <button
              type="button"
              className={`fx-swap-sheet-toggle${detailsOpen ? " is-open" : ""}`}
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((v) => !v)}
            >
              <span>Details</span>
              <em>
                {slippageBps / 100}% · paused
              </em>
              <ChevronDown size={16} strokeWidth={2.2} />
            </button>
            {detailsOpen ? (
              <dl className="fx-swap-sheet-body">
                <div>
                  <dt>Route</dt>
                  <dd>
                    {data?.jupiter.ok
                      ? `${data.jupiter.data.router ?? "Jupiter"}${data.jupiter.data.gasless ? " · gasless" : ""}`
                      : isFetching
                        ? "…"
                        : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Impact</dt>
                  <dd>
                    {impactPct != null && Number.isFinite(impactPct)
                      ? `${impactPct.toFixed(2)}%`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Gas</dt>
                  <dd>
                    {data?.jupiter.ok && data.jupiter.data.gasless
                      ? "Gasless path"
                      : gasPref === "usdc"
                        ? "USDC only"
                        : gasPref === "sol"
                          ? "SOL"
                          : "USDC + SOL"}
                  </dd>
                </div>
                <div>
                  <dt>Fill</dt>
                  <dd>
                    {data && "broadcastPaused" in data && data.broadcastPaused === false
                      ? "Armed · sign to execute"
                      : "Paused"}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>

          <label className="hp-field" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>

          {err ? <p className="fx-err">{err}</p> : null}

          {!selected?.buyable ? (
            <p className="fx-checks">
              Receive side is watchlist-only until the Backed mint is confirmed.
            </p>
          ) : null}

          {!reviewed ? (
            <button
              type="button"
              className="fx-btn fx-btn-primary fx-btn-block"
              data-testid="acquire-continue"
              disabled={!ready || !selected?.buyable}
              onClick={() => {
                if (!ready) {
                  setErr("Enter an amount greater than 0 (max 25).");
                  return;
                }
                if (!selected?.buyable) {
                  setErr("Receive side is watchlist-only.");
                  return;
                }
                if (isPair && !payItem?.buyable) {
                  setErr("Pay side is watchlist-only.");
                  return;
                }
                setErr(null);
                trackFolioEvent("buy_review", {
                  symbol: receive,
                  pair: isPair,
                  amount: payAmount,
                });
                void refetch().then(() => setReviewed(true));
              }}
            >
              Review quote
            </button>
          ) : (
            <div className="fx-review">
              <h2>Policy checks</h2>
              <ul>
                <li>
                  <span>Mode</span>
                  <b>{isPair ? "Stock ↔ stock" : "USDC buy"}</b>
                </li>
                <li>
                  <span>Share count</span>
                  <b>
                    {data?.gates.truthOk
                      ? data.multiplier.ok
                        ? `${data.multiplier.data.currentMultiplier.toFixed(4)}×`
                        : "OK"
                      : "Checking…"}
                  </b>
                </li>
                <li data-testid="acquire-scaled-ui-gate">
                  <span>On-chain check</span>
                  <b>{scaledStatus}</b>
                </li>
                <li>
                  <span>Route safety</span>
                  <b>
                    {data?.gates.washOk
                      ? "Clear"
                      : "Paused — tape check"}
                  </b>
                </li>
                <li>
                  <span>Ready to review</span>
                  <b>{data?.gates.canReview ? "Yes" : "Not yet"}</b>
                </li>
              </ul>
              {checkLines.length > 0 ? (
                <p className="fx-checks">{checkLines.join("\n")}</p>
              ) : null}
              {fillSig ? (
                <p className="fx-checks" data-testid="acquire-fill-sig">
                  Landed · {fillSig.slice(0, 8)}…{fillSig.slice(-6)}
                </p>
              ) : null}
              <BuyExecuteButton
                canBuy={Boolean(canBuy)}
                isPair={isPair}
                broadcastPaused={
                  !(
                    data &&
                    "broadcastPaused" in data &&
                    data.broadcastPaused === false
                  )
                }
                symbol={receive}
                paySymbol={isPair ? pay : "USDC"}
                amount={payAmount}
                slippageBps={slippageBps}
                onError={(msg) => setErr(msg || null)}
                onSuccess={(sig) => {
                  setFillSig(sig);
                  setErr(null);
                }}
              />
              <button
                type="button"
                className="fx-text-btn"
                onClick={() => {
                  setReviewed(false);
                  setFillSig(null);
                }}
              >
                Edit order
              </button>
            </div>
          )}

          <p className="fx-ticket-sub">
            Prefer credit? <Link to="/desk/credit">Borrow</Link>
            {" · "}
            <Link to="/desk/preipo">Pre-IPO</Link>
          </p>
        </aside>
      </section>

      {settingsOpen ? (
        <div
          className="fx-sheet-overlay"
          role="presentation"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="fx-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fx-sheet-title"
            data-testid="acquire-settings-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="fx-sheet-head">
              <h2 id="fx-sheet-title">Swap settings</h2>
              <button
                type="button"
                className="fx-sheet-close"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </header>

            <section className="fx-sheet-section">
              <h3>Slippage</h3>
              <div className="fx-chip-row">
                {SLIPPAGE_CHIPS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`fx-chip${slippageBps === c.bps ? " is-on" : ""}`}
                    onClick={() => setSlippageBps(c.bps)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="fx-sheet-section">
              <h3>Gas</h3>
              <div className="fx-gas-prefs" role="radiogroup" aria-label="Gas">
                {(
                  [
                    ["best", "Best", "USDC + SOL"],
                    ["usdc", "USDC only", "Gasless ≥~$10"],
                    ["sol", "SOL", "Pay gas in SOL"],
                  ] as const
                ).map(([id, title, blurb]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={gasPref === id}
                    className={`fx-gas-pref${gasPref === id ? " is-on" : ""}`}
                    onClick={() => setGasPref(id)}
                  >
                    <strong>{title}</strong>
                    <span>{blurb}</span>
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              className="fx-btn fx-btn-primary fx-btn-block"
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </DeskShell>
  );
}
