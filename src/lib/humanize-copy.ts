/** Consumer-facing wash / gate copy — never dump raw adapter snake_case. */

const WASH_HUMAN: Record<string, string> = {
  bitquery_http_error: "Wash feed unreachable — size blocked until tape is live",
  bitquery_missing_key: "Wash key not set — fail-closed (no silent green)",
  bitquery_unauthorized: "Wash feed unauthorized — fail-closed",
  bitquery_timeout: "Wash feed timed out — try again shortly",
  wash_fail_closed: "Wash gate fail-closed",
  wash_dirty: "Linked or wash-like flow — size refused",
  wash_thin: "Thin tape — size refused",
  catalog_unavailable: "Catalog unavailable",
  prestocks_catalog_unavailable: "PreStocks catalog unavailable",
  tessera_catalog_unavailable: "Tessera catalog unavailable",
};

export function humanizeWashNote(raw: string | null | undefined): string {
  if (!raw?.trim()) return "Wash status pending";
  const t = raw.trim();
  if (WASH_HUMAN[t]) return WASH_HUMAN[t];
  const key = Object.keys(WASH_HUMAN).find((k) => t.includes(k));
  if (key) {
    const mapped = WASH_HUMAN[key];
    if (mapped) return mapped;
  }
  // Strip snake_case adapter noise for display
  if (/^[a-z][a-z0-9_]+$/i.test(t) && t.includes("_")) {
    return t.replace(/_/g, " ");
  }
  return t;
}
