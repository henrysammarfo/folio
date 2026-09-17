import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { StatusBadge } from "@/components/folio-brand";
import { getLabApprovals } from "@/lib/desk.functions";
import {
  chatReplyForPick,
  isLabShaderId,
  isLabUiId,
  readLabShaderPick,
  readLabUiPick,
  startLabPreview,
  writeLabShaderPick,
  writeLabUiPick,
  type LabShaderId,
  type LabUiId,
} from "@/lib/lab-pick";

/** Shared approve-gate instructions — production merge via FOLIO_APPROVED_LAB_* after Henry reply. */
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
  const [picked, setPicked] = useState<string | null>(null);
  const [replyCopied, setReplyCopied] = useState(false);
  const [approvedUi, setApprovedUi] = useState<string | null>(null);
  const [approvedShader, setApprovedShader] = useState<string | null>(null);
  const fetchApprovals = useServerFn(getLabApprovals);

  useEffect(() => {
    setPicked(kind === "ui" ? readLabUiPick() : readLabShaderPick());
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    void fetchApprovals().then((a) => {
      if (cancelled) return;
      setApprovedUi(a.approvedUi);
      setApprovedShader(a.approvedShader);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchApprovals]);

  const productionApproved =
    kind === "ui" ? approvedUi : approvedShader;
  const productionLabel =
    kind === "ui"
      ? approvedUi
        ? `Production · ${approvedUi}`
        : null
      : approvedShader
        ? `Production · ${approvedShader}`
        : null;

  async function copyText(text: string, mark: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(mark);
      window.setTimeout(() => setCopied((cur) => (cur === mark ? null : cur)), 1600);
    } catch {
      setCopied(null);
    }
  }

  function pickId(id: string) {
    if (kind === "ui" && isLabUiId(id)) {
      writeLabUiPick(id as LabUiId);
      setPicked(id);
      void copyText(chatReplyForPick("ui", id), `pick:${id}`);
      return;
    }
    if (kind === "shaders" && isLabShaderId(id)) {
      writeLabShaderPick(id as LabShaderId);
      setPicked(id);
      void copyText(chatReplyForPick("shaders", id), `pick:${id}`);
    }
  }

  async function copyReply() {
    if (!picked) return;
    const line = chatReplyForPick(kind, picked);
    try {
      await navigator.clipboard.writeText(line);
      setReplyCopied(true);
      window.setTimeout(() => setReplyCopied(false), 1600);
    } catch {
      setReplyCopied(false);
    }
  }

  return (
    <aside className="lab-approve-panel" aria-label="How to approve">
      <div className="mb-3 flex flex-wrap gap-2">
        {productionLabel ? (
          <StatusBadge tone="green">{productionLabel}</StatusBadge>
        ) : (
          <StatusBadge tone="blue">Awaiting Henry</StatusBadge>
        )}
        <StatusBadge tone="neutral">
          {productionApproved
            ? "FOLIO_APPROVED_LAB_* set on Vercel"
            : "Nothing merges without your chat reply"}
        </StatusBadge>
        {picked ? <StatusBadge tone="green">Picked {picked}</StatusBadge> : null}
      </div>
      <h2 className="lab-approve-title">
        {productionApproved ? "Production chrome live" : "How to approve (one minute)"}
      </h2>
      {productionApproved ? (
        <p className="lab-approve-foot" style={{ marginTop: 0 }}>
          {kind === "ui" ? (
            <>
              Desk overview mounts <code>{approvedUi}</code> via{" "}
              <code>FOLIO_APPROVED_LAB_UI</code>. Home Aionis hero stays preserved.
              Local Pick below is still opt-in preview only.
            </>
          ) : (
            <>
              Shader <code>{approvedShader}</code> is approved via{" "}
              <code>FOLIO_APPROVED_LAB_SHADER</code>. Local Pick remains opt-in.
            </>
          )}
        </p>
      ) : (
      <ol className="lab-approve-steps">
        <li>Look at the visual stages above.</li>
        <li>
          Tap <b>Pick</b> on <b>one</b> id
          {kind === "ui" ? " for desk chrome" : " for backdrop only"}.
          {kind === "ui" ? (
            <>
              {" "}
              Recommended for Stocklana desk: <code>netro-density</code> (full
              12-col mounts on Preview on desk).
            </>
          ) : null}
        </li>
        <li>
          Reply in Cursor chat with the copied line (example:{" "}
          <code>{chatReplyForPick(kind, ids[0] ?? "…")}</code>) + a screenshot.
        </li>
      </ol>
      )}
      <p className="lab-approve-ids">
        <span>Ids:</span>{" "}
        {ids.map((id) => (
          <span key={id} className="lab-id-actions">
            <button
              type="button"
              className="lab-id-copy"
              onClick={() => void copyText(id, id)}
              aria-label={`Copy candidate id ${id}`}
            >
              <code>{id}</code>
              {kind === "ui" && id === "netro-density" ? (
                <span className="lab-id-rec">rec</span>
              ) : null}
              <span className="lab-id-copy-hint">
                {copied === id || copied === `pick:${id}` ? "copied" : "copy"}
              </span>
            </button>
            <button
              type="button"
              className={`lab-id-pick ${picked === id ? "lab-id-pick-active" : ""}`}
              onClick={() => pickId(id)}
              aria-label={`Pick candidate ${id}`}
              aria-pressed={picked === id}
            >
              {picked === id ? "Picked" : "Pick"}
            </button>
          </span>
        ))}
      </p>
      {picked ? (
        <div className="lab-pick-next">
          <p>
            Chat reply ready: <code>{chatReplyForPick(kind, picked)}</code>
          </p>
          <div className="lab-pick-actions">
            <button type="button" className="lab-id-copy" onClick={() => void copyReply()}>
              {replyCopied ? "Reply copied" : "Copy reply line"}
            </button>
            <Link
              to="/desk"
              className="lab-preview-link"
              onClick={() => {
                startLabPreview();
                if (picked && kind === "ui" && isLabUiId(picked)) {
                  writeLabUiPick(picked);
                }
                if (picked && kind === "shaders" && isLabShaderId(picked)) {
                  writeLabShaderPick(picked);
                }
              }}
            >
              Preview on desk (opt-in · not merged)
            </Link>
          </div>
        </div>
      ) : null}
      <p className="lab-approve-foot">
        Also review the{" "}
        <Link to={other.to} className="underline">
          {other.label}
        </Link>
        . Home primary hero stays the Aionis brand-plane
        {productionApproved ? " (desk chrome already approved)." : " until you reply in chat."}
      </p>
    </aside>
  );
}
