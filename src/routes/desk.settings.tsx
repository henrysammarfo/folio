import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useState } from "react";
import { z } from "zod";
import { DeskShell } from "@/components/desk-shell";
import { Switch } from "@/components/ui/switch";
import {
  bindWatchWallet,
  clearFolioSession,
  clearWatchWallet,
  getSessionBundle,
  updateDeskPreferences,
  type SessionBundle,
} from "@/lib/desk.functions";
import { canWriteDeskPrefs } from "@/lib/auth/role-gates";
import { isPlausibleSolanaAddress } from "@/components/wallet-lookup-panel";
import { siteMeta } from "@/lib/site-meta";

const PrivySessionMint = lazy(() =>
  import("@/components/privy-session-mint").then((m) => ({
    default: m.PrivySessionMint,
  })),
);

const DeskOpsSettings = lazy(() =>
  import("@/components/desk-ops-settings").then((m) => ({
    default: m.DeskOpsSettings,
  })),
);

const searchSchema = z.object({
  /**
   * Operator wall. Must not be a bare numeric query value — TanStack coerces
   * `?x=1` to number, which fails z.string() and gets stripped via redirect.
   */
  wall: z.enum(["ops"]).optional().catch(undefined),
});

export const Route = createFileRoute("/desk/settings")({
  head: () => ({
    meta: siteMeta({
      title: "Account — FOLIO",
      description: "Connect your wallet and manage alerts.",
      path: "/desk/settings",
    }),
  }),
  validateSearch: (s) => searchSchema.parse(s),
  loader: async () => getSessionBundle(),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const { wall } = Route.useSearch();
  if (wall === "ops") {
    return (
      <DeskShell title="Operator">
        <Suspense fallback={<p className="prod-sub">Loading…</p>}>
          <DeskOpsSettings initial={initial} />
        </Suspense>
      </DeskShell>
    );
  }
  return <ConsumerSettings initial={initial} />;
}

function ConsumerSettings({ initial }: { initial: SessionBundle }) {
  const queryClient = useQueryClient();
  const fetchSession = useServerFn(getSessionBundle);
  const bindWatch = useServerFn(bindWatchWallet);
  const clearWatch = useServerFn(clearWatchWallet);
  const clearSession = useServerFn(clearFolioSession);
  const savePrefs = useServerFn(updateDeskPreferences);
  const { data, refetch } = useQuery({
    queryKey: ["session-bundle"],
    queryFn: () => fetchSession(),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 30_000,
  });

  const [wallet, setWallet] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [privyClient, setPrivyClient] = useState(false);
  useEffect(() => setPrivyClient(true), []);

  const tenants = data?.session.ok ? data.session.data.tenants : [];
  const activeTenantId = data?.activeTenantId ?? null;
  const prefsTenant =
    tenants.find((t) => t.tenantId === activeTenantId) ?? tenants[0] ?? null;
  const prefsEditable = Boolean(
    data?.session.ok &&
      prefsTenant &&
      data?.auth.ok &&
      canWriteDeskPrefs(prefsTenant.role),
  );
  const alertsOn = data?.preferences.ok
    ? data.preferences.data.corporateActionAlerts
    : false;
  const signedIn = Boolean(data?.auth.ok && data.auth.data.sessionReady);
  const appId = data?.readiness.privyAppId ?? "";

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["session-bundle"] });
    await queryClient.invalidateQueries({ queryKey: ["positions-bundle"] });
    await queryClient.invalidateQueries({ queryKey: ["credit-bundle"] });
    await refetch();
  }

  return (
    <DeskShell title="Account">
      <section className="prod-page narrow">
        <header className="prod-lead compact">
          <h1 className="prod-page-title">Account</h1>
          <p className="prod-sub">
            {signedIn
              ? "Signed in · wallet prefs save to your desk."
              : "Connect a wallet to see verified holdings."}
          </p>
        </header>

        <div className="prod-account-block">
          <h2>Wallet</h2>
          <p>
            {data?.watchWallet
              ? `${data.watchWallet.slice(0, 4)}…${data.watchWallet.slice(-4)}`
              : "No wallet connected"}
          </p>
          <form
            className="prod-inline-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const next = wallet.trim();
              if (!isPlausibleSolanaAddress(next)) {
                setMsg("Enter a valid Solana address.");
                return;
              }
              setBusy(true);
              setMsg("");
              try {
                const res = await bindWatch({ data: { wallet: next } });
                setMsg(res.ok ? "Wallet saved." : res.reason);
                if (res.ok) {
                  setWallet("");
                  await refresh();
                }
              } finally {
                setBusy(false);
              }
            }}
          >
            <input
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Paste wallet address"
              autoComplete="off"
              spellCheck={false}
              aria-label="Wallet address"
            />
            <button
              type="submit"
              disabled={busy || !data?.sessionSecretPresent}
            >
              {busy ? "…" : "Save"}
            </button>
          </form>
          {data?.watchWallet ? (
            <button
              type="button"
              className="prod-text-btn"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await clearWatch();
                  await refresh();
                  setMsg("Wallet disconnected.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Disconnect wallet
            </button>
          ) : null}
        </div>

        <div className="prod-account-block">
          <h2>Sign in</h2>
          {privyClient && appId ? (
            <Suspense fallback={null}>
              <PrivySessionMint
                appId={appId}
                mintReady={Boolean(data?.auth.ok)}
                allowedOrigin={
                  typeof window !== "undefined" ? window.location.origin : ""
                }
                onMinted={refresh}
                variant="consumer"
              />
            </Suspense>
          ) : (
            <p className="prod-sub">Sign-in opens when Privy is configured.</p>
          )}
          {signedIn ? (
            <button
              type="button"
              className="prod-text-btn"
              onClick={async () => {
                await clearSession();
                await refresh();
                setMsg("Signed out.");
              }}
            >
              Sign out
            </button>
          ) : null}
        </div>

        <div className="prod-account-block row">
          <div>
            <h2>Corporate-action alerts</h2>
            <p>Notify when a pending multiplier appears.</p>
          </div>
          <Switch
            checked={Boolean(alertsOn)}
            disabled={!prefsEditable}
            onCheckedChange={async (v) => {
              if (!prefsEditable) return;
              await savePrefs({ data: { corporateActionAlerts: v } });
              await refresh();
            }}
          />
        </div>

        {msg ? (
          <p className="prod-err" style={{ color: "inherit" }}>
            {msg}
          </p>
        ) : null}

        <p className="prod-legal">
          <Link to="/privacy">Privacy</Link>
          {" · "}
          <Link to="/terms">Terms</Link>
        </p>
      </section>
    </DeskShell>
  );
}
