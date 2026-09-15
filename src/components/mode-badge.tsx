import type { IntegrationMode } from "@/lib/adapters/types";
import { cn } from "@/lib/utils";

const TONE: Record<IntegrationMode, string> = {
  "mainnet-read": "status-green",
  "quote-only": "status-blue",
  fork: "status-blue",
  paper: "status-amber",
  unavailable: "status-neutral",
};

const LABEL: Record<IntegrationMode, string> = {
  "mainnet-read": "Mainnet read",
  "quote-only": "Quote only",
  fork: "Unfunded CPI",
  paper: "Paper",
  unavailable: "Unavailable",
};

export function ModeBadge({
  mode,
  className,
  children,
}: {
  mode: IntegrationMode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span className={cn("status-badge", TONE[mode], className)}>
      {children ?? LABEL[mode]}
    </span>
  );
}