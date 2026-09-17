import { Link } from "@tanstack/react-router";

export function FolioMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 8h32v10H20v10h17v10H20v18H8V8Z" fill="currentColor" />
      <path d="M47 19l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="currentColor" />
      <path d="M41 43h15v13H41z" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

export function Wordmark({ to = "/", inverse = false }: { to?: string; inverse?: boolean }) {
  return (
    <Link to={to} className={`brand-lockup ${inverse ? "text-primary-foreground" : "text-foreground"}`}>
      <FolioMark className="size-7" />
      <span>FOLIO</span>
    </Link>
  );
}

export type StatusTone = "green" | "amber" | "blue" | "neutral";

export function StatusBadge({
  children,
  tone = "neutral",
  title,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  title?: string;
}) {
  return (
    <span className={`status-badge status-${tone}`} title={title}>
      {children}
    </span>
  );
}