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

const links = [
  ["Home", "/desk", LayoutDashboard],
  ["Buy", "/desk/acquire", ShoppingBag],
  ["Holdings", "/desk/positions", BriefcaseBusiness],
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

export function DeskShell({
  title,
  children,
  actions,
}: {
  title: string;
  /** @deprecated ignored — product pages own their own page titles */
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
  const fetchTruth = useServerFn(getTruthBundle);
  const fetchApprovals = useServerFn(getLabApprovals);
  const fetchNetwork = useServerFn(getNetworkBundle);
  const fetchCredit = useServerFn(getCreditBundle);
  const fetchAcquire = useServerFn(getAcquireBundle);
  const fetchPositions = useServerFn(getPositionsBundle);
  const fetchEmpireReadiness = useServerFn(getEmpireReadiness);
  const deskSeed = useLoaderData({ from: "/desk" });
  const approvalsSeed = deskSeed.approvals;
  const readinessSeed = deskSeed.readiness;
  const truthSeed = deskSeed.truth;
  const networkSeed = deskSeed.network;
  const creditSeed = deskSeed.credit;
  const acquireSeed = deskSeed.acquire;
  const positionsSeed = deskSeed.positions;

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
      className="app-desk"
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
          </span>
          <button type="button" onClick={exitPreview}>
            Exit
          </button>
        </div>
      ) : null}

      <aside className="app-rail" aria-label="Desk">
        <Link to="/" className="app-rail-brand">
          <FolioMark className="app-rail-mark" title="FOLIO" />
          <span>FOLIO</span>
        </Link>
        <nav className="app-rail-nav">
          {links.map(([label, to, Icon]) => {
            const active = to === "/desk" ? path === to || path === "/desk/" : path.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`app-rail-link${active ? " is-active" : ""}`}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="app-stage">
        {liveShader ? (
          <div className="desk-plasma-layer" aria-hidden>
            <ShaderBackground variant={liveShader} className="desk-plasma-canvas" />
          </div>
        ) : null}
        <header className="app-top">
          <p className="app-top-title">{showNetroCanvas ? "Home" : title}</p>
          <div className="app-top-actions">
            <Link to="/desk/acquire" className="app-buy">
              Buy
            </Link>
            <DeskWalletPill />
          </div>
        </header>
        <main className="app-main">
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
                <div className="desk-lab-journal" data-testid="desk-lab-journal">
                  <FolioTradeJournalLab />
                </div>
              ) : null}
              {actions ? <div className="app-page-actions">{actions}</div> : null}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/** Minimal section frame — prefer bare lists over heavy panels on product pages. */
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
      <section className={`app-block ${className}`}>
        <header className="app-block-head">
          <h2>{title}</h2>
          {meta}
        </header>
        <div className="app-block-body">{children}</div>
      </section>
    );
  }
  return (
    <section
      className={`app-block app-block-fold ${className}`}
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
        className="app-block-head"
      >
        <h2>{title}</h2>
        {meta}
        <span className="app-block-toggle">{open ? "Hide" : "Show"}</span>
      </header>
      <div className="app-block-body">{children}</div>
    </section>
  );
}
