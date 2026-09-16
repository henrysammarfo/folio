import { Link, useLoaderData, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  BriefcaseBusiness,
  CircleDollarSign,
  LayoutDashboard,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FolioMark, StatusBadge } from "./folio-brand";
import { DeskWalletPill } from "./desk-wallet-pill";
import {
  ShaderBackground,
  type ShaderLabVariant,
} from "@/components/lab/shader-background";
import { NetroDensityCanvas } from "@/components/lab/netro-density-canvas";
import { FolioTradeJournalLab } from "@/components/lab/folio-trade-journal-lab";
import {
  getAcquireBundle,
  getCreditBundle,
  getLabApprovals,
  getNetworkBundle,
  getPositionsBundle,
  getEmpireReadiness,
  getTruthBundle,
} from "@/lib/desk.functions";
import {
  isLabPreviewActive,
  readLabShaderPick,
  readLabUiPick,
  stopLabPreview,
  type LabShaderId,
  type LabUiId,
} from "@/lib/lab-pick";
import { buildNetroLiveGateLabels } from "@/lib/netro-live-gates";
import {
  buildNetroKeysReadiness,
  type NetroKeysReadiness,
} from "@/lib/netro-keys-readiness";
import type { NetroOwnershipSummary } from "@/lib/netro-ownership";
import { buildNetroOwnershipSummary } from "@/lib/netro-ownership";

const links = [
  ["Overview", "/desk", LayoutDashboard],
  ["Acquire", "/desk/acquire", ShoppingBag],
  ["Positions", "/desk/positions", BriefcaseBusiness],
  ["Credit", "/desk/credit", CircleDollarSign],
  ["Activity", "/desk/activity", Activity],
  ["Settings", "/desk/settings", Settings],
] as const;

function previewShaderVariant(
  labShader: LabShaderId | null,
  labUi: LabUiId | null,
): ShaderLabVariant | null {
  if (labShader) return labShader;
  // Cinematic 21st UI pick → live Plasma 24346 (ink-ledger), not a CSS fake
  if (labUi === "cinematic-landing-21st") return "ink-ledger";
  return null;
}

export function DeskShell({
  title,
  eyebrow,
  children,
  actions,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const inspectSearch = useRouterState({
    select: (state) => {
      const raw = state.location.search as { inspect?: unknown };
      return typeof raw.inspect === "string" && raw.inspect.trim()
        ? raw.inspect.trim().slice(0, 64)
        : undefined;
    },
  });
  const [labUi, setLabUi] = useState<LabUiId | null>(null);
  const [labShader, setLabShader] = useState<LabShaderId | null>(null);
  const [previewOn, setPreviewOn] = useState(false);
  const fetchTruth = useServerFn(getTruthBundle);
  const fetchApprovals = useServerFn(getLabApprovals);
  const fetchNetwork = useServerFn(getNetworkBundle);
  const fetchCredit = useServerFn(getCreditBundle);
  const fetchAcquire = useServerFn(getAcquireBundle);
  const fetchPositions = useServerFn(getPositionsBundle);
  const fetchEmpireReadiness = useServerFn(getEmpireReadiness);
  /** Parent `/desk` loader — SSR seed so approved Netro + keys strip paint immediately. */
  const deskSeed = useLoaderData({ from: "/desk" });
  const approvalsSeed = deskSeed.approvals;
  const readinessSeed = deskSeed.readiness;

  useEffect(() => {
    const active = isLabPreviewActive();
    setPreviewOn(active);
    if (!active) {
      setLabUi(null);
      setLabShader(null);
      return;
    }
    setLabUi(readLabUiPick());
    setLabShader(readLabShaderPick());
  }, [path]);

  function exitPreview() {
    stopLabPreview();
    setPreviewOn(false);
    setLabUi(null);
    setLabShader(null);
  }

  const approvals = useQuery({
    queryKey: ["lab-approvals"],
    queryFn: () => fetchApprovals(),
    initialData: approvalsSeed,
    initialDataUpdatedAt: Date.now(),
    staleTime: 60_000,
  });
  const approvedUi = approvals.data?.approvedUi ?? null;
  const approvedShader = approvals.data?.approvedShader ?? null;

  const previewing = previewOn && (labUi != null || labShader != null);
  // Opt-in preview wins while active; else Henry-approved production chrome via env
  const effectiveUi = previewing ? labUi : approvedUi;
  const effectiveShader = previewing ? labShader : approvedShader;
  const liveShader = previewShaderVariant(effectiveShader, effectiveUi);
  // NetroBNB 12-col is the OVERVIEW surface only — never replace Acquire/Positions/etc.
  const isDeskOverview = path === "/desk" || path === "/desk/";
  const showNetroCanvas = effectiveUi === "netro-density" && isDeskOverview;
  const showJournal = effectiveUi === "trade-journal-21st" && isDeskOverview;
  const productionChrome = !previewing && (approvedUi != null || approvedShader != null);

  const truth = useQuery({
    queryKey: ["truth-bundle", "desk-lab-preview", "AAPLx"],
    queryFn: () => fetchTruth({ data: { symbol: "AAPLx" } }),
    enabled: showNetroCanvas,
    staleTime: 30_000,
  });
  const network = useQuery({
    queryKey: ["network-matrix-desk", "netro-surface"],
    queryFn: () => fetchNetwork(),
    enabled: showNetroCanvas,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const credit = useQuery({
    queryKey: ["credit-bundle", "netro-surface", inspectSearch ?? ""],
    queryFn: () => fetchCredit({ data: { inspectWallet: inspectSearch } }),
    enabled: showNetroCanvas,
    staleTime: 20_000,
  });
  const positions = useQuery({
    queryKey: ["positions-bundle", "netro-surface", inspectSearch ?? ""],
    queryFn: () =>
      fetchPositions({ data: { inspectWallet: inspectSearch } }),
    enabled: showNetroCanvas,
    staleTime: 15_000,
  });
  const session = useQuery({
    queryKey: ["empire-readiness", "netro-keys"],
    queryFn: () => fetchEmpireReadiness(),
    enabled: showNetroCanvas,
    initialData: readinessSeed,
    initialDataUpdatedAt: Date.now(),
    staleTime: 60_000,
  });
  const acquire = useQuery({
    queryKey: ["acquire-bundle", "netro-surface", "AAPLx", 1],
    queryFn: () => fetchAcquire({ data: { symbol: "AAPLx", spendUsdc: 1 } }),
    enabled: showNetroCanvas,
    staleTime: 15_000,
  });
  const mult = truth.data?.multiplier;
  const multiplierLabel = mult?.ok
    ? `${mult.data.currentMultiplier.toFixed(6)}× live`
    : "live pending";
  const jup = acquire.data?.jupiter;
  const netroGates = buildNetroLiveGateLabels({
    rows: network.data?.rows ?? [],
    broadcastPaused: network.data?.broadcastPaused !== false,
    kaminoMaxLtv: credit.data?.paper.maxLtvUsed ?? null,
    illustrativeBorrowUsd: credit.data?.paper.illustrativeBorrowUsd ?? null,
    creditQtyLabel: credit.data?.paper.label ?? null,
    jupiterOutUi: jup?.ok ? jup.data.outUiAmount : null,
    jupiterSource: jup?.ok ? jup.source : null,
    jupiterReason: jup && !jup.ok ? jup.reason : null,
  });
  const ownership: NetroOwnershipSummary = buildNetroOwnershipSummary({
    walletSource: positions.data?.walletSource ?? null,
    note: positions.data?.note ?? null,
    rows: positions.data?.rows ?? [],
  });
  const readiness = session.data;
  const keysReadiness: NetroKeysReadiness | null = readiness
    ? buildNetroKeysReadiness({
        bitqueryKeyPresent: readiness.bitqueryKeyPresent,
        pythApiKeyPresent: readiness.pythApiKeyPresent,
        privyConfigured: readiness.privyConfigured,
        supabaseConfigured: readiness.supabaseConfigured,
        supabaseJwtConfigured: readiness.supabaseJwtConfigured,
        sessionSecretPresent: readiness.sessionSecretPresent,
        broadcastPaused: readiness.broadcastPaused,
        jupiterKeyPresent: readiness.jupiterKeyPresent,
      })
    : null;
  const scaledUiCompare = truth.data?.scaledUiCompare;
  const scaledUiStripLabel = scaledUiCompare
    ? scaledUiCompare.status === "match"
      ? `API↔chain match · ${scaledUiCompare.note}`
      : scaledUiCompare.status === "mismatch"
        ? `API↔chain mismatch · ${scaledUiCompare.note}`
        : `Scaled UI ${scaledUiCompare.status} · ${scaledUiCompare.note}`
    : "Scaled UI pending";

  return (
    <div
      className="desk-layout"
      data-lab-ui={effectiveUi ?? undefined}
      data-lab-shader={effectiveShader ?? undefined}
      data-lab-plasma={liveShader ? "1" : undefined}
      data-lab-approved={productionChrome ? "1" : undefined}
      data-netro-surface={showNetroCanvas ? "1" : undefined}
    >
      {previewing ? (
        <div className="lab-preview-banner" role="status">
          <span>
            Lab preview (opt-in · not production)
            {labUi ? (
              <>
                {" "}
                · UI <code>{labUi}</code>
              </>
            ) : null}
            {labShader ? (
              <>
                {" "}
                · shader <code>{labShader}</code>
              </>
            ) : null}
            {liveShader ? <> · live WebGL Plasma</> : null}. Reply in chat with
            the id to approve a merge.
          </span>
          <span className="lab-preview-banner-actions">
            <Link to="/lab/ui" className="underline">
              Lab UI
            </Link>
            <button type="button" onClick={exitPreview}>
              Exit preview
            </button>
          </span>
        </div>
      ) : null}
      {productionChrome ? (
        <div className="lab-approved-banner" role="status">
          <span>
            Production lab chrome (Henry-approved)
            {approvedUi ? (
              <>
                {" "}
                · UI <code>{approvedUi}</code>
              </>
            ) : null}
            {approvedShader ? (
              <>
                {" "}
                · shader <code>{approvedShader}</code>
              </>
            ) : null}
            . Via <code>FOLIO_APPROVED_LAB_*</code>.
          </span>
          <Link to="/lab/ui" className="underline">
            Lab UI
          </Link>
        </div>
      ) : null}
      <aside className="desk-sidebar">
        <Link to="/" className="desk-logo">
          <FolioMark />
          <span>FOLIO</span>
        </Link>
        <nav aria-label="Desk navigation">
          {links.map(([label, to, Icon]) => {
            const active = to === "/desk" ? path === to : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`desk-nav-link ${active ? "desk-nav-active" : ""}`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="desk-sidebar-foot">
          <StatusBadge tone="blue">Quote-only</StatusBadge>
          <p>Broadcast disabled</p>
          <p>
            <Link to="/lab/ui">Approve lab UI</Link> ·{" "}
            <Link to="/lab/shaders">shaders</Link>
          </p>
        </div>
      </aside>
      <div className="desk-main">
        {liveShader ? (
          <div className="desk-plasma-layer" aria-hidden>
            <ShaderBackground
              variant={liveShader}
              className="desk-plasma-canvas"
            />
          </div>
        ) : null}
        <header className="desk-topbar">
          <div className="desk-search desk-search-policy" aria-label="Desk policy">
            Quote-only · broadcast off · ≤~$1
          </div>
          <div className="desk-network">
            <span className="live-dot" /> Mainnet read · no broadcast
          </div>
          <DeskWalletPill />
        </header>
        <main className="desk-content">
          {showNetroCanvas ? (
            /* Netro 12-col IS the desk surface — do not stack overview cards under it */
            <div className="desk-lab-netro" data-testid="desk-lab-netro">
              <NetroDensityCanvas
                multiplierLabel={multiplierLabel}
                gates={netroGates}
                ownership={ownership}
                keysReadiness={keysReadiness}
                initialInspect={inspectSearch}
                scaledUiStripLabel={scaledUiStripLabel}
                enablePaperAgent
              />
            </div>
          ) : (
            <>
              <div className="desk-heading">
                <div>
                  <p>{eyebrow}</p>
                  <h1>{title}</h1>
                </div>
                {actions}
              </div>
              {showJournal ? (
                <div className="desk-lab-journal" data-testid="desk-lab-journal">
                  <FolioTradeJournalLab />
                </div>
              ) : null}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function Panel({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header>
        <h2>{title}</h2>
        {meta}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
