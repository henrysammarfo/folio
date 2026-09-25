import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { errResult, type AdapterResult } from "./adapters/types";
import { fetchXStockAsset, fetchXStockMultiplier } from "./adapters/xstocks";
import {
  fetchJupiterQuote,
  fetchJupiterTokenPrice,
  type JupiterQuote,
  type JupiterTokenPrice,
} from "./adapters/jupiter";
import { evaluateWashGate } from "./adapters/wash";
import {
  fetchScaledUiOnchain,
  compareApiOnchainMultiplier,
  type ScaledUiApiCompare,
} from "./adapters/scaled-ui";
import { positionHealth } from "./position-health";
import { fetchKaminoXStocksMarket } from "./adapters/kamino";
import { fetchJupiterLendEarn } from "./adapters/jupiter-lend";
import { fetchNestUsdStatus } from "./adapters/nestusd";
import { fetchNestCreditVaults } from "./adapters/nest-credit";
import { fetchRaydiumPoolsForMint } from "./adapters/pools";
import {
  FOLIO_SESSION_COOKIE,
  getAuthProviderStatus,
  loadDeskPreferences,
  mintFolioSession,
  parseFolioSessionCookie,
  resolveActiveTenantId,
  saveDeskPreferences,
  deskRlsHonestyNote,
  verifyFolioSessionCookieValue,
  type FolioSession,
} from "./auth/session";
import { isSupabaseUserJwtConfigured } from "./auth/supabase-user-jwt";
import { buildSessionFromPrivyToken } from "./auth/session-from-privy";
import { attachUserToDemoTenant } from "./auth/demo-tenant";
import { buildBootstrapDemoSession } from "./auth/bootstrap-demo-session";
import { resolveTenantMemberships } from "./auth/tenants";
import {
  FOLIO_WATCH_WALLET_COOKIE,
  mintWatchWalletCookie,
  verifyWatchWalletCookieValue,
} from "./auth/watch-wallet";
import {
  fetchWalletTokenBalances,
  isLikelySolanaPubkey,
} from "./adapters/wallet-balances";
import {
  heldXStockSymbolsFromBalances,
  loadXStockMintIndex,
} from "./adapters/xstock-mint-index";
import {
  resolveWalletBinding,
  type WalletBindingSource,
} from "./wallet-binding";
export type { WalletBindingSource } from "./wallet-binding";
import {
  activeMembership,
  prefsWriteBlockedReason,
} from "./auth/role-gates";
import {
  agentBlockedReason,
  bootstrapBlockedReason,
  deskAccessFromSession,
  prefsSessionBlockedReason,
  type DeskAccess,
} from "./auth/desk-access";
import { readClientIp } from "./auth/client-ip";
import {
  rateLimitCheck,
  rateLimitClientKey,
} from "./auth/rate-limit";
import { runPaperAgent } from "./agent/paper-agent";
import { paperRawFor } from "./market";
import { isBroadcastPaused } from "./broadcast";
import { isFolioOpsEnabled } from "./auth/ops-access";
import { upsertBetaWaitlist } from "./auth/beta-waitlist";
import { readApprovedLabShader, readApprovedLabUi } from "./lab-pick";

/** Paper fallback when no wallet is bound — never invents qty for other mints. */
const PAPER_WATCHLIST = ["AAPLx", "NVDAx", "TSLAx"] as const;

function unavailablePrice(reason: string): AdapterResult<JupiterTokenPrice> {
  return errResult("api.jup.ag/price/v3", reason);
}

function unavailableQuote(reason: string): AdapterResult<JupiterQuote> {
  return errResult("api.jup.ag/swap/v2/order", reason);
}

function readVerifiedSession(): AdapterResult<FolioSession> {
  try {
    const value = getCookie(FOLIO_SESSION_COOKIE);
    return verifyFolioSessionCookieValue(value);
  } catch {
    const g = globalThis as { __FOLIO_COOKIE_HEADER__?: string };
    return parseFolioSessionCookie(g.__FOLIO_COOKIE_HEADER__ ?? null);
  }
}

function readWatchWallet(): AdapterResult<{ wallet: string }> {
  try {
    const value = getCookie(FOLIO_WATCH_WALLET_COOKIE);
    return verifyWatchWalletCookieValue(value);
  } catch {
    const g = globalThis as { __FOLIO_WATCH_WALLET_COOKIE__?: string };
    return verifyWatchWalletCookieValue(g.__FOLIO_WATCH_WALLET_COOKIE__ ?? null);
  }
}

function resolveDisplayWallet(
  session: AdapterResult<FolioSession>,
  inspectWallet?: string | null,
): { wallet: string | null; source: WalletBindingSource } {
  const watch = readWatchWallet();
  const membership = session.ok ? activeMembership(session.data) : null;
  return resolveWalletBinding({
    membershipWallet: membership?.walletAddress ?? null,
    sessionWallet: session.ok ? session.data.walletAddress : null,
    watchWallet: watch.ok ? watch.data.wallet : null,
    inspectWallet: inspectWallet ?? null,
  });
}

export type PositionRow = {
  symbol: string;
  name: string;
  mint: string | null;
  /** Backed / xStocks logo URL when available. */
  logo: string | null;
  /** Display qty: wallet UI amount when bound, else paper. */
  qty: number;
  paperRaw: number;
  qtySource: "wallet-read" | "paper";
  multiplier: number | null;
  /** Live xStocks newMultiplier when a CA is pending — null means none on feed. */
  pendingMultiplier: number | null;
  onchainEffectiveMultiplier: number | null;
  /** API ↔ on-chain Scaled UI — never invents a match when either side is off. */
  scaledUiCompare: ScaledUiApiCompare;
  economicShares: number | null;
  usdPrice: number | null;
  paperValueUsd: number | null;
  health: "Verified" | "Review" | "Unavailable";
  labels: string[];
};

export type PositionsBundle = {
  rows: PositionRow[];
  note: string;
  auth: ReturnType<typeof getAuthProviderStatus>;
  watchWallet: string | null;
  /** Ephemeral ?inspect= pubkey — mainnet-read only, not a session. */
  inspectWallet: string | null;
  walletSource: WalletBindingSource;
  walletBalances: Awaited<ReturnType<typeof fetchWalletTokenBalances>> | null;
};

export type CreditBundle = {
  kamino: Awaited<ReturnType<typeof fetchKaminoXStocksMarket>>;
  jupiterLend: Awaited<ReturnType<typeof fetchJupiterLendEarn>>;
  nestusd: Awaited<ReturnType<typeof fetchNestUsdStatus>>;
  /** Nest.credit vault awareness — not NestUSD borrow capacity. */
  nestCredit: Awaited<ReturnType<typeof fetchNestCreditVaults>>;
  paper: {
    /** Qty basis for collateral math — wallet-read when bound, else paper. */
    label: "paper" | "wallet-read";
    collateralUsd: number | null;
    maxLtvUsed: number | null;
    illustrativeBorrowUsd: number | null;
    note: string;
  };
  watchWallet: string | null;
  /** Ephemeral inspect pubkey when no session/watch-wallet bound. */
  inspectWallet: string | null;
  walletSource: WalletBindingSource;
  /**
   * Borrow rails status.
   * - kamino-inhouse: live Kamino xStocks + ktx deposit/borrow signed in-desk
   * - nestusd-metrics: NestUSD LTV metrics only (no NestUSD in-desk execute yet)
   * - unavailable: neither rail live
   */
  borrowExecution:
    | "kamino-inhouse"
    | "nestusd-metrics"
    | "unavailable";
  /** Reference deep-link only — desk borrow is in-house via ktx. */
  kaminoBorrowUrl: string | null;
  nestusdAppUrl: string | null;
  /** Same arm as Jupiter fills — ktx sign/send fail-closed while true. */
  broadcastPaused: boolean;
};

export type ActivityEvent = {
  at: string;
  title: string;
  detail: string;
  tone: "green" | "blue" | "amber" | "neutral";
  mode: string;
  /** Feed glyph — logos when symbol set, else Lucide kind. */
  icon:
    | "share"
    | "chain"
    | "ca"
    | "alert"
    | "quote"
    | "wash"
    | "credit"
    | "earn"
    | "borrow"
    | "pool";
  symbol?: string;
};

export type ActivityBundle = {
  events: ActivityEvent[];
  note: string;
  /**
   * Corporate-action alert preference from active-tenant prefs when session exists.
   * Live CA signal today = xStocks multiplier — no separate calendar feed yet.
   */
  corporateActionAlerts: boolean | null;
  prefsFromSession: boolean;
};

export type SessionBundle = {
  auth: ReturnType<typeof getAuthProviderStatus>;
  session: AdapterResult<FolioSession>;
  /** Membership-validated active tenant — null when session missing/empty. */
  activeTenantId: string | null;
  preferences: Awaited<ReturnType<typeof loadDeskPreferences>>;
  networkPolicy: {
    mainnetRead: true;
    quoteOnly: true;
    broadcast: boolean;
    customProgramDeploy: false;
  };
  watchWallet: string | null;
  /** FOLIO_SESSION_SECRET ≥16 — watch-wallet bind + cookie signing (not Privy). */
  sessionSecretPresent: boolean;
  /** AGENTROUTER_API_KEY present — NL expansion optional; live spine always runs. */
  agentRouterKeyPresent: boolean;
  /**
   * RLS honesty: user-JWT (sub=Privy DID) when SUPABASE_JWT_SECRET set;
   * otherwise labeled service-role fallback (anon policies not live authz).
   */
  rlsNote: string;
  /** Production readiness flags — fail-closed honesty for Henry / Stocklana ops. */
  readiness: EmpireReadiness;
};

/** Env presence flags only — no invented greens. Shared by Settings + Netro. */
export type EmpireReadiness = {
  bitqueryKeyPresent: boolean;
  privyConfigured: boolean;
  /** Public Privy app id for client PrivyProvider (never the secret). */
  privyAppId: string | null;
  supabaseConfigured: boolean;
  sessionSecretPresent: boolean;
  pythApiKeyPresent: boolean;
  agentRouterKeyPresent: boolean;
  /** SUPABASE_JWT_SECRET + anon + URL — user-JWT RLS path armed. */
  supabaseJwtConfigured: boolean;
  broadcastPaused: boolean;
  /** Lab only — 21st.dev MCP catalog (approve gate). */
  twentyFirstKeyPresent: boolean;
  /** Lab only — shaders.com probe (often Clerk-gated). */
  shadersKeyPresent: boolean;
  /** Production desk chrome after Henry chat approve (FOLIO_APPROVED_LAB_UI). */
  approvedLabUi: string | null;
  /** Production desk shader after Henry chat approve (FOLIO_APPROVED_LAB_SHADER). */
  approvedLabShader: string | null;
  /** Optional Jupiter auth header — public path works without it. */
  jupiterKeyPresent: boolean;
  /** Dedicated SOLANA_RPC_URL (false = labeled public RPC fallback · B004). */
  solanaRpcDedicated: boolean;
  /**
   * tenants / tenant_members / desk_preferences reachable via service-role.
   * False when keys missing, migration not applied (PGRST205), or GRANTs missing (42501).
   */
  supabaseSchemaReady: boolean;
  /** Honest probe detail for Settings (never invents ready). */
  supabaseSchemaDetail: string;
  /** FOLIO_OPS=1 — ops wall at /desk/settings?wall=ops. Consumer Account otherwise. */
  opsWallEnabled: boolean;
};

export function readEmpireReadiness(
  env: NodeJS.ProcessEnv = process.env,
): EmpireReadiness {
  const sessionSecretPresent = (env["FOLIO_SESSION_SECRET"]?.trim().length ?? 0) >= 16;
  const privyAppId = env["PRIVY_APP_ID"]?.trim() || null;
  return {
    bitqueryKeyPresent: Boolean(env["BITQUERY_API_KEY"]?.trim()),
    privyConfigured: Boolean(privyAppId && env["PRIVY_APP_SECRET"]?.trim()),
    privyAppId,
    supabaseConfigured: Boolean(
      env["SUPABASE_URL"]?.trim() &&
        env["SUPABASE_ANON_KEY"]?.trim() &&
        env["SUPABASE_SERVICE_ROLE_KEY"]?.trim(),
    ),
    sessionSecretPresent,
    pythApiKeyPresent: Boolean(env["PYTH_API_KEY"]?.trim()),
    agentRouterKeyPresent: Boolean(env["AGENTROUTER_API_KEY"]?.trim()),
    supabaseJwtConfigured: isSupabaseUserJwtConfigured(env),
    broadcastPaused: isBroadcastPaused(env),
    twentyFirstKeyPresent: Boolean(env["API_KEY_21ST"]?.trim()),
    shadersKeyPresent: Boolean(env["SHADERS_API_KEY"]?.trim()),
    approvedLabUi: readApprovedLabUi(env),
    approvedLabShader: readApprovedLabShader(env),
    jupiterKeyPresent: Boolean(env["JUPITER_API_KEY"]?.trim()),
    solanaRpcDedicated: Boolean(env["SOLANA_RPC_URL"]?.trim()),
    /** Sync path defaults false — enrich via loadEmpireReadiness. */
    supabaseSchemaReady: false,
    supabaseSchemaDetail: "Not probed",
    opsWallEnabled: isFolioOpsEnabled(env),
  };
}

/** Live PostgREST probe — never invents schema greens. */
export async function probeSupabaseSchemaReady(
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const url = env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  const key = env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/rest/v1/tenants?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Honest detail for Settings — distinguishes missing tables vs missing GRANTs. */
export async function probeSupabaseSchemaDetail(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ ready: boolean; detail: string }> {
  const url = env["SUPABASE_URL"]?.trim()?.replace(/\/$/, "");
  const key = env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) {
    return { ready: false, detail: "Blocked · Supabase keys first" };
  }
  try {
    const res = await fetch(`${url}/rest/v1/tenants?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      return { ready: true, detail: "Ready · tenants / tenant_members reachable" };
    }
    const body = await res.text().catch(() => "");
    if (res.status === 404 || /PGRST205/i.test(body)) {
      return {
        ready: false,
        detail: "Missing · run 20260915_folio_tenants.sql (PGRST205)",
      };
    }
    if (res.status === 403 || /42501|permission denied|GRANT SELECT/i.test(body)) {
      return {
        ready: false,
        detail:
          "Tables exist · run 20260916_folio_tenants_grants.sql (service_role 42501)",
      };
    }
    return {
      ready: false,
      detail: `Probe HTTP ${res.status} · fail-closed`,
    };
  } catch (e) {
    return { ready: false, detail: `Probe failed · ${String(e).slice(0, 80)}` };
  }
}

export async function loadEmpireReadiness(
  env: NodeJS.ProcessEnv = process.env,
): Promise<EmpireReadiness> {
  const base = readEmpireReadiness(env);
  if (!base.supabaseConfigured) {
    return {
      ...base,
      supabaseSchemaDetail: "Blocked · Supabase keys first",
    };
  }
  const probe = await probeSupabaseSchemaDetail(env);
  return {
    ...base,
    supabaseSchemaReady: probe.ready,
    supabaseSchemaDetail: probe.detail,
  };
}

const InspectWalletInput = z
  .object({
    /** Optional ephemeral mainnet-read inspect pubkey (no cookie / not auth). */
    inspectWallet: z.string().max(64).optional(),
  })
  .default({});

export const getPositionsBundle = createServerFn({ method: "GET" })
  .validator(InspectWalletInput)
  .handler(async ({ data }): Promise<PositionsBundle> => {
    const session = readVerifiedSession();
    const auth = getAuthProviderStatus(session.ok ? session : null);
    const { wallet: displayWallet, source: walletSource } = resolveDisplayWallet(
      session,
      data.inspectWallet,
    );

    // Full ATA scan when bound — never filter to the 3-symbol paper watchlist.
    const walletBalances = displayWallet
      ? await fetchWalletTokenBalances({ wallet: displayWallet })
      : null;

    const mintIndex = await loadXStockMintIndex();

    type PlanRow = {
      symbol: string;
      name: string;
      mint: string | null;
      logo: string | null;
    };

    const plan: PlanRow[] = [];
    const seen = new Set<string>();

    if (displayWallet && walletBalances?.ok) {
      const held = heldXStockSymbolsFromBalances(
        walletBalances.data.byMint,
        mintIndex,
      );
      for (const h of held) {
        seen.add(h.symbol.toUpperCase());
        plan.push({
          symbol: h.symbol,
          name: h.meta.name,
          mint: h.mint,
          logo: h.meta.logo,
        });
      }
      // Keep paper watchlist visible at qty 0 so empty wallets aren't a blank desk.
      for (const symbol of PAPER_WATCHLIST) {
        if (seen.has(symbol.toUpperCase())) continue;
        seen.add(symbol.toUpperCase());
        plan.push({ symbol, name: symbol, mint: null, logo: null });
      }
    } else {
      for (const symbol of PAPER_WATCHLIST) {
        plan.push({ symbol, name: symbol, mint: null, logo: null });
      }
    }

    const assets = await Promise.all(
      plan.map(async (row) => {
        const [asset, multiplier] = await Promise.all([
          fetchXStockAsset(row.symbol),
          fetchXStockMultiplier(row.symbol),
        ]);
        const mint =
          row.mint ?? (asset.ok ? asset.data.solanaMint : null);
        const logo =
          row.logo ?? (asset.ok ? asset.data.logo : null);
        const name = asset.ok ? asset.data.name : row.name;
        return { symbol: row.symbol, name, mint, logo, asset, multiplier };
      }),
    );

    const rows: PositionRow[] = [];
    for (const { symbol, name, mint, logo, asset, multiplier } of assets) {
      const paperRaw = paperRawFor(symbol);
      const [price, onchain] = await Promise.all([
        mint
          ? fetchJupiterTokenPrice(mint)
          : Promise.resolve(unavailablePrice("xstock_mint_missing")),
        mint
          ? fetchScaledUiOnchain(mint)
          : Promise.resolve(errResult("solana-rpc.scaled-ui", "mint_missing")),
      ]);

      const walletUi =
        mint && walletBalances?.ok
          ? walletBalances.data.byMint[mint]?.uiAmount
          : undefined;
      const qtySource: PositionRow["qtySource"] =
        walletUi != null && Number.isFinite(walletUi) ? "wallet-read" : "paper";
      // Bound wallet with readable balances: zero is honest wallet-read, not paper.
      const qty =
        displayWallet && walletBalances?.ok
          ? walletUi != null && Number.isFinite(walletUi)
            ? walletUi
            : 0
          : qtySource === "wallet-read"
            ? (walletUi as number)
            : paperRaw;
      const finalQtySource: PositionRow["qtySource"] =
        displayWallet && walletBalances?.ok ? "wallet-read" : qtySource;

      const mult = multiplier.ok ? multiplier.data.currentMultiplier : null;
      const onchainEff = onchain.ok ? onchain.data.effectiveMultiplier : null;
      const scaledUiCompare = compareApiOnchainMultiplier(mult, onchainEff);
      const economicShares = mult != null ? qty * mult : null;
      const usdPrice = price.ok ? price.data.usdPrice : null;
      const paperValueUsd =
        economicShares != null && usdPrice != null
          ? economicShares * usdPrice
          : null;

      const labels = [
        finalQtySource === "wallet-read" ? "wallet-read-qty" : "paper-qty",
        "mainnet-read-multiplier",
      ];
      if (scaledUiCompare.status === "match") labels.push("onchain-scaled-ui-match");
      else if (scaledUiCompare.status === "mismatch")
        labels.push("onchain-scaled-ui-mismatch");
      else labels.push("onchain-scaled-ui-off");
      if (!displayWallet) labels.push("wallet-unbound");
      if (walletSource === "membership") labels.push("membership-wallet");
      if (walletSource === "inspect") labels.push("inspect-ephemeral");
      if (displayWallet && walletBalances && !walletBalances.ok) {
        labels.push("wallet-read-unavailable");
      }
      if (displayWallet && walletBalances?.ok) labels.push("wallet-full-scan");

      const health = positionHealth({
        qtySource: finalQtySource,
        multiplierOk: multiplier.ok,
        assetOk: asset.ok,
        priceOk: price.ok,
        scaledUiStatus: scaledUiCompare.status,
      });

      rows.push({
        symbol,
        name,
        mint,
        logo,
        qty,
        paperRaw,
        qtySource: finalQtySource,
        multiplier: mult,
        pendingMultiplier: multiplier.ok
          ? multiplier.data.pendingMultiplier
          : null,
        onchainEffectiveMultiplier: onchainEff,
        scaledUiCompare,
        economicShares,
        usdPrice,
        paperValueUsd,
        health,
        labels,
      });
    }

    // Non-zero wallet holdings first, then watchlist zeros, then by symbol.
    rows.sort((a, b) => {
      const az = a.qty > 0 ? 0 : 1;
      const bz = b.qty > 0 ? 0 : 1;
      if (az !== bz) return az - bz;
      return a.symbol.localeCompare(b.symbol);
    });

    const watch = readWatchWallet();
    const inspectActive = walletSource === "inspect" ? displayWallet : null;
    let note: string;
    if (!displayWallet) {
      note =
        "Estimated quantities until you connect a wallet. Share counts are live and checked against the Solana ledger.";
    } else if (walletBalances?.ok) {
      const heldN = rows.filter((r) => r.qty > 0).length;
      note = `Live balances for ${displayWallet.slice(0, 4)}…${displayWallet.slice(-4)} · ${heldN} xStock holding${heldN === 1 ? "" : "s"} (full wallet scan). Share counts verified on-chain when they match.`;
    } else {
      note = `Wallet connected but balances unavailable (${walletBalances && !walletBalances.ok ? walletBalances.reason : "unknown"}) — showing estimates. Share counts still live.`;
    }

    return {
      rows,
      note,
      auth,
      watchWallet: watch.ok ? watch.data.wallet : null,
      inspectWallet: inspectActive,
      walletSource,
      walletBalances,
    };
  },
);

export const getCreditBundle = createServerFn({ method: "GET" })
  .validator(InspectWalletInput)
  .handler(async ({ data }): Promise<CreditBundle> => {
    const session = readVerifiedSession();
    const { wallet: displayWallet, source: walletSource } = resolveDisplayWallet(
      session,
      data.inspectWallet,
    );
    const watch = readWatchWallet();

    const [kamino, jupiterLend, nestusd, nestCredit] = await Promise.all([
      fetchKaminoXStocksMarket(),
      fetchJupiterLendEarn(),
      fetchNestUsdStatus(),
      fetchNestCreditVaults(),
    ]);

    // Full wallet scan when bound — collateral from every held xStock, not just AAPLx/NVDAx.
    const walletBalances = displayWallet
      ? await fetchWalletTokenBalances({ wallet: displayWallet })
      : null;
    const mintIndex = await loadXStockMintIndex();

    type CreditPlan = { symbol: string; mint: string | null };
    const creditPlan: CreditPlan[] = [];
    const seen = new Set<string>();

    if (displayWallet && walletBalances?.ok) {
      const held = heldXStockSymbolsFromBalances(
        walletBalances.data.byMint,
        mintIndex,
      );
      for (const h of held) {
        seen.add(h.symbol.toUpperCase());
        creditPlan.push({ symbol: h.symbol, mint: h.mint });
      }
    }
    // Paper fallback symbols when unbound / empty / balances fail.
    if (creditPlan.length === 0) {
      for (const symbol of ["AAPLx", "NVDAx"] as const) {
        if (seen.has(symbol.toUpperCase())) continue;
        creditPlan.push({ symbol, mint: null });
      }
    }

    const assets = await Promise.all(
      creditPlan.map(async ({ symbol, mint: knownMint }) => {
        const [asset, multiplier] = await Promise.all([
          fetchXStockAsset(symbol),
          fetchXStockMultiplier(symbol),
        ]);
        const mint = knownMint ?? (asset.ok ? asset.data.solanaMint : null);
        return { symbol, asset, multiplier, mint };
      }),
    );

    let collateral: number | null = null;
    let priced = 0;
    let usedWalletQty = false;
    for (const { symbol, asset, multiplier, mint } of assets) {
      const price = mint
        ? await fetchJupiterTokenPrice(mint)
        : unavailablePrice("xstock_mint_missing");
      if (multiplier.ok && price.ok) {
        const paperRaw = paperRawFor(symbol, 0);
        const walletUi =
          mint && walletBalances?.ok
            ? walletBalances.data.byMint[mint]?.uiAmount
            : undefined;
        const useWallet =
          displayWallet &&
          walletBalances?.ok &&
          walletUi != null &&
          Number.isFinite(walletUi);
        const raw = useWallet
          ? (walletUi as number)
          : displayWallet && walletBalances?.ok
            ? 0
            : paperRaw;
        if (useWallet && (walletUi as number) > 0) usedWalletQty = true;
        if (raw <= 0 && displayWallet && walletBalances?.ok) {
          // Skip zero wallet holdings from collateral sum.
          continue;
        }
        collateral =
          (collateral ?? 0) +
          raw * multiplier.data.currentMultiplier * price.data.usdPrice;
        priced += 1;
      }
    }
    if (priced === 0) collateral = null;

    const aaplReserve = kamino.ok
      ? kamino.data.reserves.find((r) => r.symbol === "AAPLx")
      : undefined;
    const maxLtvUsed = aaplReserve?.maxLtv ?? null;
    const illustrativeBorrowUsd =
      collateral != null && maxLtvUsed != null
        ? collateral * maxLtvUsed
        : null;

    const label = usedWalletQty ? ("wallet-read" as const) : ("paper" as const);
    const inspectActive = walletSource === "inspect" ? displayWallet : null;

    const kaminoLive = kamino.ok;
    const nestLive =
      nestusd.ok &&
      nestusd.data.status === "live" &&
      !nestusd.data.protocolPaused;
    const borrowExecution = kaminoLive
      ? ("kamino-inhouse" as const)
      : nestLive
        ? ("nestusd-metrics" as const)
        : ("unavailable" as const);

    let note: string;
    if (kaminoLive) {
      note = usedWalletQty
        ? "Live Kamino xStocks LTV × your wallet collateral (full scan). Deposit & borrow USDC in FOLIO — your wallet signs on Kamino rails."
        : "Live Kamino xStocks LTV. Connect a wallet for your collateral estimate, then deposit & borrow in-desk.";
    } else if (usedWalletQty) {
      note =
        "Estimate from your wallet balances × live max LTV. Borrow rails unavailable.";
    } else if (displayWallet && walletBalances && !walletBalances.ok) {
      note =
        "Wallet connected but balances unavailable — showing estimates × live max LTV.";
    } else {
      note = "Estimate until you connect a wallet.";
    }

    return {
      kamino,
      jupiterLend,
      nestusd,
      nestCredit,
      paper: {
        label,
        collateralUsd: collateral,
        maxLtvUsed,
        illustrativeBorrowUsd,
        note,
      },
      borrowExecution,
      kaminoBorrowUrl: kamino.ok ? kamino.data.borrowUrl : null,
      nestusdAppUrl: nestusd.ok ? nestusd.data.appUrl : null,
      broadcastPaused: isBroadcastPaused(),
      watchWallet: watch.ok ? watch.data.wallet : null,
      inspectWallet: inspectActive,
      walletSource,
    };
  },
);

export const getActivityBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<ActivityBundle> => {
    const symbol = "AAPLx";
    const session = readVerifiedSession();
    const activeTenantId = session.ok
      ? resolveActiveTenantId(session.data)
      : null;
    const prefs = session.ok
      ? await loadDeskPreferences(activeTenantId, session.data.userId)
      : null;
    const prefsFromSession = Boolean(prefs?.ok);
    const corporateActionAlerts = prefs?.ok
      ? prefs.data.corporateActionAlerts
      : null;

    const [multiplier, asset] = await Promise.all([
      fetchXStockMultiplier(symbol),
      fetchXStockAsset(symbol),
    ]);
    const mint = asset.ok ? asset.data.solanaMint : null;
    const decimals =
      asset.ok && asset.data.decimals != null ? asset.data.decimals : 8;

    const [wash, jupiterQuote, pools, kamino, nestCredit, nestusd, scaledUi] = await Promise.all([
      evaluateWashGate({ symbol, mint, notionalUsd: 1 }),
      mint
        ? fetchJupiterQuote({
            outputMint: mint,
            amountRaw: 1_000_000,
            outputDecimals: decimals,
          })
        : Promise.resolve(unavailableQuote("mint_missing")),
      mint
        ? fetchRaydiumPoolsForMint(mint)
        : Promise.resolve(errResult("api-v3.raydium.io", "mint_missing")),
      fetchKaminoXStocksMarket(),
      fetchNestCreditVaults(),
      fetchNestUsdStatus(),
      mint
        ? fetchScaledUiOnchain(mint)
        : Promise.resolve(errResult("solana-rpc.scaled-ui", "mint_missing")),
    ]);

    const jupiterCacheLabel = jupiterQuote.ok
      ? jupiterQuote.source.includes("stale")
        ? "stale-cache"
        : jupiterQuote.source.includes("cached")
          ? "cached"
          : "live"
      : null;

    const now = new Date().toISOString();
    const events: ActivityEvent[] = [
      {
        at: now,
        title: multiplier.ok
          ? `${symbol} share count ${multiplier.data.currentMultiplier.toFixed(6)}×`
          : `${symbol} share count unavailable`,
        detail: multiplier.ok ? "Live market feed" : multiplier.reason,
        tone: multiplier.ok ? "green" : "amber",
        mode: multiplier.ok ? multiplier.mode : "unavailable",
        icon: "share",
        symbol,
      },
      (() => {
        const compare = compareApiOnchainMultiplier(
          multiplier.ok ? multiplier.data.currentMultiplier : null,
          scaledUi.ok ? scaledUi.data.effectiveMultiplier : null,
        );
        return {
          at: now,
          title:
            compare.status === "match"
              ? `On-chain Scaled UI OK · ${compare.onchainEffective?.toFixed(6)}×`
              : compare.status === "mismatch"
                ? `On-chain Scaled UI mismatch`
                : "On-chain Scaled UI pending",
          detail: compare.note,
          tone:
            compare.status === "match"
              ? ("green" as const)
              : compare.status === "mismatch"
                ? ("amber" as const)
                : ("neutral" as const),
          mode: scaledUi.ok ? scaledUi.mode : ("unavailable" as const),
          icon: "chain" as const,
          symbol,
        };
      })(),
      {
        at: now,
        title:
          multiplier.ok && multiplier.data.pendingMultiplier != null
            ? `Corporate action pending · ${multiplier.data.pendingMultiplier.toFixed(6)}×`
            : multiplier.ok
              ? "No pending corporate action"
              : "Corporate action unavailable",
        detail: multiplier.ok
          ? multiplier.data.pendingMultiplier != null
            ? `Pending activation ${
                multiplier.data.activationDateTime
                  ? new Date(multiplier.data.activationDateTime * 1000).toISOString()
                  : "n/a"
              }`
            : `Current ${multiplier.data.currentMultiplier.toFixed(6)}×`
          : "Waiting on live share count",
        tone:
          multiplier.ok && multiplier.data.pendingMultiplier != null ? "amber" : "neutral",
        mode: multiplier.ok ? multiplier.mode : "unavailable",
        icon: "ca",
        symbol,
      },
      {
        at: now,
        title: prefsFromSession
          ? corporateActionAlerts
            ? "Corporate-action alerts · on"
            : "Corporate-action alerts · off"
          : "Corporate-action alerts · connect to save",
        detail: prefsFromSession
          ? "Preference saved for your account."
          : "Connect in Settings to save alert preferences.",
        tone: prefsFromSession && corporateActionAlerts ? "blue" : "neutral",
        mode: prefsFromSession ? "paper" : "unavailable",
        icon: "alert",
      },
      {
        at: now,
        title: jupiterQuote.ok
          ? `Buy quote ready · ${jupiterCacheLabel}`
          : "Buy quote unavailable",
        detail: jupiterQuote.ok
          ? `You receive ~${jupiterQuote.data.outUiAmount.toFixed(6)} for $1 USDC`
          : jupiterQuote.reason,
        tone: jupiterQuote.ok ? "blue" : "amber",
        mode: jupiterQuote.ok ? jupiterQuote.mode : "unavailable",
        icon: "quote",
        symbol,
      },
      {
        at: now,
        title: wash.ok && wash.data.pass ? "Route looks clean" : "Checking route…",
        detail: wash.ok
          ? wash.data.notes.join("; ") || "Clear"
          : "Route check unavailable",
        tone: wash.ok && wash.data.pass ? "green" : "amber",
        mode: wash.ok ? wash.mode : "unavailable",
        icon: "wash",
      },
      {
        at: now,
        title: kamino.ok
          ? "Credit markets live"
          : "Credit markets unavailable",
        detail: kamino.ok
          ? `${kamino.data.reserves.length} reserves · deposit & borrow in-desk when fills arm`
          : kamino.reason,
        tone: kamino.ok ? "blue" : "amber",
        mode: kamino.ok ? kamino.mode : "unavailable",
        icon: "credit",
      },
      {
        at: now,
        title: nestCredit.ok
          ? "Earn vaults available"
          : "Earn vaults unavailable",
        detail: nestCredit.ok
          ? `Nest.credit vault awareness · ${nestCredit.data.vaultCount} vaults · read-only`
          : `Nest.credit vault awareness · ${nestCredit.reason}`,
        tone: nestCredit.ok ? "blue" : "amber",
        mode: nestCredit.ok ? nestCredit.mode : "unavailable",
        icon: "earn",
      },
      {
        at: now,
        title: "Borrow capacity",
        detail: nestusd.ok
          ? "NestUSD risk metrics · collateral LTV labeled in Borrow"
          : "NestUSD capacity not verified · unavailable",
        tone: "amber",
        mode: "unavailable",
        icon: "borrow",
      },
      {
        at: now,
        title: pools.ok
          ? `Pools for ${symbol}`
          : "Pool data unavailable",
        detail: pools.ok
          ? `${pools.data.raydium.length} pools observed`
          : pools.reason,
        tone: pools.ok ? "neutral" : "amber",
        mode: pools.ok ? pools.mode : "unavailable",
        icon: "pool",
        symbol,
      },
    ];

    return {
      events,
      note: "Live desk events from market feeds. Buys and borrows arm when fills are on for your account.",
      corporateActionAlerts,
      prefsFromSession,
    };
  },
);

export const getSessionBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionBundle> => {
    const session = readVerifiedSession();
    const auth = getAuthProviderStatus(session.ok ? session : null);
    const activeTenantId = session.ok
      ? resolveActiveTenantId(session.data)
      : null;
    const userId = session.ok ? session.data.userId : null;
    const preferences = await loadDeskPreferences(activeTenantId, userId);
    const watch = readWatchWallet();
    const readiness = await loadEmpireReadiness();
    return {
      auth,
      session,
      activeTenantId,
      preferences,
      networkPolicy: {
        mainnetRead: true,
        quoteOnly: true,
        // Unfunded · ≤~$1 — never report Enabled just because BROADCAST_PAUSED=false.
        broadcast: false,
        customProgramDeploy: false,
      },
      watchWallet: watch.ok ? watch.data.wallet : null,
      sessionSecretPresent: readiness.sessionSecretPresent,
      agentRouterKeyPresent: readiness.agentRouterKeyPresent,
      rlsNote: deskRlsHonestyNote(),
      readiness,
    };
  },
);

/** Empire key flags + optional Supabase schema probe — never invents greens. */
export const getEmpireReadiness = createServerFn({ method: "GET" }).handler(
  async (): Promise<EmpireReadiness> => loadEmpireReadiness(),
);

const AgentInput = z.object({
  prompt: z.string().min(1).max(500),
});

export const runDeskAgent = createServerFn({ method: "POST" })
  .validator(AgentInput)
  .handler(async ({ data }) => {
    const session = readVerifiedSession();
    const blocked = agentBlockedReason(session);
    if (blocked) {
      return errResult("folio.agent.paper", "agent_requires_session", blocked);
    }
    const clientKey = rateLimitClientKey({
      userId: session.ok ? session.data.userId : null,
      ip: readClientIp(),
    });
    /** Per-account daily AI budget — 5 messages / 24h (keyed by userId when present). */
    const daily = rateLimitCheck("agent_daily", clientKey);
    if (!daily.ok) {
      return errResult(
        "folio.agent.paper",
        "agent_daily_limit",
        `Daily agent limit reached (5 messages). Resets in ~${Math.ceil(daily.retryAfterSec / 3600)}h.`,
      );
    }
    const rl = rateLimitCheck("agent", clientKey);
    if (!rl.ok) {
      return errResult("folio.agent.paper", "rate_limited", rl.detail);
    }
    return runPaperAgent(data.prompt);
  });

/** Soft-gate desk access for chrome banners — never invents a membership. */
export const getDeskAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<DeskAccess> => deskAccessFromSession(readVerifiedSession()),
);

const PrefsInput = z.object({
  corporateActionAlerts: z.boolean(),
  strictFailClosed: z.boolean(),
});

/** Persist desk prefs for the active tenant — owner/trader only; viewers fail-closed. */
export const updateDeskPreferences = createServerFn({ method: "POST" })
  .validator(PrefsInput)
  .handler(async ({ data }) => {
    const session = readVerifiedSession();
    const sessionBlock = prefsSessionBlockedReason(session);
    if (sessionBlock) {
      return errResult(
        "folio.prefs.save",
        "prefs_require_session",
        sessionBlock,
      );
    }
    if (!session.ok) {
      return errResult(
        "folio.prefs.save",
        "prefs_require_session",
        session.detail ?? session.reason,
      );
    }
    const membership = activeMembership(session.data);
    const roleBlock = prefsWriteBlockedReason(membership);
    if (roleBlock) {
      return errResult("folio.prefs.save", "prefs_role_denied", roleBlock);
    }
    const tenantId = resolveActiveTenantId(session.data);
    return saveDeskPreferences(tenantId, session.data.userId, {
      corporateActionAlerts: data.corporateActionAlerts,
      strictFailClosed: data.strictFailClosed,
    });
  });

const ActiveTenantInput = z.object({
  tenantId: z.string().uuid(),
});

/**
 * Switch active tenant on the httpOnly folio_session — membership-validated.
 * Remints the signed cookie; never invents a tenant outside session.tenants.
 */
export const setActiveTenant = createServerFn({ method: "POST" })
  .validator(ActiveTenantInput)
  .handler(async ({ data }) => {
    const session = readVerifiedSession();
    if (!session.ok) {
      return errResult(
        "folio.session.active_tenant",
        "active_tenant_requires_session",
        session.detail ?? session.reason,
      );
    }
    const membership = session.data.tenants.find(
      (t) => t.tenantId === data.tenantId,
    );
    if (!membership) {
      return errResult(
        "folio.session.active_tenant",
        "active_tenant_not_member",
        "Tenant id is not on this session — refusing invent-a-membership switch.",
      );
    }
    const remainingMs = Date.parse(session.data.expiresAt) - Date.now();
    const ttlSec = Math.max(60, Math.floor(remainingMs / 1000));
    const minted = mintFolioSession({
      userId: session.data.userId,
      walletAddress: session.data.walletAddress,
      tenants: session.data.tenants,
      activeTenantId: data.tenantId,
      ttlSec,
    });
    if (!minted.ok) {
      return errResult(
        "folio.session.active_tenant",
        minted.reason,
        minted.detail,
      );
    }
    setCookie(FOLIO_SESSION_COOKIE, minted.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: ttlSec,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.session.active_tenant",
      data: {
        activeTenantId: data.tenantId,
        session: minted.data.session,
        note: `Active tenant set to ${membership.slug ?? membership.displayName ?? data.tenantId.slice(0, 8)}…`,
      },
    };
  });

const PrivySessionInput = z.object({
  accessToken: z.string().min(1).max(8_192),
  walletAddress: z.string().max(128).optional(),
});

/**
 * Exchange a Privy access token for an httpOnly folio_session cookie.
 * Fail-closed when keys missing, Privy rejects, or tenant lookup fails
 * (never mint with invented empty tenants on lookup error).
 */
export const createSessionFromPrivyToken = createServerFn({ method: "POST" })
  .validator(PrivySessionInput)
  .handler(async ({ data }) => {
    const built = await buildSessionFromPrivyToken({
      accessToken: data.accessToken,
      walletAddress: data.walletAddress ?? null,
    });
    if (!built.ok) {
      return errResult("folio.session.privy", built.reason, built.detail);
    }
    setCookie(FOLIO_SESSION_COOKIE, built.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.session.privy",
      data: {
        session: built.data.session,
        note: built.data.note,
      },
    };
  });

export const clearFolioSession = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      deleteCookie(FOLIO_SESSION_COOKIE, { path: "/" });
      return {
        ok: true as const,
        mode: "mainnet-read" as const,
        asOf: new Date().toISOString(),
        source: "folio.session.clear",
        data: {
          cleared: true as const,
          note: "httpOnly folio_session cleared — no localStorage residue.",
        },
      };
    } catch (e) {
      return errResult("folio.session.clear", "clear_failed", String(e));
    }
  },
);

/**
 * Attach current httpOnly session user to folio-demo as owner (service-role).
 * Then remint cookie so tenant memberships appear on the session.
 */
export const attachDemoTenantMembership = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = readVerifiedSession();
    if (!session.ok) {
      return errResult(
        "folio.demo-tenant.attach",
        "attach_requires_session",
        "Mint httpOnly folio_session with a Privy access token first.",
      );
    }
    const attached = await attachUserToDemoTenant({
      userId: session.data.userId,
      walletAddress: session.data.walletAddress,
    });
    if (!attached.ok) {
      return errResult(
        "folio.demo-tenant.attach",
        attached.reason,
        attached.detail,
      );
    }

    const memberships = await resolveTenantMemberships({
      userId: session.data.userId,
    });
    const tenants = memberships.ok ? memberships.data : session.data.tenants;
    const remainingMs = Date.parse(session.data.expiresAt) - Date.now();
    const ttlSec = Math.max(60, Math.floor(remainingMs / 1000));
    const minted = mintFolioSession({
      userId: session.data.userId,
      walletAddress: session.data.walletAddress,
      tenants,
      activeTenantId: attached.data.tenantId,
      ttlSec,
    });
    if (!minted.ok) {
      return errResult(
        "folio.demo-tenant.attach",
        minted.reason,
        `${attached.data.note} · remint failed: ${minted.detail ?? minted.reason}`,
      );
    }
    setCookie(FOLIO_SESSION_COOKIE, minted.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: ttlSec,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.demo-tenant.attach",
      data: {
        ...attached.data,
        session: minted.data.session,
        note: `${attached.data.note} · cookie reminted with ${tenants.length} membership(s)`,
      },
    };
  },
);

/**
 * Labeled Stocklana bootstrap: real Privy DID (REST custom_auth) → folio-demo
 * owner → httpOnly folio_session. No invented DID; no browser login required.
 */
export const bootstrapDemoDeskSession = createServerFn({ method: "POST" }).handler(
  async () => {
    const blocked = bootstrapBlockedReason();
    if (blocked) {
      return errResult(
        "folio.session.bootstrap-demo",
        "bootstrap_demo_disabled",
        blocked,
      );
    }
    const built = await buildBootstrapDemoSession();
    if (!built.ok) {
      return errResult(
        "folio.session.bootstrap-demo",
        built.reason,
        built.detail,
      );
    }
    setCookie(FOLIO_SESSION_COOKIE, built.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.session.bootstrap-demo",
      data: {
        session: built.data.session,
        userId: built.data.userId,
        tenantId: built.data.tenantId,
        memberships: built.data.memberships,
        multiTenantSessionReady: built.data.multiTenantSessionReady,
        note: built.data.note,
      },
    };
  },
);

const WatchWalletInput = z.object({
  wallet: z.string().min(32).max(64),
});

/**
 * Bind an optional httpOnly watch-wallet for mainnet-read position qty.
 * Requires FOLIO_SESSION_SECRET only — NOT Privy multi-tenant auth.
 */
export const bindWatchWallet = createServerFn({ method: "POST" })
  .validator(WatchWalletInput)
  .handler(async ({ data }) => {
    const minted = mintWatchWalletCookie(data.wallet);
    if (!minted.ok) {
      return errResult(
        "folio.watch-wallet.bind",
        minted.reason,
        minted.detail,
      );
    }
    setCookie(FOLIO_WATCH_WALLET_COOKIE, minted.data.cookieValue, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env["NODE_ENV"] === "production",
    });
    return {
      ok: true as const,
      mode: "mainnet-read" as const,
      asOf: new Date().toISOString(),
      source: "folio.watch-wallet.bind",
      data: {
        wallet: minted.data.wallet,
        note: "Watch-wallet bound for mainnet-read qty. Not a Privy session.",
      },
    };
  });

export const clearWatchWallet = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      deleteCookie(FOLIO_WATCH_WALLET_COOKIE, { path: "/" });
      return {
        ok: true as const,
        mode: "mainnet-read" as const,
        asOf: new Date().toISOString(),
        source: "folio.watch-wallet.clear",
        data: {
          cleared: true as const,
          note: "Watch-wallet cookie cleared.",
        },
      };
    } catch (e) {
      return errResult("folio.watch-wallet.clear", "clear_failed", String(e));
    }
  },
);

const WaitlistInput = z.object({
  email: z.string().email().max(200),
  wallet: z.string().max(88).optional(),
  note: z.string().max(280).optional(),
});

/**
 * Rate-limited beta waitlist — persists to Supabase beta_waitlist (service-role).
 * Never localStorage. Fail-closed when keys/migration missing.
 */
export const joinBetaWaitlist = createServerFn({ method: "POST" })
  .validator(WaitlistInput)
  .handler(async ({ data }) => {
    const session = readVerifiedSession();
    const rl = rateLimitCheck(
      "waitlist",
      rateLimitClientKey({
        userId: session.ok ? session.data.userId : null,
        ip: readClientIp(),
      }),
    );
    if (!rl.ok) {
      return {
        ok: false as const,
        reason: "rate_limited",
        detail: rl.detail,
      };
    }
    const saved = await upsertBetaWaitlist({
      email: data.email,
      wallet: data.wallet,
      note: data.note,
    });
    if (!saved.ok) {
      return {
        ok: false as const,
        reason: saved.reason,
        detail: saved.detail ?? "Waitlist unavailable.",
      };
    }
    return {
      ok: true as const,
      data: {
        email: saved.data.email,
        note: "Saved on FOLIO servers — you’ll get invite waves from the desk.",
      },
    };
  });
