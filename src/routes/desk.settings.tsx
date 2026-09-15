import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { Switch } from "@/components/ui/switch";
import { getSessionBundle, runDeskAgent } from "@/lib/desk.functions";

export const Route = createFileRoute("/desk/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FOLIO" },
      { name: "description", content: "Server session status and paper agent — no localStorage auth." },
    ],
  }),
  component: Page,
});

function Page() {
  const fetchSession = useServerFn(getSessionBundle);
  const runAgent = useServerFn(runDeskAgent);
  const { data } = useQuery({
    queryKey: ["session-bundle"],
    queryFn: () => fetchSession(),
    staleTime: 30_000,
  });
  const [prompt, setPrompt] = useState("truth AAPLx");
  const [agentOut, setAgentOut] = useState<string>("");
  const [busy, setBusy] = useState(false);

  return (
    <DeskShell eyebrow="Server preferences" title="Settings">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Mainnet read</ModeBadge>
        <ModeBadge mode="unavailable">Broadcast off</ModeBadge>
        <ModeBadge mode="paper">Paper agent</ModeBadge>
      </div>
      <div className="desk-grid">
        <Panel title="Network mode" meta={<StatusBadge tone="green">Safe default</StatusBadge>}>
          <div className="setting-row">
            <span>
              <b>Mainnet read</b>
              <small>Observe live market and ledger data</small>
            </span>
            <StatusBadge tone="green">Selected</StatusBadge>
          </div>
          <div className="setting-row">
            <span>
              <b>Broadcast</b>
              <small>Requires funding and explicit enablement</small>
            </span>
            <StatusBadge tone="neutral">
              {data?.networkPolicy.broadcast ? "Enabled" : "Unavailable"}
            </StatusBadge>
          </div>
          <div className="setting-row">
            <span>
              <b>Auth providers</b>
              <small>Privy + Supabase + FOLIO_SESSION_SECRET</small>
            </span>
            <StatusBadge tone={data?.auth.ok ? "green" : "amber"}>
              {data?.auth.ok
                ? "Keys present"
                : data && !data.auth.ok
                  ? data.auth.reason
                  : "Keys missing"}
            </StatusBadge>
          </div>
          <div className="setting-row">
            <span>
              <b>httpOnly session</b>
              <small>
                {data?.session.ok
                  ? `user ${data.session.data.userId.slice(0, 12)}…`
                  : data?.session && !data.session.ok
                    ? data.session.reason
                    : "No verified folio_session"}
              </small>
            </span>
            <StatusBadge
              tone={
                data?.auth.ok && data.auth.data.sessionReady
                  ? "green"
                  : "amber"
              }
            >
              {data?.auth.ok && data.auth.data.sessionReady
                ? "Ready"
                : "Not ready"}
            </StatusBadge>
          </div>
        </Panel>
        <Panel title="Policy preferences">
          <label className="setting-row">
            <span>
              <b>Corporate-action alerts</b>
              <small>
                {data?.preferences.ok
                  ? "Server-persisted"
                  : data && !data.preferences.ok ? data.preferences.reason : "Server prefs unavailable — not using localStorage"}
              </small>
            </span>
            <Switch
              checked={data?.preferences.ok ? data.preferences.data.corporateActionAlerts : true}
              disabled
            />
          </label>
          <label className="setting-row">
            <span>
              <b>Strict fail-closed mode</b>
              <small>Stop when any required signal is unresolved</small>
            </span>
            <Switch
              checked={data?.preferences.ok ? data.preferences.data.strictFailClosed : true}
              disabled
            />
          </label>
        </Panel>
      </div>
      <Panel title="Paper agent" meta={<StatusBadge tone="blue">Caps · no broadcast</StatusBadge>}>
        <div className="form-grid">
          <label>
            Prompt
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </label>
          <button
            type="button"
            className="wallet-pill"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await runAgent({ data: { prompt } });
                setAgentOut(
                  res.ok
                    ? `${res.data.reply} (metered ~$${res.data.meteredCostUsd.toFixed(6)})`
                    : `${res.reason}${res.detail ? ` — ${res.detail}` : ""}`,
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Running…" : "Run paper agent"}
          </button>
        </div>
        {agentOut ? <p className="mt-3 text-sm">{agentOut}</p> : null}
      </Panel>
    </DeskShell>
  );
}
