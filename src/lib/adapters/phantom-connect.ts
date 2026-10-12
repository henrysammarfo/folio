import { errResult, okResult, type AdapterResult } from "./types";

/**
 * Phantom Connect dual-path status (alongside Privy).
 * - Injected extension path needs no App ID (Wallet Standard / injected provider).
 * - Embedded Google/Apple needs PHANTOM_APP_ID from an existing Phantom Portal app
 *   (hub docs: new Portal sign-ups paused).
 * Session mint stays Privy httpOnly — Phantom is sign / bind watch-wallet only.
 */
export type PhantomConnectSnapshot = {
  protocol: "Phantom Connect";
  injectedPath: true;
  embeddedSocialArmed: boolean;
  appIdConfigured: boolean;
  docsUrl: string;
  portalUrl: string;
  note: string;
};

export const PHANTOM_CONNECT_DOCS_URL = "https://docs.phantom.com/phantom-connect";
export const PHANTOM_PORTAL_URL = "https://phantom.com/portal";

export function readPhantomAppId(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  return env["PHANTOM_APP_ID"]?.trim() || null;
}

export function fetchPhantomConnectStatus(
  env: NodeJS.ProcessEnv = process.env,
): AdapterResult<PhantomConnectSnapshot> {
  const source = "phantom-connect.env";
  try {
    const appId = readPhantomAppId(env);
    const embeddedSocialArmed = Boolean(appId);
    return okResult("mainnet-read", source, {
      protocol: "Phantom Connect",
      injectedPath: true,
      embeddedSocialArmed,
      appIdConfigured: embeddedSocialArmed,
      docsUrl: PHANTOM_CONNECT_DOCS_URL,
      portalUrl: PHANTOM_PORTAL_URL,
      note: embeddedSocialArmed
        ? "Injected + embedded social armed · FOLIO session still Privy httpOnly"
        : "Injected extension path armed · embedded social needs PHANTOM_APP_ID (Portal new apps paused)",
    });
  } catch (e) {
    return errResult(source, "phantom_connect_status_failed", String(e));
  }
}
