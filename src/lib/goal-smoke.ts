/**
 * Stocklana goal readiness — maps ship requirements to live evidence.
 * Never invents greens. Missing Empire keys → PARTIAL/BLOCKED, not ok.
 */

export type GoalStatus = "done" | "partial" | "blocked";

export type GoalRequirementRow = {
  id: string;
  title: string;
  status: GoalStatus;
  detail: string;
};

export type GoalSmokeInput = {
  approvedLabUi: string | null;
  broadcastPaused: boolean;
  broadcastFunded: boolean;
  multiplierOk: boolean;
  multiplierLabel: string;
  jupiterQuoteOk: boolean;
  kaminoOk: boolean;
  scaledUiOk: boolean;
  nestUsdUnavailable: boolean;
  washLive: boolean;
  washFailClosed: boolean;
  pythLive: boolean;
  pythFailClosed: boolean;
  bitqueryKey: boolean;
  pythKey: boolean;
  privyKey: boolean;
  supabaseKey: boolean;
  sessionSecret: boolean;
  multiTenantSessionReady: boolean;
  /** PostgREST tenants reachable (migration + service_role GRANTs). */
  supabaseSchemaReady?: boolean;
};

export function classifyGoalRequirements(
  input: GoalSmokeInput,
): GoalRequirementRow[] {
  const empireLiveBits = [
    input.multiplierOk,
    input.jupiterQuoteOk,
    input.kaminoOk,
    input.scaledUiOk,
  ].filter(Boolean).length;

  let empireStatus: GoalStatus = "blocked";
  let empireDetail = "xStocks multiplier unavailable — Block 0 spine dark";
  if (empireLiveBits >= 3 && input.nestUsdUnavailable) {
    if (input.washLive && input.pythLive) {
      empireStatus = "done";
      empireDetail = `Live truth/quote/credit/wash/equity-ref · NestUSD unavailable · ${input.multiplierLabel}`;
    } else {
      empireStatus = "partial";
      const waiting: string[] = [];
      if (!input.washLive) {
        waiting.push(
          input.bitqueryKey
            ? "wash keyed but not live"
            : "BITQUERY_API_KEY (wash fail-closed)",
        );
      }
      if (!input.pythLive) {
        waiting.push(
          "equity ref dark (Yahoo/Finnhub/Pyth all failed)",
        );
      }
      empireDetail = `Live truth/quote/Kamino/Scaled UI · waiting ${waiting.join(" · ")}`;
    }
  } else if (empireLiveBits > 0) {
    empireStatus = "partial";
    empireDetail = `Partial Empire spine (${empireLiveBits}/4 live cores) · ${input.multiplierLabel}`;
  }

  const multiTenantStatus: GoalStatus = input.multiTenantSessionReady
    ? "done"
    : input.privyKey && input.supabaseKey && input.sessionSecret
      ? "partial"
      : "blocked";
  const multiTenantDetail = input.multiTenantSessionReady
    ? "Privy + Supabase + session secret · membership path armed (mint+verify)"
    : !input.privyKey || !input.supabaseKey
      ? "Missing PRIVY_* and/or SUPABASE_* — multi-tenant fail-closed"
      : !input.sessionSecret
        ? "Missing FOLIO_SESSION_SECRET ≥16 — cookie mint fail-closed"
        : input.supabaseSchemaReady === false
          ? "Keys+JWT present · run 20260916_folio_tenants_grants.sql (service_role 42501) then mint session"
          : "Keys present — bootstrap folio-demo or Privy mint + Join to finish";

  const uiStatus: GoalStatus =
    input.approvedLabUi === "netro-density" ? "done" : "partial";
  const uiDetail =
    input.approvedLabUi === "netro-density"
      ? "FOLIO_APPROVED_LAB_UI=netro-density · desk mounts Netro · Aionis hero preserved"
      : input.approvedLabUi
        ? `FOLIO_APPROVED_LAB_UI=${input.approvedLabUi} · not netro-density`
        : "FOLIO_APPROVED_LAB_UI unset — production desk stays default";

  const spendStatus: GoalStatus =
    input.broadcastPaused && !input.broadcastFunded ? "done" : "partial";
  const spendDetail =
    input.broadcastPaused && !input.broadcastFunded
      ? "BROADCAST_PAUSED · quote-only · ≤~$1 · no funded fills"
      : input.broadcastFunded
        ? "Broadcast funded flag on — refuse until intentional Stocklana demo"
        : "BROADCAST_PAUSED not set — set true on Vercel";

  const honestyStatus: GoalStatus =
    input.nestUsdUnavailable &&
    (input.washFailClosed || input.washLive) &&
    (input.pythFailClosed || input.pythLive)
      ? "done"
      : "partial";
  const honestyDetail = input.nestUsdUnavailable
    ? "NestUSD unavailable · wash/Pyth fail-closed or live · no invent-a-green"
    : "NestUSD must stay unavailable until verified endpoint";

  const broadcastStatus: GoalStatus = input.broadcastPaused ? "done" : "blocked";
  const broadcastDetail = input.broadcastPaused
    ? "Broadcast paused by policy until keys + funded ≤~$1 demo"
    : "Broadcast not paused — set BROADCAST_PAUSED=true";

  return [
    {
      id: "empire",
      title: "Live Empire integrations",
      status: empireStatus,
      detail: empireDetail,
    },
    {
      id: "multi_tenant",
      title: "Multi-tenant sessions",
      status: multiTenantStatus,
      detail: multiTenantDetail,
    },
    {
      id: "premium_ui",
      title: "Premium UI approve gate",
      status: uiStatus,
      detail: uiDetail,
    },
    {
      id: "spend_cap",
      title: "≤~$1 mainnet · quote-only",
      status: spendStatus,
      detail: spendDetail,
    },
    {
      id: "honesty",
      title: "Honest security",
      status: honestyStatus,
      detail: honestyDetail,
    },
    {
      id: "broadcast",
      title: "Broadcast paused until keys",
      status: broadcastStatus,
      detail: broadcastDetail,
    },
  ];
}

export function summarizeGoalSmoke(rows: GoalRequirementRow[]): {
  done: number;
  partial: number;
  blocked: number;
  shipReady: boolean;
} {
  const done = rows.filter((r) => r.status === "done").length;
  const partial = rows.filter((r) => r.status === "partial").length;
  const blocked = rows.filter((r) => r.status === "blocked").length;
  return {
    done,
    partial,
    blocked,
    /** Full Stocklana ship — every requirement done (Empire wash/Pyth + multi-tenant lit). */
    shipReady: done === rows.length && blocked === 0 && partial === 0,
  };
}
