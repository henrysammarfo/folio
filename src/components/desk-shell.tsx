import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, BriefcaseBusiness, CircleDollarSign, LayoutDashboard, Search, Settings, ShieldCheck, ShoppingBag } from "lucide-react";
import { FolioMark, StatusBadge } from "./folio-brand";

const links = [
  ["Overview", "/desk", LayoutDashboard],
  ["Acquire", "/desk/acquire", ShoppingBag],
  ["Positions", "/desk/positions", BriefcaseBusiness],
  ["Credit", "/desk/credit", CircleDollarSign],
  ["Activity", "/desk/activity", Activity],
  ["Settings", "/desk/settings", Settings],
] as const;

export function DeskShell({ title, eyebrow, children, actions }: { title: string; eyebrow: string; children: React.ReactNode; actions?: React.ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="desk-layout">
      <aside className="desk-sidebar">
        <Link to="/" className="desk-logo"><FolioMark /><span>FOLIO</span></Link>
        <nav aria-label="Desk navigation">{links.map(([label, to, Icon]) => {
          const active = to === "/desk" ? path === to : path.startsWith(to);
          return <Link key={to} to={to} className={`desk-nav-link ${active ? "desk-nav-active" : ""}`}><Icon />{label}</Link>;
        })}</nav>
        <div className="desk-sidebar-foot"><StatusBadge tone="green">Mainnet read</StatusBadge><p>Broadcast disabled</p></div>
      </aside>
      <div className="desk-main">
        <header className="desk-topbar">
          <div className="desk-search"><Search /><input aria-label="Search positions" placeholder="Search positions, events…" /></div>
          <div className="desk-network"><span className="live-dot" /> Mainnet · read only</div>
          <button className="wallet-pill" type="button">7vF…2ka</button>
        </header>
        <main className="desk-content">
          <div className="desk-heading"><div><p>{eyebrow}</p><h1>{title}</h1></div>{actions}</div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function Panel({ title, meta, children, className = "" }: { title: string; meta?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><header><h2>{title}</h2>{meta}</header><div className="panel-body">{children}</div></section>;
}

export const positions = [
  { symbol: "AAPLx", name: "Apple xStock", raw: "12.5000", multiplier: "4.0000×", economic: "50.0000", value: "$11,700.50", health: "Verified" },
  { symbol: "NVDAx", name: "NVIDIA xStock", raw: "8.2400", multiplier: "1.0000×", economic: "8.2400", value: "$1,455.18", health: "Verified" },
  { symbol: "TSLAx", name: "Tesla xStock", raw: "5.1000", multiplier: "1.0000×", economic: "5.1000", value: "$2,025.21", health: "Review" },
];