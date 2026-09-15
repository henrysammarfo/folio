import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/folio-brand";

/** Shared approve-gate instructions — premium chrome stays off until Henry replies with an id. */
export function LabApprovePanel({
  kind,
  ids,
}: {
  kind: "ui" | "shaders";
  ids: readonly string[];
}) {
  const other =
    kind === "ui"
      ? { to: "/lab/shaders" as const, label: "Shader lab" }
      : { to: "/lab/ui" as const, label: "UI lab" };
  const [copied, setCopied] = useState<string | null>(null);

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
      window.setTimeout(() => setCopied((cur) => (cur === id ? null : cur)), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <aside className="lab-approve-panel" aria-label="How to approve">
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge tone="blue">Awaiting Henry</StatusBadge>
        <StatusBadge tone="neutral">Nothing merges without your id</StatusBadge>
      </div>
      <h2 className="lab-approve-title">How to approve (one minute)</h2>
      <ol className="lab-approve-steps">
        <li>Look at the candidates below.</li>
        <li>
          Pick <b>one</b> id
          {kind === "ui" ? " for desk chrome" : " for backdrop only"}.
        </li>
        <li>
          Reply in Cursor chat with that id + a screenshot (example:{" "}
          <code>{ids[0]}</code>).
        </li>
      </ol>
      <p className="lab-approve-ids">
        <span>Ids:</span>{" "}
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            className="lab-id-copy"
            onClick={() => void copyId(id)}
            aria-label={`Copy candidate id ${id}`}
          >
            <code>{id}</code>
            <span className="lab-id-copy-hint">
              {copied === id ? "copied" : "copy"}
            </span>
          </button>
        ))}
      </p>
      <p className="lab-approve-foot">
        Also review the{" "}
        <Link to={other.to} className="underline">
          {other.label}
        </Link>
        . Home CTAs: Approve desk UI · Approve shaders. Production hero stays locked.
      </p>
    </aside>
  );
}
