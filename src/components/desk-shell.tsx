import { Link, useLoaderData, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  BriefcaseBusiness,
  CircleDollarSign,
  House,
  PanelLeftClose,
  PanelLeft,
  Settings,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FolioMark } from "./folio-brand";
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
  getDeskAccess,
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
import type { NetroOwnershipSummary } from "@/lib/netro-ownership";
import { buildNetroOwnershipSummary } from "@/lib/netro-ownership";

const SIDEBAR_KEY = "folio.fx.sidebar.collapsed";

/** Web2 consumer IA — Cash App / Robinhood style primary destinations */
const links = [
  ["Home", "/desk", House],
  ["Holdings", "/desk/positions", BriefcaseBusiness],
  ["Buy", "/desk/acquire", ArrowUpRight],
  ["Borrow", "/desk/credit", CircleDollarSign],
  ["Activity", "/desk/activity", Activity],
  ["Account", "/desk/settings", Settings],
] as const;

function previewShaderVariant(
  labShader: LabShaderId | null,
  labUi: LabUiId | null,
): ShaderLabVariant | null {
  if (labShader) return labShader;
  if (labUi === "cinematic-landing-21st") return "ink-ledger";
  return null;
}

function linkActive(path: string, to: string) {
  return to === "/desk"
    ? path === to || path === "/desk/"
    : path.startsWith(to);
}

export function DeskShell({
  title,
  children,
  actions,
}: {
  title: string;
  eyebrow?: string;
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
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const fetchTruth = useServerFn(getTruthBundle);
  const fetchApprovals = useServerFn(getLabApprovals);
  const fetchNetwork = useServerFn(getNetworkBundle);
  const fetchCredit = useServerFn(getCreditBundle);
  const fetchAcquire = useServerFn(getAcquireBundle);
  const fetchPositions = useServerFn(getPositionsBundle);
  const fetchEmpireReadiness = useServerFn(getEmpireReadiness);
  const fetchDeskAccess = useServerFn(getDeskAccess);
  const deskSeed = useLoaderData({ from: "/desk" });
  const approvalsSeed = deskSeed.approvals;
  const readinessSeed = deskSeed.readiness;
  const truthSeed = deskSeed.truth;
  const networkSeed = deskSeed.network;
  const creditSeed = deskSeed.credit;
  const acquireSeed = deskSeed.acquire;
  const positionsSeed = deskSeed.positions;

  const { data: deskAccess } = useQuery({
    queryKey: ["desk-access"],
    queryFn: () => fetchDeskAccess(),
    staleTime: 30_000,
  });

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

  useEffect(() => {
    try {
      setSideCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleSidebar() {
    setSideCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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
  const effectiveUi = previewing ? labUi : approvedUi;
  const effectiveShader = previewing ? labShader : approvedShader;
  const liveShader = previewShaderVariant(effectiveShader, effectiveUi);
  const isDeskOverview = path === "/desk" || path === "/desk/";
  const showNetroCanvas = effectiveUi === "netro-density" && isDeskOverview;
  const showJournal = effectiveUi === "trade-journal-21st" && isDeskOverview;
  const productionChrome = !previewing && (approvedUi != null || approvedShader != null);

  const truth = useQuery({
    queryKey: ["truth-bundle", "desk-lab-preview", "AAPLx"],
    queryFn: () => fetchTruth({ data: { symbol: "AAPLx" } }),
    enabled: showNetroCanvas,
    initialData: showNetroCanvas ? truthSeed : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 30_000,
  });
  const network = useQuery({
    queryKey: ["network-matrix-desk", "netro-surface"],
    queryFn: () => fetchNetwork(),
    enabled: showNetroCanvas,
    initialData: showNetroCanvas ? networkSeed : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const credit = useQuery({
    queryKey: ["credit-bundle", "netro-surface", inspectSearch ?? ""],
    queryFn: () => fetchCredit({ data: { inspectWallet: inspectSearch } }),
    enabled: showNetroCanvas,
    initialData: showNetroCanvas && !inspectSearch ? creditSeed : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
    refetchOnMount: "always",
  });
  const positions = useQuery({
    queryKey: ["positions-bundle", "netro-surface", inspectSearch ?? ""],
    queryFn: () => fetchPositions({ data: { inspectWallet: inspectSearch } }),
    enabled: showNetroCanvas,
    initialData: showNetroCanvas && !inspectSearch ? positionsSeed : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 15_000,
    refetchOnMount: "always",
  });
  useQuery({
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
    initialData: showNetroCanvas ? acquireSeed : undefined,
    initialDataUpdatedAt: Date.now(),
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
  const scaledUiCompare = truth.data?.scaledUiCompare;
  const scaledUiStripLabel = scaledUiCompare
    ? scaledUiCompare.status === "match"
      ? `On-chain OK · ${scaledUiCompare.note}`
      : scaledUiCompare.status === "mismatch"
        ? `On-chain mismatch · ${scaledUiCompare.note}`
        : `On-chain pending · ${scaledUiCompare.note}`
    : "On-chain pending";

  return (
    <div
      className="fx-desk"
      data-lab-ui={effectiveUi ?? undefined}
      data-lab-shader={effectiveShader ?? undefined}
      data-lab-plasma={liveShader ? "1" : undefined}
      data-lab-approved={productionChrome ? "1" : undefined}
      data-netro-surface={showNetroCanvas ? "1" : undefined}
      data-sidebar-collapsed={sideCollapsed ? "1" : "0"}
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
          </span>
          <button type="button" onClick={exitPreview}>
            Exit
          </button>
        </div>
      ) : null}

      {deskAccess && !deskAccess.signedIn ? (
        <div className="fx-access-banner" role="status">
          <span>{deskAccess.note}</span>
          <Link to="/desk/settings">Account</Link>
        </div>
      ) : deskAccess?.signedIn && deskAccess.tenantCount > 0 ? (
        <div className="fx-access-banner fx-access-banner-in" role="status">
          <span>{deskAccess.note}</span>
          <Link to="/desk/settings">Manage</Link>
        </div>
      ) : null}

      <header className="fx-top fx-top-netro">
        <Link to="/" className="fx-brand" aria-label="FOLIO home">
          <span className="fx-brand-badge" aria-hidden>
            <FolioMark className="fx-brand-mark" title="FOLIO" />
          </span>
          <b>FOLIO</b>
        </Link>

        <nav className="fx-top-nav" aria-label="Desk">
          {links.map(([label, to]) => {
            const active = linkActive(path, to);
            return (
              <Link
                key={to}
                to={to}
                className={`fx-top-pill${active ? " is-active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="fx-top-actions">
          {actions}
          <Link to="/desk/acquire" className="fx-btn fx-btn-primary fx-btn-sm">
            Buy
          </Link>
          <DeskWalletPill />
        </div>
      </header>

      <div className="fx-body">
        <aside className="fx-side" aria-label="Desk sidebar">
          <button
            type="button"
            className="fx-side-collapse"
            onClick={toggleSidebar}
            aria-pressed={sideCollapsed}
            aria-label={sideCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            title={sideCollapsed ? "Expand" : "Minimize"}
          >
            {sideCollapsed ? (
              <PanelLeft size={16} strokeWidth={2} aria-hidden />
            ) : (
              <PanelLeftClose size={16} strokeWidth={2} aria-hidden />
            )}
            <span className="fx-side-collapse-label">
              {sideCollapsed ? "Expand" : "Minimize"}
            </span>
          </button>
          <nav className="fx-side-nav">
            {links.map(([label, to, Icon]) => {
              const active = linkActive(path, to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`fx-side-link${active ? " is-active" : ""}`}
                  title={label}
                >
                  <Icon size={18} strokeWidth={1.85} aria-hidden />
                  <span className="fx-side-label">{label}</span>
                </Link>
              );
            })}
          </nav>
          <Link
            to="/desk/settings"
            className="fx-side-profile"
            title="Account"
          >
            <span className="fx-side-avatar" aria-hidden>
              F
            </span>
            <span className="fx-side-profile-copy">
              <strong>Account</strong>
              <small>Profile &amp; settings</small>
            </span>
          </Link>
        </aside>

        <div className="fx-stage">
          {liveShader ? (
            <div className="desk-plasma-layer" aria-hidden>
              <ShaderBackground
                variant={liveShader}
                className="desk-plasma-canvas"
              />
            </div>
          ) : null}
          <main className="fx-main" aria-label={title}>
            {showNetroCanvas ? (
              <div className="desk-lab-netro" data-testid="desk-lab-netro">
                <NetroDensityCanvas
                  multiplierLabel={multiplierLabel}
                  gates={netroGates}
                  ownership={ownership}
                  initialInspect={inspectSearch}
                  scaledUiStripLabel={scaledUiStripLabel}
                  enablePaperAgent
                />
              </div>
            ) : (
              <>
                {showJournal ? (
                  <div
                    className="desk-lab-journal"
                    data-testid="desk-lab-journal"
                  >
                    <FolioTradeJournalLab />
                  </div>
                ) : null}
                {children}
              </>
            )}
          </main>
        </div>
      </div>

      <nav className="fx-tabs" aria-label="Desk">
        {links.map(([label, to, Icon]) => {
          const active = linkActive(path, to);
          return (
            <Link
              key={to}
              to={to}
              className={`fx-tab${active ? " is-active" : ""}`}
            >
              <Icon size={20} strokeWidth={1.85} aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Soft section used on ops wall and nested blocks */
export function Panel({
  title,
  meta,
  children,
  className = "",
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!collapsible) {
    return (
      <section className={`fx-panel ${className}`}>
        <header className="fx-panel-head">
          <h2>{title}</h2>
          {meta}
        </header>
        <div className="fx-panel-body">{children}</div>
      </section>
    );
  }
  return (
    <section
      className={`fx-panel fx-panel-fold ${className}`}
      data-open={open ? "1" : "0"}
    >
      <header
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="fx-panel-head"
      >
        <h2>{title}</h2>
        {meta}
        <span className="fx-panel-toggle">{open ? "Hide" : "Show"}</span>
      </header>
      <div className="fx-panel-body">{children}</div>
    </section>
  );
}
