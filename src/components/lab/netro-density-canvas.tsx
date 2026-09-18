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
import { runDeskAgent } from "@/lib/desk.functions";
import {
  NETRO_LIVE_GATE_DEFAULTS,
  type NetroLiveGateLabels,
} from "@/lib/netro-live-gates";
import type { NetroKeysReadiness } from "@/lib/netro-keys-readiness";
import type { NetroOwnershipSummary } from "@/lib/netro-ownership";

type Props = {
  multiplierLabel: string;
  /** Live Empire gate labels from /network matrix — defaults are fail-closed. */
  gates?: NetroLiveGateLabels;
  /** Live positions honesty — paper vs wallet-read / inspect. */
  ownership?: NetroOwnershipSummary | null;
  /** Live Empire key presence — multi-tenant / wash / Pyth paste path. */
  keysReadiness?: NetroKeysReadiness | null;
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
  keysReadiness = null,
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
  const [keysOpen, setKeysOpen] = useState(
    () => (keysReadiness?.missingCount ?? 0) > 0,
  );
  const runAgent = useServerFn(runDeskAgent);
  const navigate = useNavigate();

  useEffect(() => {
    setInspectInput(initialInspect ?? "");
    if (initialInspect) setOwnershipOpen(true);
  }, [initialInspect]);

  useEffect(() => {
    if ((keysReadiness?.missingCount ?? 0) > 0) setKeysOpen(true);
  }, [keysReadiness?.missingCount]);

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
        setAgentMeta("nl=failed · broadcast=false · spine unavailable");
        return;
      }
      setAgentReply(res.data.reply);
      const nl = res.data.nlExpansion ?? "off";
      const note = res.data.nlExpansionNote
        ? ` · ${res.data.nlExpansionNote}`
        : "";
      setAgentMeta(`nl=${nl}${note} · broadcast=false · paper spine`);
    } catch (err) {
      setAgentReply(err instanceof Error ? err.message : "Agent call failed");
      setAgentMeta("nl=failed · broadcast=false");
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
          <h3>Share truth desk</h3>
          <span>Mainnet-read · quote-only · broadcast paused</span>
        </div>
        <div className="netro-density-chrome-actions">
          <Link
            to="/desk/settings"
            hash="empire-readiness"
            className="netro-density-connect"
          >
            {keysReadiness && keysReadiness.missingCount > 0
              ? "Paste keys"
              : "Connect"}
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
            <strong>Inspect wallet</strong>
            <span>Ephemeral mainnet-read · not auth · no cookie</span>
          </div>
          <input
            value={inspectInput}
            onChange={(e) => setInspectInput(e.target.value)}
            placeholder="Base58 pubkey"
            autoComplete="off"
            spellCheck={false}
            aria-label="Inspect wallet pubkey"
          />
          <button type="submit" disabled={!inspectInput.trim()}>
            Inspect qty
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
              Or bind watch-wallet
            </Link>
          )}
          {initialInspect ? (
            <Link
              to="/desk/positions"
              search={{ inspect: initialInspect }}
              className="netro-density-inspect-bind"
            >
              Open positions ledger
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
            <span>Ownership · {ownership.walletSourceLabel}</span>
            <em>Expand / minimize</em>
          </summary>
          <section
            className="netro-density-ownership"
            aria-label="Ownership honesty"
          >
          <div className="netro-density-ownership-head">
            <div>
              <strong>Ownership</strong>
              <span>{ownership.note}</span>
            </div>
            <div className="netro-density-ownership-pills">
              <em>{ownership.walletSourceLabel}</em>
              <em>{ownership.qtyLabel}</em>
              <em>{ownership.verifiedLabel}</em>
            </div>
          </div>
          <div className="netro-density-ownership-metrics">
            <div>
              <span>Economic value</span>
              <b>{ownership.economicValueLabel}</b>
            </div>
            {ownership.rows.map((row) => (
              <div key={row.symbol}>
                <span>
                  {row.symbol} · {row.health}
                </span>
                <b>{row.qtyLabel}</b>
                <small>{row.valueLabel}</small>
              </div>
            ))}
          </div>
          </section>
        </details>
      ) : null}

      {enablePaperAgent && keysReadiness ? (
        <details
          className="netro-density-collapse netro-density-collapse-dark netro-density-item"
          style={delay(2.7)}
          data-testid="netro-keys-readiness"
          open={keysOpen}
          onToggle={(e) => setKeysOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary>
            <span>
              Empire keys
              {keysReadiness.missingCount > 0
                ? ` · ${keysReadiness.missingCount} missing`
                : " · ready"}
            </span>
            <em>Expand / minimize</em>
          </summary>
          <section
            className="netro-density-keys"
            aria-label="Empire keys readiness"
          >
          <div className="netro-density-keys-head">
            <div>
              <strong>Empire keys</strong>
              <span>{keysReadiness.multiTenantLabel}</span>
            </div>
            <Link
              to="/desk/settings"
              hash="empire-readiness"
              className="netro-density-keys-cta"
            >
              {keysReadiness.missingCount > 0
                ? `Paste ${keysReadiness.missingCount} missing → Settings`
                : "Settings readiness"}
            </Link>
          </div>
          <div className="netro-density-keys-grid">
            {keysReadiness.rows.map((row) => (
              <div
                key={row.id}
                data-ok={row.ok ? "1" : "0"}
                className={row.ok ? "netro-key-ok" : "netro-key-miss"}
              >
                <span>{row.label}</span>
                <b>{row.status}</b>
              </div>
            ))}
          </div>
          </section>
        </details>
      ) : null}

      {/* Main Desktop Grid: 9 left / 3 right — NetroBNB app/page.tsx */}
      <div className="netro-density-grid">
        <div id="netro-left-column" className="netro-density-left">
          {/* Top: Profile (3/9) + Center stack (6/9) */}
          <div className="netro-density-top">
            <div
              className="netro-density-profile netro-density-item"
              style={delay(3)}
            >
              <p className="netro-density-hi">Hi, desk</p>
              <div className="netro-density-profile-art" aria-hidden>
                <span className="netro-density-gear" />
                <span className="netro-density-gear netro-density-gear-inner" />
              </div>
              <h4>
                Make
                <br />
                Analysis Easy
              </h4>
              <div className="netro-density-clock">
                <span>{clock.h}</span>
                <em>:</em>
                <span>{clock.m}</span>
                <em>:</em>
                <span>{clock.s}</span>
              </div>
              <Link to="/truth" className="netro-density-cta">
                Start truth pass
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
                    <strong>Today&apos;s share flow</strong>
                    <p>Live wash · diverge · quote spine</p>
                  </div>
                  <span className="netro-density-flow-pill">AAPLx | USDC</span>
                </div>
                <div className="netro-density-metrics" data-testid="netro-live-gates">
                  <div>
                    <span>Multiplier</span>
                    <b>{multiplierLabel}</b>
                  </div>
                  <div>
                    <span>Wash</span>
                    <b>{gates.wash}</b>
                  </div>
                  <div>
                    <span>Quote</span>
                    <b>{gates.quote}</b>
                  </div>
                  <div>
                    <span>Broadcast</span>
                    <b>{gates.broadcast}</b>
                  </div>
                  <div>
                    <span>NestUSD</span>
                    <b>{gates.nestUsd}</b>
                  </div>
                </div>
                <div className="netro-density-gate-strip" data-testid="netro-empire-strip">
                  <span>
                    Equity ref <b>{gates.pyth}</b>
                  </span>
                  <span>
                    Scaled UI <b>{gates.scaledUi}</b>
                  </span>
                  <span>
                    Kamino <b>{gates.kamino}</b>
                  </span>
                  <span>
                    Raydium <b>{gates.raydium}</b>
                  </span>
                  <span>
                    Nest.credit <b>{gates.nestCredit}</b>
                  </span>
                  <span>
                    Multi-tenant <b>{gates.multiTenant}</b>
                  </span>
                </div>
              </div>

              {/* Row: route + paper */}
              <div className="netro-density-row">
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(5)}
                >
                  <div className="netro-density-card-head">
                    <strong>Route</strong>
                  </div>
                  <b>USDC → AAPLx</b>
                  <small>{gates.quoteMeta}</small>
                </div>
                <div
                  className="netro-density-card netro-density-card-dark netro-density-item"
                  style={delay(6)}
                >
                  <div className="netro-density-card-head">
                    <strong>Paper mark</strong>
                  </div>
                  <b>Live · not fixture</b>
                  <small>No invent-a-fill theater</small>
                </div>
              </div>

              {/* Row: credit + nest */}
              <div className="netro-density-row">
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(7)}
                >
                  <div className="netro-density-card-head">
                    <strong>Credit LTV</strong>
                  </div>
                  <div className="netro-density-pills">
                    <span className="netro-pill netro-pill-on">Acquisition</span>
                    <span className="netro-pill">Holding</span>
                    <span className="netro-pill">Liquidity</span>
                  </div>
                  <b>
                    {gates.kaminoLtv
                      ? `Kamino ${gates.kaminoLtv} maxLTV`
                      : gates.kamino === "Mainnet-read"
                        ? "Kamino live LTV"
                        : `Kamino ${gates.kamino}`}
                  </b>
                  <small>{gates.creditCapacity}</small>
                </div>
                <div
                  className="netro-density-card netro-density-item"
                  style={delay(8)}
                >
                  <div className="netro-density-card-head">
                    <strong>Nest</strong>
                  </div>
                  <b>Nest.credit is not NestUSD</b>
                  <small>NestUSD capacity labeled unavailable</small>
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
              <strong>AAPLx / USDC</strong>
              <span>Share truth strip · mainnet-read</span>
              <em>{multiplierLabel}</em>
            </div>
            <div
              className="netro-density-chart netro-density-chart-dark"
              role="presentation"
              data-testid="netro-truth-strip"
            >
              <div className="netro-density-chart-meta">
                <b>Illustrative strip</b>
                <span>Not live candles · geometry only</span>
              </div>
              <svg viewBox="0 0 640 180" preserveAspectRatio="none" aria-hidden>
                <polyline
                  fill="none"
                  stroke="#0EA5C9"
                  strokeWidth="2.2"
                  points="0,140 40,132 80,128 120,118 160,122 200,108 240,98 280,104 320,86 360,92 400,74 440,80 480,62 520,70 560,52 600,58 640,44"
                />
                <polyline
                  fill="none"
                  stroke="rgba(255,255,255,.35)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  points="0,150 80,148 160,146 240,144 320,142 400,140 480,138 560,136 640,134"
                />
              </svg>
              <div className="netro-density-chart-foot">
                <span data-testid="netro-scaled-ui-strip">{scaledUiStripLabel}</span>
                <span>Wash · {gates.wash}</span>
                <span>Equity diverge · {gates.pyth}</span>
                <span>Broadcast · {gates.broadcast}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 3-col: quote status + yellow AI rail */}
        <div id="netro-right-column" className="netro-density-right">
          <div
            className="netro-density-quote netro-density-item"
            style={delay(5)}
          >
            <div className="netro-density-quote-head">
              <strong>Quote</strong>
              <span>inspect only</span>
            </div>
            <div className="netro-density-quote-pair" data-testid="netro-live-quote">
              <div>
                <span>You pay</span>
                <b>USDC</b>
                <em>≤ $1.00</em>
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
              Inspect quote
            </Link>
            <p className="netro-density-quote-foot">{gates.quoteMeta}</p>
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
                  {enablePaperAgent
                    ? "Live spine · paper · no broadcast"
                    : "Share truth · paper spine"}
                </p>
              </div>
            </div>
            <div className="netro-density-rail-welcome">
              <p>
                {agentReply ??
                  "Ask about AAPLx multiplier, wash pressure, or credit LTV. Paper agent keeps the live spine — never fills while broadcast is paused."}
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
                    Truth pass
                    <em>Live × · Scaled UI</em>
                  </button>
                  <button
                    type="button"
                    disabled={agentBusy}
                    onClick={() => {
                      setAgentPrompt("quote 1 USDC AAPLx");
                      void submitPaperAgent("quote 1 USDC AAPLx");
                    }}
                  >
                    Quote inspect
                    <em>≤$1 · no broadcast</em>
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
                    placeholder="truth AAPLx · quote 1 USDC AAPLx"
                    disabled={agentBusy}
                    aria-label="Paper agent prompt"
                  />
                  <button type="submit" disabled={agentBusy || !agentPrompt.trim()}>
                    {agentBusy ? "…" : "Run"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="netro-density-rail-actions">
                  <span>
                    Truth pass
                    <em>Wash · diverge</em>
                  </span>
                  <span>
                    24h strip
                    <em>Multiplier</em>
                  </span>
                </div>
                <div className="netro-density-rail-input">Ask about AAPLx…</div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
