/**
 * Desk-density canvas — layout/UX extracted from AbdullahBalfaqih/NetroBNB
 * (12-col: left 9 = profile 3 + stack 6 + full market; right 3 = quote + yellow AI).
 * Content + tokens are FOLIO stock-desk; no Binance/Netro brand clone.
 * Mounted on /desk overview only — never replaces Positions/Acquire routes.
 * Flow metrics prefer live /network matrix modes (never invent greens).
 * Optional paper-agent rail: live Block 0 spine · never broadcasts.
 * Depth: markets flow strip + AI modal overlay (Netro AskCoreAI pattern).
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { AssetLogo } from "@/components/asset-logo";
import { TradingViewChart } from "@/components/tradingview-chart";
import { runDeskAgent } from "@/lib/desk.functions";
import {
  NETRO_LIVE_GATE_DEFAULTS,
  type NetroLiveGateLabels,
} from "@/lib/netro-live-gates";
import type { NetroOwnershipSummary } from "@/lib/netro-ownership";
import { findCatalogItem } from "@/lib/xstock-catalog";
import {
  PartnerLanePanel,
  PartnerLaneTabs,
  type PartnerLaneId,
} from "@/components/partner-lane-panel";

type Props = {
  multiplierLabel: string;
  /** Live Empire gate labels from /network matrix — defaults are fail-closed. */
  gates?: NetroLiveGateLabels;
  /** Live positions honesty — paper vs wallet-read / inspect. */
  ownership?: NetroOwnershipSummary | null;
  /** Prefill from `/desk?inspect=` deep-link. */
  initialInspect?: string | undefined;
  /** Live API↔on-chain Scaled UI status for the market strip (never fake candles). */
  scaledUiStripLabel?: string;
  /** Desk overview only — lab stage stays decorative. */
  enablePaperAgent?: boolean;
};

const SHARE_TICKER = [
  "AAPLx",
  "TSLAx",
  "NVDAx",
  "GOOGLx",
  "AMZNx",
  "METAx",
  "MSCFx",
  "SPYx",
] as const;

const FLOW_SYMBOLS = [
  "AAPLx",
  "TSLAx",
  "NVDAx",
  "GOOGLx",
  "AMZNx",
  "METAx",
  "SPYx",
  "QQQx",
] as const;

/** Stagger ≈ NetroBNB framer staggerChildren 0.06s */
function delay(i: number): CSSProperties {
  return { ["--netro-delay" as string]: `${0.05 + i * 0.06}s` };
}

export function NetroDensityCanvas({
  multiplierLabel,
  gates = NETRO_LIVE_GATE_DEFAULTS,
  ownership = null,
  initialInspect = "",
  scaledUiStripLabel = "Scaled UI pending",
  enablePaperAgent = false,
}: Props) {
  const [clock, setClock] = useState({ h: "00", m: "00", s: "00" });
  const [railHeight, setRailHeight] = useState<number | undefined>();
  const [agentPrompt, setAgentPrompt] = useState("truth AAPLx");
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentReply, setAgentReply] = useState<string | null>(null);
  const [agentMeta, setAgentMeta] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [flowSymbol, setFlowSymbol] = useState<string>("AAPLx");
  const [spendChip, setSpendChip] = useState("1");
  const [partnerLane, setPartnerLane] = useState<PartnerLaneId>("stocks");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inspectInput, setInspectInput] = useState(initialInspect ?? "");
  const [ownershipOpen, setOwnershipOpen] = useState(Boolean(initialInspect));
  const runAgent = useServerFn(runDeskAgent);
  const navigate = useNavigate();

  const flowItem = findCatalogItem(flowSymbol);
  const flowUnderlying = flowItem?.underlying ?? flowSymbol.replace(/x$/i, "");
  /** Overview Jupiter quote is AAPLx @$1 — never relabel it as another symbol/size. */
  const quoteIsForFlow = flowSymbol === "AAPLx" && spendChip === "1";
  const quoteReceiveLabel = quoteIsForFlow
    ? gates.quoteOut
    : "Open Buy for live quote";
  const chartQuoteLabel = quoteIsForFlow ? gates.quoteOut : "—";

  useEffect(() => {
    setInspectInput(initialInspect ?? "");
    if (initialInspect) setOwnershipOpen(true);
  }, [initialInspect]);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock({
        h: String(n.getHours()).padStart(2, "0"),
        m: String(n.getMinutes()).padStart(2, "0"),
        s: String(n.getSeconds()).padStart(2, "0"),
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!aiModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAiModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [aiModalOpen]);

  // Sync yellow AI rail bottom to left column baseline (Netro AskCoreAI pattern)
  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined" || window.innerWidth < 1024) {
        setRailHeight(undefined);
        return;
      }
      const left = document.getElementById("netro-left-column");
      const rail = document.getElementById("netro-ai-rail");
      if (!left || !rail) return;
      const leftRect = left.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      const h = Math.round(leftRect.bottom - railRect.top);
      if (h > 240) setRailHeight(h);
    };
    update();
    const t1 = window.setTimeout(update, 150);
    const t2 = window.setTimeout(update, 600);
    const t3 = window.setTimeout(update, 1200);
    window.addEventListener("resize", update);
    const left = document.getElementById("netro-left-column");
    let ro: ResizeObserver | null = null;
    if (left && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(left);
    }
    return () => {
      window.removeEventListener("resize", update);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      ro?.disconnect();
    };
  }, [
    multiplierLabel,
    enablePaperAgent,
    agentReply,
    gates.quoteOut,
    gates.kaminoLtv,
    flowSymbol,
    sheetOpen,
    spendChip,
  ]);

  async function submitPaperAgent(prompt: string) {
    const trimmed = prompt.trim();
    if (!enablePaperAgent || !trimmed || agentBusy) return;
    setAgentBusy(true);
    setAgentMeta(null);
    try {
      const res = await runAgent({ data: { prompt: trimmed } });
      if (!res.ok) {
        setAgentReply(
          `${res.reason}${res.detail ? ` — ${res.detail}` : ""}`,
        );
        setAgentMeta(
          res.reason === "agent_requires_session"
            ? "Sign in on Account to ask"
            : "Live answers · trades paused",
        );
        return;
      }
      setAgentReply(res.data.reply);
      setAgentMeta("Live answers · trades paused");
    } catch (err) {
      setAgentReply(err instanceof Error ? err.message : "Agent call failed");
      setAgentMeta("Try again in a moment");
    } finally {
      setAgentBusy(false);
    }
  }

  function onAgentSubmit(e: FormEvent) {
    e.preventDefault();
    void submitPaperAgent(agentPrompt);
  }

  function onInspectSubmit(e: FormEvent) {
    e.preventDefault();
    const next = inspectInput.trim();
    if (!next) return;
    void navigate({
      to: "/desk",
      search: { inspect: next },
    });
  }

  function onInspectClear() {
    setInspectInput("");
    void navigate({
      to: "/desk",
      search: {},
    });
  }

  const tickerLoop = [...SHARE_TICKER, ...SHARE_TICKER];

  return (
    <div className="netro-density" data-testid="netro-density-surface">
      <header className="netro-density-title netro-density-item" style={delay(0)}>
        <div>
          <h3>Your desk</h3>
          <span>Buy · hold · borrow — live markets</span>
        </div>
        <div className="netro-density-chrome-actions">
          <Link to="/desk/acquire" className="netro-density-connect">
            Buy {flowSymbol}
          </Link>
        </div>
      </header>

      <div className="netro-density-ticker netro-density-item" style={delay(1)}>
        <div className="netro-density-ticker-fade netro-density-ticker-fade-l" />
        <div className="netro-density-ticker-fade netro-density-ticker-fade-r" />
        <div className="netro-density-ticker-track">
          {tickerLoop.map((sym, i) => (
            <span key={`${sym}-${i}`} className="netro-density-ticker-chip">
              {sym}
            </span>
          ))}
        </div>
      </div>

      {enablePaperAgent ? (
        <form
          className="netro-density-inspect netro-density-item"
          style={delay(2)}
          data-testid="netro-inspect-wallet"
          onSubmit={onInspectSubmit}
        >
          <div>
            <strong>Look up a wallet</strong>
            <span>See live share counts for any address</span>
          </div>
          <input
            value={inspectInput}
            onChange={(e) => setInspectInput(e.target.value)}
            placeholder="Paste wallet address"
            autoComplete="off"
            spellCheck={false}
            aria-label="Wallet address"
          />
          <button type="submit" disabled={!inspectInput.trim()}>
            Look up
          </button>
          {initialInspect ? (
            <button
              type="button"
              className="netro-density-inspect-clear"
              onClick={onInspectClear}
            >
              Clear
            </button>
          ) : (
            <Link to="/desk/settings" className="netro-density-inspect-bind">
              Connect wallet
            </Link>
          )}
          {initialInspect ? (
            <Link
              to="/desk/positions"
              search={{ inspect: initialInspect }}
              className="netro-density-inspect-bind"
            >
              Open positions
            </Link>
          ) : null}
        </form>
      ) : null}

      {enablePaperAgent && ownership ? (
        <details
          className="netro-density-collapse netro-density-item"
          style={delay(2.5)}
          data-testid="netro-ownership"
          open={ownershipOpen}
          onToggle={(e) =>
            setOwnershipOpen((e.target as HTMLDetailsElement).open)
          }
        >
          <summary>
            <span>Your holdings</span>
            <em>{ownershipOpen ? "Hide" : "Show"}</em>
          </summary>
          <section
            className="netro-density-ownership"
            aria-label="Your holdings"
          >
            <div className="netro-density-ownership-head">
              <div>
                <strong>Holdings</strong>
                <span>
                  {/no wallet/i.test(ownership.walletSourceLabel)
                    ? "Connect a wallet to see verified balances"
                    : "Live balances for this desk"}
                </span>
              </div>
              <div className="netro-density-ownership-pills">
                <em>{ownership.verifiedLabel}</em>
              </div>
            </div>
            <div className="netro-density-ownership-metrics">
              <div>
                <span>Total value</span>
                <b>{ownership.economicValueLabel}</b>
              </div>
              {ownership.rows.map((row) => (
                <div key={row.symbol} className="netro-density-own-row">
                  <AssetLogo symbol={row.symbol} size={28} />
                  <div>
                    <span>{row.symbol}</span>
                    <b>{row.qtyLabel.replace(/\bpaper\b/gi, "est.")}</b>
                    <small>{row.valueLabel}</small>
                  </div>
                </div>
              ))}
            </div>
            {/no wallet/i.test(ownership.walletSourceLabel) ? (
              <Link to="/desk/settings" className="netro-density-own-cta">
                Connect wallet to verify →
              </Link>
            ) : null}
          </section>
        </details>
      ) : null}

      <div className="netro-density-grid">
        <div id="netro-left-column" className="netro-density-left">
          <div className="netro-density-top">
            <div
              className="netro-density-profile netro-density-item"
              style={delay(3)}
            >
              <p className="netro-density-hi">Welcome</p>
              <div className="netro-density-profile-art" aria-hidden>
                <span className="netro-density-gear" />
                <span className="netro-density-gear netro-density-gear-inner" />
              </div>
              <h4>
                Trade
                <br />
                {flowSymbol}
              </h4>
              <div className="netro-density-clock">
                <span>{clock.h}</span>
                <em>:</em>
                <span>{clock.m}</span>
                <em>:</em>
                <span>{clock.s}</span>
              </div>
              <Link
                to="/desk/positions/$symbol"
                params={{ symbol: flowSymbol }}
                className="netro-density-cta"
              >
                Open {flowSymbol}
              </Link>
            </div>

            <div className="netro-density-stack">
              <div
                className="netro-density-flow netro-density-item"
                style={delay(4)}
                data-testid="netro-live-snapshot"
              >
                <div className="netro-density-flow-head">
                  <div>
                    <strong>{flowUnderlying}</strong>
                    <p>{flowSymbol}</p>
                  </div>
                  <span className="netro-density-flow-pill">Live</span>
                </div>
                <div
                  className="netro-density-metrics"
                  data-testid="netro-live-gates"
                >
                  <div>
                    <span>×</span>
                    <b>{multiplierLabel.replace(/\s*live$/i, "")}</b>
                  </div>
                  <div>
                    <span>Route</span>
                    <b>
                      {/live|clear|pass/i.test(gates.wash)
                        ? "Clear"
                        : "…"}
                    </b>
                  </div>
                  <div>
                    <span>Quote</span>
                    <b>Ready</b>
                  </div>
                  <div>
                    <span>LTV</span>
                    <b>{gates.kaminoLtv ? `${gates.kaminoLtv}` : "—"}</b>
                  </div>
                </div>
                <div
                  className="netro-density-signal"
                  data-testid="netro-signal-rail"
                  aria-label="Desk signal"
                >
                  <div className="netro-density-signal-gauge" aria-hidden>
                    <svg viewBox="0 0 120 64" role="presentation">
                      <path
                        d="M10 54 A50 50 0 0 1 110 54"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10 54 A50 50 0 0 1 110 54"
                        fill="none"
                        stroke="var(--netro-yellow,#0EA5C9)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${/live|clear|pass/i.test(gates.wash) ? 120 : 48} 160`}
                      />
                    </svg>
                    <strong>
                      {/live|clear|pass/i.test(gates.wash) ? "Clear" : "Watch"}
                    </strong>
                  </div>
                  <ul>
                    <li>
                      <span>Tape</span>
                      <b>
                        {/live|clear|pass/i.test(gates.wash)
                          ? "Clean"
                          : gates.wash || "…"}
                      </b>
                    </li>
                    <li>
                      <span>Share ×</span>
                      <b>{multiplierLabel.replace(/\s*live$/i, "")}</b>
                    </li>
                    <li>
                      <span>Borrow</span>
                      <b>
                        {gates.kaminoLtv
                          ? `${(Number(gates.kaminoLtv) * 100).toFixed(0)}% max`
                          : "—"}
                      </b>
                    </li>
                  </ul>
                </div>
                <div
                  className="netro-density-week"
                  data-testid="netro-session-week"
                  aria-label="Cash session week"
                >
                  <strong>Cash session</strong>
                  <div className="netro-density-week-grid">
                    {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map(
                      (d, i) => {
                        const weekend = i >= 5;
                        return (
                          <span
                            key={d}
                            className={`netro-density-week-cell${weekend ? " is-closed" : " is-open"}`}
                            title={
                              weekend
                                ? "Weekend — FOLIO refuses size"
                                : "Weekday — cash session when NYSE open"
                            }
                          >
                            {d}
                          </span>
                        );
                      },
                    )}
                  </div>
                  <small>
                    Weekend buys stay blocked in FOLIO — the curve cannot see the
                    bell.
                  </small>
                </div>
              </div>

              <div className="netro-density-row">
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(5)}
                >
                  <div className="netro-density-card-head">
                    <strong>Buy</strong>
                  </div>
                  <b>USDC → {flowSymbol}</b>
                  <small>
                    <Link to="/desk/acquire">Open →</Link>
                  </small>
                </div>
                <div
                  className="netro-density-card netro-density-card-dark netro-density-item"
                  style={delay(6)}
                >
                  <div className="netro-density-card-head">
                    <strong>Credit</strong>
                  </div>
                  <b>
                    {gates.kaminoLtv
                      ? `${(Number(gates.kaminoLtv) * 100).toFixed(0)}% LTV`
                      : "Borrow"}
                  </b>
                  <small>
                    <Link to="/desk/credit">Open →</Link>
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div
            className="netro-density-market netro-density-item"
            style={delay(9)}
            data-testid="netro-markets-flow"
          >
            <PartnerLaneTabs
              lane={partnerLane}
              onChange={setPartnerLane}
            />
            {partnerLane !== "stocks" ? (
              <PartnerLanePanel lane={partnerLane} />
            ) : (
              <>
            <div className="netro-density-market-bar">
              <strong>
                {flowUnderlying}
                <span className="netro-density-market-sym">{flowSymbol}</span>
              </strong>
              <div
                className="netro-density-market-tabs"
                role="tablist"
                aria-label="Symbols"
              >
                {FLOW_SYMBOLS.map((sym) => {
                  const on = sym === flowSymbol;
                  return (
                    <button
                      key={sym}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      className={`netro-density-market-tab${on ? " is-on" : ""}`}
                      onClick={() => setFlowSymbol(sym)}
                    >
                      {sym.replace(/x$/i, "")}
                    </button>
                  );
                })}
              </div>
              <Link to="/desk/markets" className="netro-density-market-all">
                All
              </Link>
              <em>{multiplierLabel.replace(/\s*live$/i, "")}</em>
            </div>
            <div
              className="netro-density-chart netro-density-chart-tv"
              data-testid="netro-truth-strip"
            >
              {/* NetroBNB CryptoMarketCard: light TV + dark brand watermark */}
              <div className="netro-density-chart-stage">
                <TradingViewChart
                  symbol={flowSymbol}
                  height={300}
                  interval="60"
                  theme="light"
                  hideAttr
                />
                <div className="netro-density-chart-mark" aria-hidden>
                  <img src="/folio-mark.svg" alt="" />
                  <span>FOLIO</span>
                </div>
              </div>
              <div
                className="netro-density-chart-stats"
                aria-label="Market stats"
              >
                <div>
                  <span>×</span>
                  <b>
                    {/match/i.test(scaledUiStripLabel) ? "Match" : "…"}
                  </b>
                </div>
                <div>
                  <span>Route</span>
                  <b>
                    {/live|clear|pass/i.test(gates.wash) ? "Clear" : "…"}
                  </b>
                </div>
                <div>
                  <span>Quote</span>
                  <b>{chartQuoteLabel}</b>
                </div>
                <div>
                  <span>LTV</span>
                  <b>{gates.kaminoLtv ? `${gates.kaminoLtv}` : "—"}</b>
                </div>
              </div>
              <div
                className="netro-density-flow-icons"
                role="listbox"
                aria-label="Symbols"
              >
                {FLOW_SYMBOLS.map((sym) => {
                  const item = findCatalogItem(sym);
                  const on = sym === flowSymbol;
                  return (
                    <button
                      key={sym}
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={`netro-density-flow-icon${on ? " is-on" : ""}`}
                      onClick={() => setFlowSymbol(sym)}
                      title={item?.name ?? sym}
                    >
                      <AssetLogo
                        symbol={sym}
                        {...(item?.underlying
                          ? { underlying: item.underlying }
                          : {})}
                        size={28}
                      />
                    </button>
                  );
                })}
                <Link to="/desk/markets" className="netro-density-flow-more">
                  All →
                </Link>
              </div>
              <span className="sr-only" data-testid="netro-scaled-ui-strip">
                {scaledUiStripLabel}
              </span>
            </div>
              </>
            )}
          </div>
        </div>

        <div id="netro-right-column" className="netro-density-right">
          <div
            className="netro-density-quote netro-density-item"
            style={delay(5)}
            data-testid="netro-buy-sheet"
          >
            <div className="netro-density-quote-head">
              <strong>Buy</strong>
              <span>USDC → {flowSymbol}</span>
            </div>
            <div
              className="netro-density-quote-pair"
              data-testid="netro-live-quote"
            >
              <div>
                <span>You pay</span>
                <b className="netro-density-quote-asset">
                  <AssetLogo symbol="USDC" size={22} />
                  USDC
                </b>
                <em>${spendChip}</em>
              </div>
              <div className="netro-density-quote-swap" aria-hidden>
                ↕
              </div>
              <div>
                <span>You receive</span>
                <b className="netro-density-quote-asset">
                  <AssetLogo
                    symbol={flowSymbol}
                    {...(flowItem?.underlying
                      ? { underlying: flowItem.underlying }
                      : {})}
                    size={22}
                  />
                  {flowSymbol}
                </b>
                <em>{quoteReceiveLabel}</em>
              </div>
            </div>
            <div className="netro-density-quote-chips" role="group" aria-label="Amount">
              {(["1", "5", "10", "25"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`netro-density-quote-chip${spendChip === c ? " is-on" : ""}`}
                  onClick={() => setSpendChip(c)}
                >
                  ${c}
                </button>
              ))}
            </div>
            <div className="netro-density-quote-sheet">
              <button
                type="button"
                className={`netro-density-quote-sheet-toggle${sheetOpen ? " is-open" : ""}`}
                aria-expanded={sheetOpen}
                data-testid="netro-buy-sheet-toggle"
                onClick={() => setSheetOpen((v) => !v)}
              >
                <span>Details</span>
                <em>0.5% · paused</em>
              </button>
              {sheetOpen ? (
                <dl className="netro-density-quote-sheet-body">
                  <div>
                    <dt>Route</dt>
                    <dd>
                      {/live|clear|pass/i.test(gates.wash) ? "Jupiter" : "…"}
                    </dd>
                  </div>
                  <div>
                    <dt>Gas</dt>
                    <dd>USDC + SOL</dd>
                  </div>
                  <div>
                    <dt>Fill</dt>
                    <dd>Paused</dd>
                  </div>
                </dl>
              ) : null}
            </div>
            <Link to="/desk/acquire" className="netro-density-quote-cta">
              Review buy
            </Link>
          </div>

          <aside
            id="netro-ai-rail"
            className="netro-density-rail netro-density-item"
            data-testid="netro-paper-agent"
            style={{
              ...delay(10),
              ...(railHeight
                ? { height: railHeight, maxHeight: railHeight }
                : undefined),
            }}
          >
            <div className="netro-density-rail-head">
              <span className="netro-density-rail-avatar">F</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="netro-density-rail-title">FOLIO agent</p>
                <p className="netro-density-rail-sub">Live desk intelligence</p>
                <div className="netro-density-rail-live" aria-label="Live gates">
                  <span
                    className={`netro-density-rail-chip${/live|match/i.test(multiplierLabel) ? " is-on" : ""}`}
                  >
                    × {multiplierLabel.replace(/\s*live$/i, "") || "…"}
                  </span>
                  <span
                    className={`netro-density-rail-chip${/live|clear|pass/i.test(gates.wash) ? " is-on" : ""}`}
                  >
                    {/live|clear|pass/i.test(gates.wash) ? "Wash clear" : "Wash…"}
                  </span>
                  <span className="netro-density-rail-chip is-on">
                    {flowSymbol}
                  </span>
                </div>
              </div>
              {enablePaperAgent ? (
                <button
                  type="button"
                  className="netro-density-rail-expand"
                  data-testid="netro-ai-expand"
                  onClick={() => setAiModalOpen(true)}
                  aria-label="Expand"
                >
                  ↗
                </button>
              ) : null}
            </div>
            <div className="netro-density-rail-welcome">
              {agentReply ? (
                <p>{agentReply}</p>
              ) : (
                <>
                  <div className="netro-density-rail-mark" aria-hidden>
                    F
                  </div>
                  <p className="netro-density-rail-hello">
                    Ask about {flowSymbol}
                  </p>
                </>
              )}
              {agentMeta ? (
                <small className="netro-density-rail-meta">{agentMeta}</small>
              ) : null}
            </div>
            {enablePaperAgent ? (
              <>
                <div className="netro-density-rail-actions">
                  <button
                    type="button"
                    disabled={agentBusy}
                    onClick={() => {
                      const p = `truth ${flowSymbol}`;
                      setAgentPrompt(p);
                      void submitPaperAgent(p);
                    }}
                  >
                    Share count
                    <em>Live ×</em>
                  </button>
                  <button
                    type="button"
                    disabled={agentBusy}
                    onClick={() => {
                      const p = `quote 1 USDC ${flowSymbol}`;
                      setAgentPrompt(p);
                      void submitPaperAgent(p);
                    }}
                  >
                    Get quote
                    <em>$1</em>
                  </button>
                </div>
                <form
                  className="netro-density-rail-form"
                  onSubmit={onAgentSubmit}
                >
                  <input
                    className="netro-density-rail-input"
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder={`Ask about ${flowSymbol}…`}
                    aria-label="Ask FOLIO agent"
                  />
                  <button
                    type="submit"
                    disabled={agentBusy || !agentPrompt.trim()}
                  >
                    {agentBusy ? "…" : "↑"}
                  </button>
                </form>
              </>
            ) : null}
          </aside>
        </div>
      </div>

      {aiModalOpen && enablePaperAgent ? (
        <div
          className="netro-ai-modal-overlay"
          role="presentation"
          onClick={() => setAiModalOpen(false)}
        >
          <div
            className="netro-ai-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="netro-ai-modal-title"
            data-testid="netro-ai-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="netro-ai-modal-head">
              <div>
                <p className="netro-density-rail-sub">Asset intelligence</p>
                <h2 id="netro-ai-modal-title">FOLIO agent</h2>
              </div>
              <button
                type="button"
                className="netro-ai-modal-close"
                aria-label="Close"
                onClick={() => setAiModalOpen(false)}
              >
                ✕
              </button>
            </header>
            <div className="netro-ai-modal-body">
              {agentReply ? (
                <p>{agentReply}</p>
              ) : (
                <>
                  <div className="netro-ai-modal-mark" aria-hidden>
                    F
                  </div>
                  <p className="netro-density-rail-hello">
                    Ask about {flowSymbol}
                  </p>
                </>
              )}
            </div>
            <div className="netro-density-rail-actions netro-ai-modal-actions">
              <button
                type="button"
                disabled={agentBusy}
                onClick={() => {
                  const p = `truth ${flowSymbol}`;
                  setAgentPrompt(p);
                  void submitPaperAgent(p);
                }}
              >
                Share count
                <em>Live ×</em>
              </button>
              <button
                type="button"
                disabled={agentBusy}
                onClick={() => {
                  const p = `quote 1 USDC ${flowSymbol}`;
                  setAgentPrompt(p);
                  void submitPaperAgent(p);
                }}
              >
                Get quote
                <em>$1</em>
              </button>
            </div>
            <form className="netro-density-rail-form" onSubmit={onAgentSubmit}>
              <input
                className="netro-density-rail-input"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder={`Ask about ${flowSymbol}…`}
                aria-label="Ask FOLIO agent"
                autoFocus
              />
              <button
                type="submit"
                disabled={agentBusy || !agentPrompt.trim()}
              >
                {agentBusy ? "…" : "↑"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
