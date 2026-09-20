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
  const [inspectInput, setInspectInput] = useState(initialInspect ?? "");
  const [ownershipOpen, setOwnershipOpen] = useState(Boolean(initialInspect));
  const runAgent = useServerFn(runDeskAgent);
  const navigate = useNavigate();

  const flowItem = findCatalogItem(flowSymbol);
  const flowUnderlying = flowItem?.underlying ?? flowSymbol.replace(/x$/i, "");
  /** Overview Jupiter quote is AAPLx-sized — never relabel it as another symbol. */
  const quoteIsForFlow = flowSymbol === "AAPLx";
  const quoteReceiveLabel = quoteIsForFlow
    ? gates.quoteOut
    : "Open Buy for quote";
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
                <div key={row.symbol}>
                  <span>{row.symbol}</span>
                  <b>{row.qtyLabel.replace(/\bpaper\b/gi, "est.")}</b>
                  <small>{row.valueLabel}</small>
                </div>
              ))}
            </div>
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
                data-testid="netro-markets-flow"
              >
                <div className="netro-density-flow-head">
                  <div>
                    <strong>Market snapshot</strong>
                    <p>Share count · route · quote · {flowUnderlying}</p>
                  </div>
                  <span className="netro-density-flow-pill">{flowSymbol}</span>
                </div>
                <div
                  className="netro-density-metrics"
                  data-testid="netro-live-gates"
                >
                  <div>
                    <span>Share count</span>
                    <b>{multiplierLabel.replace(/\s*live$/i, "")}</b>
                  </div>
                  <div>
                    <span>Route</span>
                    <b>
                      {/live|clear|pass/i.test(gates.wash)
                        ? "Clear"
                        : "Checking"}
                    </b>
                  </div>
                  <div>
                    <span>Quote</span>
                    <b>Ready</b>
                  </div>
                  <div>
                    <span>Buy</span>
                    <b>Open</b>
                  </div>
                  <div>
                    <span>Credit</span>
                    <b>
                      {gates.kaminoLtv ? `${gates.kaminoLtv} LTV` : "View"}
                    </b>
                  </div>
                </div>
                <div
                  className="netro-density-flow-icons"
                  role="listbox"
                  aria-label="Market flow symbols"
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
                        <span>{sym.replace(/x$/i, "")}</span>
                      </button>
                    );
                  })}
                  <Link to="/desk/markets" className="netro-density-flow-more">
                    All →
                  </Link>
                </div>
              </div>

              <div className="netro-density-row">
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(5)}
                >
                  <div className="netro-density-card-head">
                    <strong>Buy path</strong>
                  </div>
                  <b>USDC → {flowSymbol}</b>
                  <small>Best live route · gasless ready ≥~$10</small>
                </div>
                <div
                  className="netro-density-card netro-density-card-dark netro-density-item"
                  style={delay(6)}
                >
                  <div className="netro-density-card-head">
                    <strong>Price</strong>
                  </div>
                  <b>Live market</b>
                  <small>{flowUnderlying} · updated continuously</small>
                </div>
              </div>

              <div className="netro-density-row">
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(7)}
                >
                  <div className="netro-density-card-head">
                    <strong>Borrow</strong>
                  </div>
                  <div className="netro-density-pills">
                    <Link
                      to="/desk/acquire"
                      className="netro-pill netro-pill-on"
                    >
                      Buy
                    </Link>
                    <Link to="/desk/positions" className="netro-pill">
                      Hold
                    </Link>
                    <Link to="/desk/credit" className="netro-pill">
                      Credit
                    </Link>
                  </div>
                  <b>
                    {gates.kaminoLtv
                      ? `Up to ${(Number(gates.kaminoLtv) * 100).toFixed(0)}% LTV`
                      : "Credit available"}
                  </b>
                  <small>Borrow without selling your shares</small>
                </div>
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(8)}
                >
                  <div className="netro-density-card-head">
                    <strong>Earn</strong>
                  </div>
                  <b>Credit desk</b>
                  <small>
                    <Link to="/desk/credit">Open credit →</Link>
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div
            className="netro-density-market netro-density-item"
            style={delay(9)}
          >
            <div className="netro-density-market-head">
              <strong>{flowSymbol}</strong>
              <span>Share count</span>
              <em>{multiplierLabel.replace(/\s*live$/i, "")}</em>
            </div>
            <div
              className="netro-density-chart netro-density-chart-dark netro-density-chart-tv"
              data-testid="netro-truth-strip"
            >
              <div className="netro-density-chart-meta">
                <b>Live chart</b>
                <span>TradingView · same as Buy</span>
              </div>
              <TradingViewChart
                symbol={flowSymbol}
                height={280}
                interval="60"
                theme="dark"
              />
              <div
                className="netro-density-chart-stats"
                aria-label="Market stats"
              >
                <div>
                  <span>Scaled UI</span>
                  <b>
                    {/match/i.test(scaledUiStripLabel) ? "Match" : "Checking"}
                  </b>
                </div>
                <div>
                  <span>Route</span>
                  <b>
                    {/live|clear|pass/i.test(gates.wash)
                      ? "Clear"
                      : "Checking"}
                  </b>
                </div>
                <div>
                  <span>Quote</span>
                  <b>{gates.quoteOut}</b>
                </div>
                <div>
                  <span>Credit</span>
                  <b>
                    {gates.kaminoLtv ? `${gates.kaminoLtv} LTV` : "View"}
                  </b>
                </div>
              </div>
              <div className="netro-density-chart-foot">
                <span data-testid="netro-scaled-ui-strip">
                  {/match/i.test(scaledUiStripLabel)
                    ? "On-chain matches"
                    : "Checking on-chain…"}
                </span>
                <Link
                  to="/desk/positions/$symbol"
                  params={{ symbol: flowSymbol }}
                >
                  Full chart →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div id="netro-right-column" className="netro-density-right">
          <div
            className="netro-density-quote netro-density-item"
            style={delay(5)}
          >
            <div className="netro-density-quote-head">
              <strong>Buy</strong>
              <span>Live quote</span>
            </div>
            <div
              className="netro-density-quote-pair"
              data-testid="netro-live-quote"
            >
              <div>
                <span>You pay</span>
                <b>USDC</b>
                <em>$1.00</em>
              </div>
              <div className="netro-density-quote-swap" aria-hidden>
                ↕
              </div>
              <div>
                <span>You receive</span>
                <b>{flowSymbol}</b>
                <em>{gates.quoteOut}</em>
              </div>
            </div>
            <Link to="/desk/acquire" className="netro-density-quote-cta">
              Buy {flowSymbol}
            </Link>
            <p className="netro-density-quote-foot">
              Live quote · ready to review
            </p>
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
              <div>
                <p className="netro-density-rail-title">FOLIO agent</p>
                <p className="netro-density-rail-sub">
                  Ask anything about {flowSymbol}
                </p>
              </div>
              {enablePaperAgent ? (
                <button
                  type="button"
                  className="netro-density-rail-expand"
                  data-testid="netro-ai-expand"
                  onClick={() => setAiModalOpen(true)}
                >
                  Expand
                </button>
              ) : null}
            </div>
            <div className="netro-density-rail-welcome">
              <p>
                {agentReply ??
                  `Ask about share counts, a buy quote, or borrowing against ${flowSymbol}.`}
              </p>
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
                    <em>$1 USDC</em>
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
                    placeholder="Ask FOLIO…"
                    aria-label="Ask FOLIO agent"
                  />
                  <button
                    type="submit"
                    disabled={agentBusy || !agentPrompt.trim()}
                  >
                    {agentBusy ? "…" : "Ask"}
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
                aria-label="Close agent"
                onClick={() => setAiModalOpen(false)}
              >
                Close
              </button>
            </header>
            <div className="netro-ai-modal-body">
              <div className="netro-ai-modal-mark" aria-hidden>
                F
              </div>
              <p>
                {agentReply ??
                  `Welcome — ask about ${flowSymbol} share counts, a USDC buy quote, or borrowing without selling.`}
              </p>
              {agentMeta ? (
                <small className="netro-density-rail-meta">{agentMeta}</small>
              ) : null}
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
                <em>$1 USDC</em>
              </button>
            </div>
            <form className="netro-density-rail-form" onSubmit={onAgentSubmit}>
              <input
                className="netro-density-rail-input"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder={`Ask about ${flowSymbol}…`}
                aria-label="Ask FOLIO agent"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
              <button
                type="submit"
                disabled={agentBusy || !agentPrompt.trim()}
              >
                {agentBusy ? "…" : "Ask"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
