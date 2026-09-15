import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BriefcaseBusiness,
  CircleDollarSign,
  LayoutDashboard,
  Search,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FolioMark, StatusBadge } from "./folio-brand";
import {
  isLabPreviewActive,
  readLabShaderPick,
  readLabUiPick,
  stopLabPreview,
  type LabShaderId,
  type LabUiId,
} from "@/lib/lab-pick";

const links = [
  ["Overview", "/desk", LayoutDashboard],
  ["Acquire", "/desk/acquire", ShoppingBag],
  ["Positions", "/desk/positions", BriefcaseBusiness],
  ["Credit", "/desk/credit", CircleDollarSign],
  ["Activity", "/desk/activity", Activity],
  ["Settings", "/desk/settings", Settings],
] as const;

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
  const [labUi, setLabUi] = useState<LabUiId | null>(null);
  const [labShader, setLabShader] = useState<LabShaderId | null>(null);
  const [previewOn, setPreviewOn] = useState(false);

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

  const previewing = previewOn && (labUi != null || labShader != null);

  return (
    <div
      className="desk-layout"
      data-lab-ui={previewing && labUi ? labUi : undefined}
      data-lab-shader={previewing && labShader ? labShader : undefined}
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
            . Reply in chat with the id to approve a merge.
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
          <StatusBadge tone="green">Mainnet read</StatusBadge>
          <p>Broadcast disabled</p>
          <p>
            <Link to="/lab/ui">Approve lab UI</Link> ·{" "}
            <Link to="/lab/shaders">shaders</Link>
          </p>
        </div>
      </aside>
      <div className="desk-main">
        <header className="desk-topbar">
          <div className="desk-search">
            <Search />
            <input aria-label="Search positions" placeholder="Search positions, events…" />
          </div>
          <div className="desk-network">
            <span className="live-dot" /> Mainnet · read only
          </div>
          <button className="wallet-pill" type="button">
            7vF…2ka
          </button>
        </header>
        <main className="desk-content">
          <div className="desk-heading">
            <div>
              <p>{eyebrow}</p>
              <h1>{title}</h1>
            </div>
            {actions}
          </div>
          {children}
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
