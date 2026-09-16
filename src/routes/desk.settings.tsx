import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
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
  setActiveTenant,
  updateDeskPreferences,
} from "@/lib/desk.functions";
import { readLabShaderPick, readLabUiPick } from "@/lib/lab-pick";
import { canWriteDeskPrefs } from "@/lib/auth/role-gates";

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
  const savePrefs = useServerFn(updateDeskPreferences);
  const switchTenant = useServerFn(setActiveTenant);
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
  const [labUiPick, setLabUiPick] = useState<string | null>(null);
  const [labShaderPick, setLabShaderPick] = useState<string | null>(null);
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState("");
  const [tenantBusy, setTenantBusy] = useState(false);
  const [tenantMsg, setTenantMsg] = useState("");
  const tenants = data?.session.ok ? data.session.data.tenants : [];
  const activeTenantId = data?.activeTenantId ?? null;
  const prefsTenant =
    tenants.find((t) => t.tenantId === activeTenantId) ?? tenants[0] ?? null;
  const prefsRoleWritable = canWriteDeskPrefs(prefsTenant?.role);
  const prefsEditable = Boolean(
    data?.session.ok && prefsTenant && data?.auth.ok && prefsRoleWritable,
  );
  const prefsReadOnlyReason = !data?.session.ok
    ? null
    : !prefsTenant
      ? "No active tenant membership — prefs write refused."
      : !prefsRoleWritable
        ? `Role ${prefsTenant.role} is read-only — owner/trader required to save desk prefs.`
        : null;
  const corporateAlerts = data?.preferences.ok
    ? data.preferences.data.corporateActionAlerts
    : true;
  const strictFailClosed = data?.preferences.ok
    ? data.preferences.data.strictFailClosed
    : true;

  async function persistPrefs(next: {
    corporateActionAlerts: boolean;
    strictFailClosed: boolean;
  }) {
    if (!prefsEditable) return;
    setPrefsBusy(true);
    setPrefsMsg("");
    try {
      const res = await savePrefs({ data: next });
      if (res.ok) {
        setPrefsMsg("Saved to Supabase desk_preferences.");
        await queryClient.invalidateQueries({ queryKey: ["session-bundle"] });
        await refetch();
      } else {
        setPrefsMsg(`${res.reason}${res.detail ? ` — ${res.detail}` : ""}`);
      }
    } finally {
      setPrefsBusy(false);
    }
  }

  useEffect(() => {
    setLabUiPick(readLabUiPick());
    setLabShaderPick(readLabShaderPick());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [data]);

  const empireKeysReady = Boolean(
    data?.readiness.privyConfigured && data?.readiness.supabaseConfigured,
  );

  return (
    <DeskShell eyebrow="Server preferences" title="Settings">
      <div className="mb-3 flex flex-wrap gap-2">
        <ModeBadge mode="mainnet-read">Mainnet read</ModeBadge>
        <ModeBadge mode={data?.networkPolicy.broadcast ? "mainnet-read" : "unavailable"}>
          {data?.networkPolicy.broadcast ? "Broadcast armed" : "Broadcast paused"}
        </ModeBadge>
        <ModeBadge
          mode={
            data?.auth.ok && data.auth.data.sessionReady
              ? "mainnet-read"
              : data?.auth.ok
                ? "paper"
                : "unavailable"
          }
        >
          {data?.auth.ok && data.auth.data.sessionReady
            ? "Session ready"
            : data?.auth.ok
              ? "Auth keys · no session"
              : "Auth fail-closed"}
        </ModeBadge>
        <ModeBadge mode={data?.sessionSecretPresent ? "mainnet-read" : "unavailable"}>
          {data?.sessionSecretPresent
            ? "Watch-wallet secret set"
            : "Watch-wallet secret missing"}
        </ModeBadge>
        <ModeBadge mode="paper">Paper agent</ModeBadge>
      </div>

      <div className="settings-layout">
        <nav className="settings-rail" aria-label="Settings sections">
          <a href="#empire-readiness">Empire readiness</a>
          <a href="#settings-network">Network + policy</a>
          <a href="#settings-tenant">Active tenant</a>
          <a href="#settings-session">Privy session</a>
          <a href="#settings-watch">Watch wallet</a>
          <a href="#settings-agent">Paper agent</a>
          <a href="#settings-key-guide">Key links</a>
        </nav>
        <div className="settings-main">
      <Panel
        title="Production readiness"
        meta={<StatusBadge tone="amber">Henry actions</StatusBadge>}
        collapsible
        defaultOpen
      >
        <div id="empire-readiness" className="scroll-mt-24" />
        <p className="mb-3 text-sm opacity-80">
          Fail-closed checklist for Stocklana production. Missing keys stay unavailable — we do
          not invent wash clears, multi-tenant sessions, or broadcast. Paste into Vercel
          (Preview + Production) then redeploy — Netro Empire keys strip updates live.
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
            <span>JUPITER_API_KEY (optional)</span>
            <b>
              {data?.readiness.jupiterKeyPresent
                ? "Set · quote/price auth header armed"
                : "Missing · public quote/price (429 → TTL cache / fail-closed)"}
            </b>
          </p>
          <p>
            <span>SOLANA_RPC_URL</span>
            <b>
              {data?.readiness.solanaRpcDedicated
                ? "Dedicated · Scaled UI + wallet reads"
                : "Public fallback · rate-limit risk (B004)"}
            </b>
          </p>
          <p>
            <span>AGENTROUTER_API_KEY</span>
            <b>
              {data?.readiness.agentRouterKeyPresent
                ? "Set · NL optional (spine always; WAF → spine-only)"
                : "Missing · live spine only"}
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
            <span>SUPABASE_JWT_SECRET (RLS user path)</span>
            <b>
              {data?.readiness.supabaseJwtConfigured
                ? "Set · user-JWT RLS armed (sub=Privy DID)"
                : "Missing · service-role labeled fallback"}
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
            <span>API_KEY_21ST (lab MCP)</span>
            <b>
              {data?.readiness.twentyFirstKeyPresent
                ? "Set · /lab/ui catalog live"
                : "Missing · lab falls back without 21st previews"}
            </b>
          </p>
          <p>
            <span>SHADERS_API_KEY (lab probe)</span>
            <b>
              {data?.readiness.shadersKeyPresent
                ? "Set · probed (Clerk may still gate REST)"
                : "Missing · 21st WebGL studies still run locally"}
            </b>
          </p>
          <p>
            <span>Lab premium UI</span>
            <b>
              {data?.readiness.approvedLabUi
                ? `Production · ${data.readiness.approvedLabUi}`
                : labUiPick || labShaderPick
                  ? `Local pick ${[labUiPick, labShaderPick].filter(Boolean).join(" · ")} · awaiting chat reply — `
                  : "Awaiting Henry candidate id — "}
              {!data?.readiness.approvedLabUi ? (
                <>
                  <a href="/lab/ui">/lab/ui</a> · <a href="/lab/shaders">/lab/shaders</a>
                </>
              ) : (
                <>
                  {" "}
                  · <a href="/lab/ui">/lab/ui</a>
                </>
              )}
            </b>
          </p>
          <p>
            <span>FOLIO_APPROVED_LAB_UI (production)</span>
            <b>
              {data?.readiness.approvedLabUi
                ? `Set · desk chrome ${data.readiness.approvedLabUi}`
                : "Unset · production desk stays default until Henry chat approve + env"}
            </b>
          </p>
          <p>
            <span>FOLIO_APPROVED_LAB_SHADER (production)</span>
            <b>
              {data?.readiness.approvedLabShader
                ? `Set · ${data.readiness.approvedLabShader}`
                : "Unset"}
            </b>
          </p>
          <p className="mt-3 text-sm opacity-80">
            Key paste order (Bitquery → Pyth → Privy → Supabase):{" "}
            <code>docs/KEYS_LANDING.md</code> · <code>npm run keys</code> ·{" "}
            <code>npm run smoke:keys</code>
          </p>
        </div>
      </Panel>

      <div id="settings-key-guide" className="scroll-mt-24">
        <Panel
          title="Get Empire API keys (step-by-step)"
          meta={<StatusBadge tone="blue">Links</StatusBadge>}
          collapsible
          defaultOpen
        >
          <div className="settings-keys-guide">
            <div className="settings-step">
              <strong>1 · Bitquery</strong>
              <span>
                Open{" "}
                <a href="https://account.bitquery.io/" target="_blank" rel="noreferrer">
                  account.bitquery.io
                </a>{" "}
                → API keys → create → paste as <code>BITQUERY_API_KEY</code> on Vercel
                (Preview + Production).
              </span>
            </div>
            <div className="settings-step">
              <strong>2 · Pyth</strong>
              <span>
                Start at{" "}
                <a href="https://pyth.network/" target="_blank" rel="noreferrer">
                  pyth.network
                </a>{" "}
                → Hermes / developer access → set <code>PYTH_API_KEY</code>.
              </span>
            </div>
            <div className="settings-step">
              <strong>3 · Privy</strong>
              <span>
                Create an app at{" "}
                <a href="https://dashboard.privy.io/" target="_blank" rel="noreferrer">
                  dashboard.privy.io
                </a>{" "}
                → copy <code>PRIVY_APP_ID</code> + <code>PRIVY_APP_SECRET</code>.
              </span>
            </div>
            <div className="settings-step">
              <strong>4 · Supabase</strong>
              <span>
                Project settings → API at{" "}
                <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                  supabase.com/dashboard
                </a>{" "}
                → <code>SUPABASE_URL</code>, <code>SUPABASE_ANON_KEY</code>,{" "}
                <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>SUPABASE_JWT_SECRET</code>.
                Apply <code>supabase/migrations/20260915_folio_tenants.sql</code>.
              </span>
            </div>
            <div className="settings-step">
              <strong>5 · Optional Jupiter</strong>
              <span>
                Portal at{" "}
                <a href="https://portal.jup.ag/" target="_blank" rel="noreferrer">
                  portal.jup.ag
                </a>{" "}
                if quotes gate → <code>JUPITER_API_KEY</code>. Public path works until 429.
              </span>
            </div>
            <div className="settings-step">
              <strong>6 · Vercel paste</strong>
              <span>
                Project env for{" "}
                <a
                  href="https://vercel.com/teamtitanlink/folio/settings/environment-variables"
                  target="_blank"
                  rel="noreferrer"
                >
                  folio → Environment Variables
                </a>{" "}
                → redeploy preview. Rotate any token pasted in chat.
              </span>
            </div>
          </div>
        </Panel>
      </div>

      <div id="settings-network" className="desk-grid scroll-mt-24">
        <Panel title="Network mode" meta={<StatusBadge tone="blue">Quote-only default</StatusBadge>} collapsible defaultOpen>
          <div className="setting-row">
            <span>
              <b>Mainnet read</b>
              <small>Observe live market and ledger data</small>
            </span>
            <StatusBadge tone="blue">Selected · read</StatusBadge>
          </div>
          <div className="setting-row">
            <span>
              <b>Broadcast</b>
              <small>Requires funding and explicit enablement</small>
            </span>
            <StatusBadge tone={data?.networkPolicy.broadcast ? "amber" : "neutral"}>
              {data?.networkPolicy.broadcast
                ? "Enabled"
                : data?.readiness.broadcastPaused
                  ? "Paused · ≤~$1 · quote-only"
                  : "Policy off"}
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
        <Panel title="Policy preferences" collapsible defaultOpen>
          <label className="setting-row">
            <span>
              <b>Corporate-action alerts</b>
              <small>
                {prefsEditable
                  ? data?.preferences.ok
                    ? `Server-persisted · active tenant ${prefsTenant?.slug ?? prefsTenant?.tenantId.slice(0, 8) ?? "—"} · role ${prefsTenant?.role} · live signal = xStocks multiplier (no separate CA calendar yet)`
                    : "Session ready · save will upsert prefs for active tenant"
                  : prefsReadOnlyReason
                    ? prefsReadOnlyReason
                    : data && !data.preferences.ok
                      ? data.preferences.reason
                      : "Server prefs unavailable — not using localStorage"}
              </small>
            </span>
            <Switch
              checked={corporateAlerts}
              disabled={!prefsEditable || prefsBusy}
              onCheckedChange={(checked) => {
                void persistPrefs({
                  corporateActionAlerts: checked,
                  strictFailClosed,
                });
              }}
            />
          </label>
          <label className="setting-row">
            <span>
              <b>Strict fail-closed mode</b>
              <small>
                When on, unresolved required signals (including missing Pyth) block acquire
                review — not honesty-only labels.
                {prefsReadOnlyReason && !prefsEditable
                  ? ` ${prefsReadOnlyReason}`
                  : ""}
              </small>
            </span>
            <Switch
              checked={strictFailClosed}
              disabled={!prefsEditable || prefsBusy}
              onCheckedChange={(checked) => {
                void persistPrefs({
                  corporateActionAlerts: corporateAlerts,
                  strictFailClosed: checked,
                });
              }}
            />
          </label>
          {prefsMsg ? <p className="mt-2 text-sm opacity-80">{prefsMsg}</p> : null}
        </Panel>
      </div>

      <div id="settings-tenant" className="scroll-mt-24">
      <Panel
        title="Active tenant"
        meta={
          <StatusBadge tone={prefsTenant ? "green" : "amber"}>
            {prefsTenant ? "Scoped" : "No membership"}
          </StatusBadge>
        }
        collapsible
        defaultOpen
      >
        <p className="mb-3 text-sm opacity-80">
          Prefs and desk scope follow the membership-validated active tenant on the httpOnly
          session. Switching remints the signed cookie — never invents a tenant outside
          memberships.
        </p>
        {tenants.length === 0 ? (
          <p className="text-sm opacity-80">
            No tenants on session — fail-closed until Privy + Supabase memberships land.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {tenants.map((t) => {
              const isActive = t.tenantId === activeTenantId;
              return (
                <li key={t.tenantId} className="setting-row">
                  <span>
                    <b>{t.displayName ?? t.slug ?? t.tenantId.slice(0, 8)}</b>
                    <small>
                      {t.slug ? `${t.slug} · ` : ""}
                      {t.role}
                      {isActive ? " · active" : ""}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="wallet-pill"
                    disabled={tenantBusy || isActive || !data?.session.ok}
                    onClick={async () => {
                      setTenantBusy(true);
                      setTenantMsg("");
                      try {
                        const res = await switchTenant({
                          data: { tenantId: t.tenantId },
                        });
                        if (res.ok) {
                          setTenantMsg(res.data.note);
                          await queryClient.invalidateQueries({
                            queryKey: ["session-bundle"],
                          });
                          await refetch();
                        } else {
                          setTenantMsg(
                            `${res.reason}${res.detail ? ` — ${res.detail}` : ""}`,
                          );
                        }
                      } finally {
                        setTenantBusy(false);
                      }
                    }}
                  >
                    {isActive ? "Active" : tenantBusy ? "Switching…" : "Make active"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {tenantMsg ? <p className="mt-3 text-sm">{tenantMsg}</p> : null}
        {data?.rlsNote ? (
          <p className="mt-3 text-sm opacity-80">
            RLS: {data.rlsNote}
          </p>
        ) : null}
      </Panel>
      </div>

      <div id="settings-session" className="scroll-mt-24">
      <Panel
        title="Bind Privy → httpOnly session"
        meta={<StatusBadge tone="amber">Fail-closed without keys</StatusBadge>}
        collapsible
        defaultOpen={empireKeysReady}
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
                  <b>{t.displayName ?? t.slug ?? t.tenantId.slice(0, 8)}</b>
                  {t.slug ? (
                    <>
                      {" "}
                      · <code>{t.slug}</code>
                    </>
                  ) : null}{" "}
                  · {t.role}
                  {t.walletAddress ? (
                    <>
                      {" "}
                      · wallet{" "}
                      <code>
                        {t.walletAddress.slice(0, 4)}…{t.walletAddress.slice(-4)}
                      </code>
                    </>
                  ) : (
                    " · no membership wallet"
                  )}
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
      </div>

      <div id="settings-watch" className="scroll-mt-24">
      <Panel
        title="Watch wallet (mainnet-read qty)"
        meta={
          <StatusBadge tone={data?.sessionSecretPresent ? "green" : "amber"}>
            {data?.sessionSecretPresent ? "Secret ready" : "Secret missing"}
          </StatusBadge>
        }
        collapsible
        defaultOpen={false}
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
      </div>

      <div id="settings-agent" className="scroll-mt-24">
      <Panel
        title="Paper agent"
        meta={<StatusBadge tone="blue">Live spine · no broadcast</StatusBadge>}
        collapsible
        defaultOpen={false}
      >
        <p className="mb-3 text-sm opacity-80">
          Runs live xStocks multiplier / Jupiter quote-only reads and the same acquire wash
          gates on quote intents. Never broadcasts. AgentRouter expands NL only when keyed —
          if AgentRouter returns WAF/HTML or errors, the live spine reply still returns
          (NL skipped, labeled). Truth spine labels pending corporate-action multiplier (or
          none); quotes label Jupiter live/cached/stale.
        </p>
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
                if (!res.ok) {
                  setAgentOut(
                    `${res.reason}${res.detail ? ` — ${res.detail}` : ""}\n[nl=failed · broadcast=false · live spine unavailable]`,
                  );
                  return;
                }
                const spineBits = [
                  res.data.spine.truth
                    ? `truth ×${res.data.spine.truth.multiplier?.toFixed(6) ?? "—"} · pending ${
                        res.data.spine.truth.pendingMultiplier != null
                          ? `${res.data.spine.truth.pendingMultiplier.toFixed(6)}×`
                          : "none"
                      }`
                    : null,
                  res.data.spine.quote
                    ? `quote ${res.data.spine.quote.cacheLabel} out=${
                        res.data.spine.quote.outUiAmount?.toFixed(6) ?? "—"
                      }`
                    : null,
                  res.data.spine.gates
                    ? `gates canReview=${res.data.spine.gates.canReview}`
                    : null,
                  `nl=${res.data.nlExpansion}`,
                ]
                  .filter(Boolean)
                  .join(" · ");
                setAgentOut(
                  `${res.data.reply}\n[${spineBits}; metered ~$${res.data.meteredCostUsd.toFixed(6)}; broadcast=${res.data.caps.broadcast}${
                    res.data.nlExpansionNote ? `; ${res.data.nlExpansionNote}` : ""
                  }]`,
                );
              } catch (err) {
                setAgentOut(
                  `paper_agent_client_error — ${err instanceof Error ? err.message : String(err)}\n[nl=failed · broadcast=false]`,
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Running…" : "Run paper agent"}
          </button>
        </div>
        {agentOut ? (
          <pre className="mt-3 whitespace-pre-wrap text-sm opacity-90">{agentOut}</pre>
        ) : null}
      </Panel>
      </div>
        </div>
      </div>
    </DeskShell>
  );
}
