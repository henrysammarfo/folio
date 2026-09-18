/**
 * FOLIO lab blotter — layout adapted from 21st.dev Trade Journal Table (id 27124).
 * Rows are paper / fail-closed honesty samples — never invent live fills.
 * Lab-only; production merge still requires Henry approve.
 */
import { useState } from "react";
import { Check, X } from "lucide-react";

type Outcome = "Open" | "Blocked" | "Quoted";

type Row = {
  id: string;
  at: string;
  asset: string;
  side: "Buy" | "Hold";
  note: string;
  multiplier: string;
  status: Outcome;
};

const RANGES = ["All", "Truth", "Gates"] as const;

const ROWS: Row[] = [
  {
    id: "aapl-1",
    at: "Live",
    asset: "AAPLx",
    side: "Hold",
    note: "Scaled UI · not fixture 4×",
    multiplier: "≈1.003×",
    status: "Open",
  },
  {
    id: "wash-1",
    at: "Gate",
    asset: "Wash",
    side: "Buy",
    note: "BITQUERY missing → fail-closed",
    multiplier: "—",
    status: "Blocked",
  },
  {
    id: "quote-1",
    at: "Quote",
    asset: "USDC→AAPLx",
    side: "Buy",
    note: "Jupiter TTL · ≤$1 inspect",
    multiplier: "quote-only",
    status: "Quoted",
  },
  {
    id: "bcast-1",
    at: "Policy",
    asset: "Broadcast",
    side: "Hold",
    note: "Paused until funded",
    multiplier: "off",
    status: "Blocked",
  },
];

export function FolioTradeJournalLab() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("All");
  const shown =
    range === "All"
      ? ROWS
      : range === "Truth"
        ? ROWS.filter((r) => r.id.startsWith("aapl") || r.id.startsWith("quote"))
        : ROWS.filter((r) => r.id.startsWith("wash") || r.id.startsWith("bcast"));

  return (
    <div className="folio-journal" aria-hidden>
      <div className="folio-journal-head">
        <div>
          <h3>Truth journal</h3>
          <span>{shown.length} rows · paper honesty (no fills)</span>
        </div>
        <div className="folio-journal-ranges" role="radiogroup" aria-label="Range">
          {RANGES.map((label) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={range === label}
              className={range === label ? "on" : undefined}
              onClick={() => setRange(label)}
              tabIndex={-1}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="folio-journal-cols">
        <span>When</span>
        <span>Asset</span>
        <span>Side</span>
        <span>Note</span>
        <span>Mark</span>
        <span>Status</span>
      </div>
      <ul className="folio-journal-rows">
        {shown.map((r) => (
          <li key={r.id}>
            <span>{r.at}</span>
            <span>{r.asset}</span>
            <span>{r.side}</span>
            <span>{r.note}</span>
            <span className="tabular">{r.multiplier}</span>
            <StatusPill status={r.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusPill({ status }: { status: Outcome }) {
  return (
    <span className={`folio-journal-pill folio-journal-pill-${status.toLowerCase()}`}>
      {status === "Quoted" ? <Check size={10} strokeWidth={3} /> : null}
      {status === "Blocked" ? <X size={10} strokeWidth={3} /> : null}
      {status === "Open" ? <i /> : null}
      {status}
    </span>
  );
}
