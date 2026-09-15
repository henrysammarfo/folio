import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { DeskShell, Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";
import { ModeBadge } from "@/components/mode-badge";
import { Switch } from "@/components/ui/switch";
import {
  bindWatchWallet,
  clearFolioSession,
  clearWatchWallet,
  createSessionFromPrivyToken,
  getSessionBundle,
  runDeskAgent,
} from "@/lib/desk.functions";

export const Route = createFileRoute("/desk/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FOLIO" },
      {
        name: "description",
        content: "Server session status and paper agent — no localStorage auth.",
      },
    ],
  }),
  /** Prefetch session/auth/broadcast honesty for first paint. */
  loader: async () => getSessionBundle(),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const queryClient = useQueryClient();
  const fetchSession = useServerFn(getSessionBundle);
  const runAgent = useServerFn(runDeskAgent);
  const createSession = useServerFn(createSessionFromPrivyToken);
  const clearSession = useServerFn(clearFolioSession);
  const bindWatch = useServerFn(bindWatchWallet);
  const clearWatch = useServerFn(clearWatchWallet);
  const { data, refetch } = useQuery({
    queryKey: ["session-bundle"],
    queryFn: () => fetchSession(),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 30_000,
  });
  const [prompt, setPrompt] = useState("truth AAPLx");
  const [agentOut, setAgentOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [privyToken, setPrivyToken] = useState("");
  const [sessionMsg, setSessionMsg] = useState<string>("");
  const [sessionBusy, setSessionBusy] = useState(false);
  const [watchWalletInput, setWatchWalletInput] = useState("");
  const [watchMsg, setWatchMsg] = useState("");
  const [watchBusy, setWatchBusy] = useState(false);
  const tenants = data?.session.ok ? data.session.data.tenants : [];

  return (
    <DeskShell eyebrow="Server preferences" title="Settings">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Mainnet read</ModeBadge>
        <ModeBadge mode={data?.networkPolicy.broadcast ? "mainnet-read" : "unavailable"}>
          {data?.networkPolicy.broadcast ? "Broadcast armed" : "Broadcast off"}
        </ModeBadge>
        <ModeBadge mode={data?.auth.ok ? "mainnet-read" : "unavailable"}>
          {data?.auth.ok ? "Auth keys present" : "Auth fail-closed"}
        </ModeBadge>
        <ModeBadge mode={data?.sessionSecretPresent ? "mainnet-read" : "unavailable"}>
          {data?.sessionSecretPresent
            ? "Watch-wallet secret set"
            : "Watch-wallet secret missing"}
        </ModeBadge>
        <ModeBadge mode="paper">Paper agent</ModeBadge>
      </div>

      <Panel
        title="Production readiness"
        meta={<StatusBadge tone="amber">Henry actions</StatusBadge>}
      >
        <p className="mb-3 text-sm opacity-80">
          Fail-closed checklist for Stocklana production. Missing keys stay unavailable — we do
          not invent wash clears, multi-tenant sessions, or broadcast.
        </p>
        <div className="policy-list">
          <p>
            <span>FOLIO_SESSION_SECRET (Vercel)</span>
            <b>
              {data?.readiness.sessionSecretPresent
                ? "Set · watch-wallet bind ready"
                : "Missing · set ≥16 chars on Vercel"}
            </b>
          </p>
          <p>
            <span>BITQUERY_API_KEY</span>
            <b>
              {data?.readiness.bitqueryKeyPresent
                ? "Set · wash tape live"
                : "Missing · wash fail-closed"}
            </b>
          </p>
          <p>
            <span>PYTH_API_KEY</span>
            <b>
              {data?.readiness.pythApiKeyPresent
                ? "Set · Hermes equity reference live"
                : "Missing · Pyth diverge fail-closed"}
            </b>
          </p>
          <p>
            <span>Privy (PRIVY_APP_ID / SECRET)</span>
            <b>
              {data?.readiness.privyConfigured
                ? "Configured"
                : "Missing · multi-tenant fail-closed"}
            </b>
          </p>
          <p>
            <span>Supabase URL + keys</span>
            <b>
              {data?.readiness.supabaseConfigured
                ? "Configured"
                : "Missing · tenants fail-closed"}
            </b>
          </p>
          <p>
            <span>Broadcast</span>
            <b>
              {data?.readiness.broadcastPaused
                ? "Paused · ≤~$1 · quote-only"
                : "Policy off until funded"}
            </b>
          </p>
          <p>
            <span>Lab premium UI</span>
            <b>
              Awaiting Henry candidate id — <a href="/lab/ui">/lab/ui</a> ·{" "}
              <a href="/lab/shaders">/lab/shaders</a>
            </b>
          </p>
          <p className="mt-3 text-sm opacity-80">
            Key paste order (Bitquery → Pyth → Privy → Supabase):{" "}
            <code>docs/KEYS_LANDING.md</code> · <code>npm run keys</code>
          </p>
        </div>
      </Panel>

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
              tone={data?.auth.ok && data.auth.data.sessionReady ? "green" : "amber"}
            >
              {data?.auth.ok && data.auth.data.sessionReady ? "Ready" : "Not ready"}
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
                  : data && !data.preferences.ok
                    ? data.preferences.reason
                    : "Server prefs unavailable — not using localStorage"}
              </small>
            </span>
            <Switch
              checked={
                data?.preferences.ok ? data.preferences.data.corporateActionAlerts : true
              }
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

      <Panel
        title="Bind Privy → httpOnly session"
        meta={<StatusBadge tone="amber">Fail-closed without keys</StatusBadge>}
      >
        <p className="mb-3 text-sm opacity-80">
          Paste a Privy access token only after Privy + Supabase + FOLIO_SESSION_SECRET are set.
          FOLIO mints an httpOnly <code>folio_session</code> cookie — never localStorage auth.
        </p>
        <div className="form-grid">
          <label>
            Privy access token
            <input
              value={privyToken}
              onChange={(e) => setPrivyToken(e.target.value)}
              placeholder="eyJ… (server-verified)"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="wallet-pill"
            disabled={sessionBusy || !privyToken.trim()}
            onClick={async () => {
              setSessionBusy(true);
              setSessionMsg("");
              try {
                const res = await createSession({
                  data: { accessToken: privyToken.trim() },
                });
                if (res.ok) {
                  setSessionMsg(
                    `Session bound for ${res.data.session.userId.slice(0, 16)}… — httpOnly cookie set.`,
                  );
                  setPrivyToken("");
                  await queryClient.invalidateQueries({ queryKey: ["session-bundle"] });
                  await refetch();
                } else {
                  setSessionMsg(
                    `${res.reason}${res.detail ? ` — ${res.detail}` : ""}`,
                  );
                }
              } finally {
                setSessionBusy(false);
              }
            }}
          >
            {sessionBusy ? "Verifying…" : "Mint httpOnly session"}
          </button>
        </div>
        {sessionMsg ? <p className="mt-3 text-sm">{sessionMsg}</p> : null}
        <div className="mt-4">
          <b className="text-sm">Tenant memberships</b>
          {tenants.length === 0 ? (
            <p className="mt-1 text-sm opacity-80">
              None resolved — fail-closed empty until Supabase{" "}
              <code>tenant_members</code> rows exist for this Privy subject.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {tenants.map((t) => (
                <li key={`${t.tenantId}:${t.userId}`}>
                  <code>{t.tenantId.slice(0, 8)}…</code> · {t.role}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="wallet-pill mt-3"
            disabled={sessionBusy || !(data?.session.ok)}
            onClick={async () => {
              setSessionBusy(true);
              setSessionMsg("");
              try {
                const res = await clearSession();
                setSessionMsg(
                  res.ok
                    ? res.data.note
                    : "Failed to clear session",
                );
                await queryClient.invalidateQueries({ queryKey: ["session-bundle"] });
                await refetch();
              } finally {
                setSessionBusy(false);
              }
            }}
          >
            Clear httpOnly session
          </button>
        </div>
      </Panel>

      
      <Panel
        title="Watch wallet (mainnet-read qty)"
        meta={
          <StatusBadge tone={data?.sessionSecretPresent ? "green" : "amber"}>
            {data?.sessionSecretPresent ? "Secret ready" : "Secret missing"}
          </StatusBadge>
        }
      >
        <p className="mb-3 text-sm opacity-80">
          Bind a Solana pubkey for mainnet token-balance reads on Positions. Requires{" "}
          <code>FOLIO_SESSION_SECRET</code> only — this is <b>not</b> multi-tenant Privy auth.
          {data?.sessionSecretPresent
            ? null
            : " Set FOLIO_SESSION_SECRET (≥16) in Vercel env to enable bind on the public demo."}{" "}
          Currently:{" "}
          {data?.watchWallet ? (
            <code>{data.watchWallet.slice(0, 4)}…{data.watchWallet.slice(-4)}</code>
          ) : (
            "none"
          )}
        </p>
        <div className="form-grid">
          <label>
            Wallet pubkey
            <input
              value={watchWalletInput}
              onChange={(e) => setWatchWalletInput(e.target.value)}
              placeholder="Base58 pubkey"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="wallet-pill"
            disabled={
              watchBusy || !watchWalletInput.trim() || !data?.sessionSecretPresent
            }
            onClick={async () => {
              setWatchBusy(true);
              setWatchMsg("");
              try {
                const res = await bindWatch({ data: { wallet: watchWalletInput.trim() } });
                if (res.ok) {
                  setWatchMsg(res.data.note);
                  setWatchWalletInput("");
                  await queryClient.invalidateQueries({ queryKey: ["session-bundle"] });
                  await queryClient.invalidateQueries({ queryKey: ["positions-bundle"] });
                  await refetch();
                } else {
                  setWatchMsg(`${res.reason}${res.detail ? ` — ${res.detail}` : ""}`);
                }
              } finally {
                setWatchBusy(false);
              }
            }}
          >
            {watchBusy ? "Binding…" : "Bind watch wallet"}
          </button>
          <button
            type="button"
            className="wallet-pill"
            disabled={watchBusy || !data?.watchWallet}
            onClick={async () => {
              setWatchBusy(true);
              setWatchMsg("");
              try {
                const res = await clearWatch();
                setWatchMsg(res.ok ? res.data.note : "Failed to clear watch wallet");
                await queryClient.invalidateQueries({ queryKey: ["session-bundle"] });
                await queryClient.invalidateQueries({ queryKey: ["positions-bundle"] });
                await refetch();
              } finally {
                setWatchBusy(false);
              }
            }}
          >
            Clear watch wallet
          </button>
        </div>
        {watchMsg ? <p className="mt-3 text-sm">{watchMsg}</p> : null}
      </Panel>

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
