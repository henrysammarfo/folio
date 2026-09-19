/**
 * Desk-density canvas — layout/UX extracted from AbdullahBalfaqih/NetroBNB
 * (12-col: left 9 = profile 3 + stack 6 + full market; right 3 = quote + yellow AI).
 * Content + tokens are FOLIO stock-desk; no Binance/Netro brand clone.
 * Mounted on /desk overview only — never replaces Positions/Acquire routes.
 * Flow metrics prefer live /network matrix modes (never invent greens).
 * Optional paper-agent rail: live Block 0 spine · never broadcasts.
 */
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { TradingViewChart } from "@/components/tradingview-chart";
import { runDeskAgent } from "@/lib/desk.functions";
import {
  NETRO_LIVE_GATE_DEFAULTS,
  type NetroLiveGateLabels,
} from "@/lib/netro-live-gates";
import type { NetroOwnershipSummary } from "@/lib/netro-ownership";

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
  const [inspectInput, setInspectInput] = useState(initialInspect ?? "");
  const [ownershipOpen, setOwnershipOpen] = useState(Boolean(initialInspect));
  const runAgent = useServerFn(runDeskAgent);
  const navigate = useNavigate();

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
  }, [multiplierLabel, enablePaperAgent, agentReply, gates.quoteOut, gates.kaminoLtv]);

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
    // Stay on Netro overview with ?inspect= so ownership qty paints live
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
      {/* Compact title only — desk sidebar owns primary nav (no duplicate Truth/Network chrome) */}
      <header className="netro-density-title netro-density-item" style={delay(0)}>
        <div>
          <h3>Your desk</h3>
          <span>Buy · hold · borrow — live markets</span>
        </div>
        <div className="netro-density-chrome-actions">
          <Link to="/desk/acquire" className="netro-density-connect">
            Buy AAPLx
          </Link>
        </div>
      </header>

      {/* Share ticker — NetroBNB CryptoTickerCard geometry, FOLIO xStocks */}
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
          onToggle={(e) => setOwnershipOpen((e.target as HTMLDetailsElement).open)}
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

      {/* Empire keys stay in Settings — never on the consumer overview */}

      {/* Main Desktop Grid: 9 left / 3 right — NetroBNB app/page.tsx */}
      <div className="netro-density-grid">
        <div id="netro-left-column" className="netro-density-left">
          {/* Top: Profile (3/9) + Center stack (6/9) */}
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
                AAPLx
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
                params={{ symbol: "AAPLx" }}
                className="netro-density-cta"
              >
                Open AAPLx
              </Link>
            </div>

            <div className="netro-density-stack">
              {/* Today's Market Flow — AttendanceTodayCard geometry */}
              <div
                className="netro-density-flow netro-density-item"
                style={delay(4)}
              >
                <div className="netro-density-flow-head">
                  <div>
                    <strong>Market snapshot</strong>
                    <p>Share count · route · quote</p>
                  </div>
                  <span className="netro-density-flow-pill">AAPLx</span>
                </div>
                <div className="netro-density-metrics" data-testid="netro-live-gates">
                  <div>
                    <span>Share count</span>
                    <b>{multiplierLabel.replace(/\s*live$/i, "")}</b>
                  </div>
                  <div>
                    <span>Route</span>
                    <b>
                      {/live|clear|pass/i.test(gates.wash) ? "Clear" : "Checking"}
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
                    <b>{gates.kaminoLtv ? `${gates.kaminoLtv} LTV` : "View"}</b>
                  </div>
                </div>
              </div>

              {/* Row: route + mark */}
              <div className="netro-density-row">
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(5)}
                >
                  <div className="netro-density-card-head">
                    <strong>Buy path</strong>
                  </div>
                  <b>USDC → AAPLx</b>
                  <small>Best live route</small>
                </div>
                <div
                  className="netro-density-card netro-density-card-dark netro-density-item"
                  style={delay(6)}
                >
                  <div className="netro-density-card-head">
                    <strong>Price</strong>
                  </div>
                  <b>Live market</b>
                  <small>Updated continuously</small>
                </div>
              </div>

              {/* Row: credit + nest */}
              <div className="netro-density-row">
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(7)}
                >
                  <div className="netro-density-card-head">
                    <strong>Borrow</strong>
                  </div>
                  <div className="netro-density-pills">
                    <Link to="/desk/acquire" className="netro-pill netro-pill-on">
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

          {/* Full-width market strip */}
          <div
            className="netro-density-market netro-density-item"
            style={delay(9)}
          >
            <div className="netro-density-market-head">
              <strong>AAPLx</strong>
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
                symbol="AAPLx"
                height={280}
                interval="60"
                theme="dark"
              />
              <div className="netro-density-chart-foot">
                <span data-testid="netro-scaled-ui-strip">
                  {/match/i.test(scaledUiStripLabel)
                    ? "On-chain matches"
                    : "Checking on-chain…"}
                </span>
                <Link to="/desk/positions/$symbol" params={{ symbol: "AAPLx" }}>
                  Full chart →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3-col: quote + agent */}
        <div id="netro-right-column" className="netro-density-right">
          <div
            className="netro-density-quote netro-density-item"
            style={delay(5)}
          >
            <div className="netro-density-quote-head">
              <strong>Buy</strong>
              <span>Live quote</span>
            </div>
            <div className="netro-density-quote-pair" data-testid="netro-live-quote">
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
                <b>AAPLx</b>
                <em>{gates.quoteOut}</em>
              </div>
            </div>
            <Link to="/desk/acquire" className="netro-density-quote-cta">
              Buy AAPLx
            </Link>
            <p className="netro-density-quote-foot">Live quote · ready to review</p>
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
                <p className="netro-density-rail-sub">Ask anything about AAPLx</p>
              </div>
            </div>
            <div className="netro-density-rail-welcome">
              <p>
                {agentReply ??
                  "Ask about share counts, a buy quote, or borrowing against your holdings."}
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
                      setAgentPrompt("truth AAPLx");
                      void submitPaperAgent("truth AAPLx");
                    }}
                  >
                    Share count
                    <em>Live ×</em>
                  </button>
                  <button
                    type="button"
                    disabled={agentBusy}
                    onClick={() => {
                      setAgentPrompt("quote 1 USDC AAPLx");
                      void submitPaperAgent("quote 1 USDC AAPLx");
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
                  <button type="submit" disabled={agentBusy || !agentPrompt.trim()}>
                    {agentBusy ? "…" : "Ask"}
                  </button>
                </form>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
