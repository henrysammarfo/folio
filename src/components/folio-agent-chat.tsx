/**
 * FOLIO agent chat surface — thinking → stream → result.
 * Patterns adapted from design-system demos (SelectionActions / Thinking /
 * Streaming / PromptBar); creamery copy and foreign icon packs stay out.
 */
import { useEffect, useState, type FormEvent } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";

export type FolioAgentChatProps = {
  busy: boolean;
  reply: string | null;
  meta?: string | null;
  placeholder?: string;
  suggestions?: string[];
  onSend: (prompt: string) => void | Promise<void>;
  className?: string;
  /** Compact rail vs full settings panel */
  compact?: boolean;
};

const THINK_STEPS = [
  "Reading live share count",
  "Checking route safety",
  "Pulling quote / LTV when asked",
] as const;

export function FolioAgentChat({
  busy,
  reply,
  meta,
  placeholder = "truth AAPLx · quote 1 USDC NVDAx · credit",
  suggestions = ["Share count", "Get quote", "Credit"],
  onSend,
  className = "",
  compact = false,
}: FolioAgentChatProps) {
  const [draft, setDraft] = useState("");
  const [thinkStep, setThinkStep] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    if (!busy) {
      setThinkStep(0);
      return;
    }
    setThinkStep(0);
    const t = window.setInterval(() => {
      setThinkStep((s) => Math.min(s + 1, THINK_STEPS.length - 1));
    }, 420);
    return () => window.clearInterval(t);
  }, [busy]);

  useEffect(() => {
    if (!reply || busy) {
      setVisibleChars(0);
      return;
    }
    setVisibleChars(0);
    const total = reply.length;
    let i = 0;
    const t = window.setInterval(() => {
      i = Math.min(i + Math.max(2, Math.floor(total / 40)), total);
      setVisibleChars(i);
      if (i >= total) window.clearInterval(t);
    }, 18);
    return () => window.clearInterval(t);
  }, [reply, busy]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    void onSend(text);
    setDraft("");
  }

  const shown = reply ? reply.slice(0, visibleChars) : "";
  const streaming = Boolean(reply && !busy && visibleChars < reply.length);

  return (
    <div
      className={`folio-agent-chat${compact ? " is-compact" : ""} ${className}`.trim()}
      data-testid="folio-agent-chat"
    >
      <div className="folio-agent-trace" aria-live="polite">
        {busy ? (
          <div className="folio-agent-thinking">
            <span className="folio-agent-spin" aria-hidden>
              <Loader2 size={14} strokeWidth={2.2} />
            </span>
            <div>
              <p className="folio-agent-thinking-label">
                {THINK_STEPS[thinkStep]}…
              </p>
              <ul>
                {THINK_STEPS.map((step, i) => (
                  <li
                    key={step}
                    className={i <= thinkStep ? "is-on" : undefined}
                  >
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : reply ? (
          <div className="folio-agent-reply">
            <p>
              {shown}
              {streaming ? <span className="folio-agent-caret" /> : null}
            </p>
            {meta && !streaming ? (
              <small className="folio-agent-meta">{meta}</small>
            ) : null}
          </div>
        ) : (
          <div className="folio-agent-empty">
            <Sparkles size={18} strokeWidth={1.8} aria-hidden />
            <p>Ask about share counts, quotes, credit, or network — never fills.</p>
          </div>
        )}
      </div>

      {!compact ? (
        <div className="folio-agent-chips">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="folio-agent-chip"
              disabled={busy}
              onClick={() => {
                const map: Record<string, string> = {
                  "Share count": "truth AAPLx",
                  "Get quote": "quote 1 USDC AAPLx",
                  Credit: "credit",
                };
                void onSend(map[s] ?? s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form className="folio-agent-composer" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label="Agent prompt"
          disabled={busy}
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={busy || !draft.trim()}
          className="folio-agent-send"
        >
          <ArrowUp size={16} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}
