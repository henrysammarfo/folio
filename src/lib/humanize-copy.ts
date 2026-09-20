/** Consumer-facing wash / gate copy — never dump raw adapter snake_case or key names. */

const WASH_HUMAN: Record<string, string> = {
  bitquery_http_error:
    "Market tape unreachable — size blocked if no backup feed",
  bitquery_missing_key: "Market tape not configured — size blocked if no backup",
  bitquery_key_missing: "Market tape not configured — size blocked if no backup",
  bitquery_unauthorized: "Market tape unauthorized — backup feed if available",
  bitquery_timeout: "Market tape timed out — try again shortly",
  wash_fail_closed: "Wash check unavailable — buy paused",
  wash_dirty: "Linked or wash-like flow — size refused",
  wash_thin: "Thin tape — size refused",
  wash_feeds_unavailable: "Wash feeds unavailable — size blocked",
  gecko_pools_empty: "No free DEX pools for this mint — size blocked",
  gecko_pools_http_error: "Free wash tape unreachable — size blocked",
  gecko_trades_http_error: "Free wash trades unreachable — size blocked",
  catalog_unavailable: "Catalog unavailable",
  prestocks_catalog_unavailable: "PreStocks catalog unavailable",
  tessera_catalog_unavailable: "Tessera catalog unavailable",
  mint_missing: "Mint not confirmed for this symbol",
};

/** Map server gate / honesty strings for Account · Buy · Activity consumers. */
const GATE_HUMAN: Record<string, string> = {
  "Corporate-action / asset truth unavailable":
    "Share-count truth unavailable — review paused",
  "Trading halted per xStocks API": "Trading halted for this stock",
  "Wash pressure blocked": "Wash-like activity detected — size refused",
  "Wash gate: BITQUERY_API_KEY missing · fail-closed (set on Vercel + .env)":
    "Market tape unavailable — buy paused until wash checks are live",
  "Equity ref vs Jupiter venue diverge outside band":
    "Reference price and route disagree — review paused",
  "Strict fail-closed: live equity reference required before review":
    "Live equity reference required before review",
  "Strict fail-closed: venue diverge unresolved · review blocked":
    "Price check unresolved — review paused",
  "Strict fail-closed: API ↔ on-chain Scaled UI mismatch · review blocked":
    "Share-count mismatch on-chain — review paused",
  "Strict fail-closed: on-chain Scaled UI unavailable · review blocked":
    "On-chain share count unavailable — review paused",
};

export function humanizeWashNote(raw: string | null | undefined): string {
  if (!raw?.trim()) return "Wash status pending";
  const t = raw.trim();
  if (WASH_HUMAN[t]) return WASH_HUMAN[t]!;
  const key = Object.keys(WASH_HUMAN).find((k) => t.includes(k));
  if (key) {
    const mapped = WASH_HUMAN[key];
    if (mapped) return mapped;
  }
  return scrubOpsJargon(t);
}

export function humanizeGateReason(raw: string | null | undefined): string {
  if (!raw?.trim()) return "Check incomplete";
  const t = raw.trim();
  if (GATE_HUMAN[t]) return GATE_HUMAN[t]!;
  if (t.startsWith("Wash gate:")) {
    const code = t.slice("Wash gate:".length).trim();
    return humanizeWashNote(code);
  }
  if (t.startsWith("Jupiter quote:")) {
    const code = t.slice("Jupiter quote:".length).trim();
    return `Quote unavailable — ${scrubOpsJargon(code)}`;
  }
  if (/BITQUERY|PYTH_API|FOLIO_SESSION|Vercel|\.env/i.test(t)) {
    return scrubOpsJargon(t);
  }
  return scrubOpsJargon(t);
}

export function humanizeHonestyNote(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  return scrubOpsJargon(raw.trim());
}

/** Strip env key names and lab jargon from consumer surfaces. */
export function scrubOpsJargon(text: string): string {
  let t = text;
  t = t.replace(/BITQUERY_API_KEY/gi, "market tape");
  t = t.replace(/\bBITQUERY\b/gi, "market tape");
  t = t.replace(/PYTH_API_KEY/gi, "equity reference");
  t = t.replace(/FOLIO_SESSION_SECRET/gi, "session signing");
  t = t.replace(/JUPITER_API_KEY/gi, "quote auth");
  t = t.replace(/PRIVY_APP_(ID|SECRET)/gi, "sign-in");
  t = t.replace(/fail-closed/gi, "paused for safety");
  t = t.replace(/Strict fail-closed:?/gi, "Strict mode:");
  t = t.replace(/\s*·\s*set on Vercel\s*\+\s*\.env/gi, "");
  t = t.replace(/\s*on Vercel\s*\+\s*\.env/gi, "");
  // snake_case adapter codes → spaces
  if (/^[a-z][a-z0-9_]+$/i.test(t) && t.includes("_")) {
    return t.replace(/_/g, " ");
  }
  return t;
}
