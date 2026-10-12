import { usePrivy } from "@privy-io/react-auth";
import { useFundWallet, useWallets } from "@privy-io/react-auth/solana";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { usePrivyShellReady } from "@/components/privy-app-provider";
import { trackFolioEvent } from "@/lib/analytics";
import { getWalletGasStatus, type WalletGasStatus } from "@/lib/desk.functions";

export type WalletGasContext = "launches" | "borrow" | "account" | "buy";

type Props = {
  context: WalletGasContext;
  /** Optional ?inspect= pubkey — mainnet-read only. */
  inspectWallet?: string;
};

/**
 * Consumer gas honesty for email / embedded wallets.
 * Empty SOL is the main loophole after Open App — deep-links to Meteora /
 * Reflect / Kamino fail without fees. FOLIO does not sponsor gas.
 */
export function WalletGasReady({ context, inspectWallet }: Props) {
  const shellReady = usePrivyShellReady();
  const fetchGas = useServerFn(getWalletGasStatus);
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["wallet-gas", inspectWallet ?? ""],
    queryFn: () =>
      fetchGas({
        data: inspectWallet ? { inspectWallet } : {},
      }),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  if (!data) return null;

  const showFund =
    !data.readyForExternalWrite || context === "buy" || context === "account";

  return (
    <div
      className={`fx-gas-ready${data.readyForExternalWrite ? " is-ok" : " is-warn"}`}
      data-testid="wallet-gas-ready"
      data-ready={data.readyForExternalWrite ? "1" : "0"}
    >
      <p className="fx-gas-ready-note">
        {context === "buy" && data.readyForExternalWrite
          ? `${data.note} Buy also needs USDC in this wallet (or SOL to swap).`
          : data.note}
      </p>
      {showFund ? (
        <WalletGasActions
          status={data}
          context={context}
          shellReady={shellReady}
          busyRefresh={isFetching}
          onFunded={() => void refetch()}
        />
      ) : data.wallet ? (
        <CopyAddressRow wallet={data.wallet} />
      ) : null}
    </div>
  );
}

/** Hook for pages that need to gate Trade / Borrow CTAs. */
export function useWalletGasStatus(inspectWallet?: string) {
  const fetchGas = useServerFn(getWalletGasStatus);
  return useQuery({
    queryKey: ["wallet-gas", inspectWallet ?? ""],
    queryFn: () =>
      fetchGas({
        data: inspectWallet ? { inspectWallet } : {},
      }),
    staleTime: 15_000,
  });
}

function WalletGasActions({
  status,
  context,
  shellReady,
  busyRefresh,
  onFunded,
}: {
  status: WalletGasStatus;
  context: WalletGasContext;
  shellReady: boolean;
  busyRefresh: boolean;
  onFunded: () => void;
}) {
  if (!status.wallet) {
    return (
      <p className="fx-gas-ready-hint">
        {context === "account"
          ? "Sign in above, then add SOL (and USDC to buy) here."
          : "Open App (email) or save a wallet on Account, then add SOL."}
      </p>
    );
  }

  if (!shellReady) {
    return <ManualFundHint wallet={status.wallet} />;
  }

  return (
    <FundWalletLive
      wallet={status.wallet}
      context={context}
      busyRefresh={busyRefresh}
      gasReady={status.readyForExternalWrite}
      onFunded={onFunded}
    />
  );
}

function FundWalletLive({
  wallet,
  context,
  busyRefresh,
  gasReady,
  onFunded,
}: {
  wallet: string;
  context: WalletGasContext;
  busyRefresh: boolean;
  gasReady: boolean;
  onFunded: () => void;
}) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      onFunded();
    },
  });
  const [busy, setBusy] = useState<"sol" | "usdc" | null>(null);
  const [err, setErr] = useState("");

  const address = wallets[0]?.address ?? wallet;
  const wantUsdc = context === "buy" || context === "account";

  async function addFunds(asset: "native-currency" | "USDC") {
    setErr("");
    if (!ready) {
      setErr("Wallet shell still loading — try again in a moment.");
      return;
    }
    if (!authenticated) {
      trackFolioEvent("open_app", { from: `gas_${context}` });
      login();
      return;
    }
    setBusy(asset === "USDC" ? "usdc" : "sol");
    trackFolioEvent("cta_click", {
      cta: asset === "USDC" ? "fund_usdc" : "fund_wallet",
      context,
    });
    try {
      await fundWallet({
        address,
        options: {
          amount: asset === "USDC" ? "10" : "0.05",
          asset,
          uiConfig: {
            receiveFundsTitle:
              asset === "USDC" ? "Add USDC to buy" : "Add SOL for fees",
            receiveFundsSubtitle:
              asset === "USDC"
                ? "About $10 USDC covers a first stock buy. You pay — FOLIO never moves funds for you."
                : "About 0.05 SOL covers typical Meteora, Reflect, and Kamino network fees. You pay — FOLIO never sponsors gas.",
          },
        },
      });
      onFunded();
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "Funding closed — you can still send funds to your address below.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fx-gas-ready-actions">
      {!gasReady ? (
        <button
          type="button"
          className="fx-btn fx-btn-primary fx-btn-sm"
          data-testid="wallet-gas-add-funds"
          disabled={busy != null || busyRefresh}
          onClick={() => void addFunds("native-currency")}
        >
          {busy === "sol"
            ? "Opening…"
            : authenticated
              ? "Add SOL"
              : "Open App to add SOL"}
        </button>
      ) : null}
      {wantUsdc ? (
        <button
          type="button"
          className={`fx-btn fx-btn-sm ${gasReady ? "fx-btn-primary" : "fx-btn-ghost"}`}
          data-testid="wallet-gas-add-usdc"
          disabled={busy != null || busyRefresh}
          onClick={() => void addFunds("USDC")}
        >
          {busy === "usdc"
            ? "Opening…"
            : authenticated
              ? "Add USDC"
              : "Open App to add USDC"}
        </button>
      ) : null}
      <CopyAddressRow wallet={address} />
      <ManualFundHint wallet={address} />
      {err ? <p className="fx-gas-ready-err">{err}</p> : null}
    </div>
  );
}

function CopyAddressRow({ wallet }: { wallet: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="fx-gas-ready-copy">
      <code title={wallet}>{wallet}</code>
      <button
        type="button"
        className="fx-btn fx-btn-ghost fx-btn-sm"
        data-testid="wallet-gas-copy"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(wallet);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            /* fallback: user can select the code */
          }
        }}
      >
        {copied ? "Copied" : "Copy address"}
      </button>
    </div>
  );
}

function ManualFundHint({ wallet }: { wallet: string }) {
  return (
    <p className="fx-gas-ready-hint">
      Or send SOL / USDC from an exchange or Phantom to the address above (
      {wallet.slice(0, 4)}…{wallet.slice(-4)}).
    </p>
  );
}
