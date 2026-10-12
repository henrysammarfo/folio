/**
 * Cash-session gate — Bible mandatory spine.
 * Weekend / NYSE closed → FOLIO refuses size in product logic.
 * The Meteora curve cannot see the bell; this gate lives in FOLIO.
 */
import { errResult, okResult, type AdapterResult } from "./types";

export type CashSession = {
  /** US equities regular session open (approx America/New_York). */
  open: boolean;
  /** ISO weekday in America/New_York (Mon–Fri = trading days). */
  nyWeekday: string;
  /** HH:MM in America/New_York. */
  nyClock: string;
  /** Soft label for desk UI. */
  label: string;
};

function nyParts(now = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(now);
  const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return { weekday, clock };
}

/** Regular session ≈ 09:30–16:00 ET · Mon–Fri. Holidays not modeled (labeled residual). */
export function evaluateCashSession(now = new Date()): AdapterResult<CashSession> {
  const { weekday, clock } = nyParts(now);
  const [hhRaw, mmRaw] = clock.split(":");
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  const mins = hh * 60 + mm;
  const weekdayOpen = !["Sat", "Sun"].includes(weekday);
  const inBell = mins >= 9 * 60 + 30 && mins < 16 * 60;
  const open = weekdayOpen && inBell;
  const label = open
    ? "Cash session open"
    : weekdayOpen
      ? "Cash session closed — overnight / after hours"
      : "Weekend — cash session closed";

  return okResult("mainnet-read", "folio.cash-session", {
    open,
    nyWeekday: weekday,
    nyClock: clock,
    label,
  });
}

/** Product refuse helper — never silent green on weekend size. */
export function sessionAllowsSize(
  session: AdapterResult<CashSession>,
): { ok: true } | { ok: false; reason: string } {
  if (!session.ok) {
    return { ok: false, reason: session.reason };
  }
  if (!session.data.open) {
    return { ok: false, reason: "cash_session_closed" };
  }
  return { ok: true };
}

/** Labeled residual: holiday calendar not wired. */
export function sessionHolidayResidual(): AdapterResult<never> {
  return errResult(
    "folio.cash-session",
    "holiday_calendar_unwired",
    "NYSE holidays not modeled — treat as residual risk",
  );
}
