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

  return (
    <div
      className={`fx-gas-ready${data.readyForExternalWrite ? " is-ok" : " is-warn"}`}
      data-testid="wallet-gas-ready"
      data-ready={data.readyForExternalWrite ? "1" : "0"}
    >
      <p className="fx-gas-ready-note">{data.note}</p>
      {!data.readyForExternalWrite ? (
        <WalletGasActions
          status={data}
          context={context}
          shellReady={shellReady}
          busyRefresh={isFetching}
          onFunded={() => void refetch()}
        />
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
          ? "Sign in above, then add a little SOL here."
          : "Open App (email) or save a wallet on Account, then add SOL."}
      </p>
    );
  }

  if (!shellReady) {
    return (
      <ManualFundHint wallet={status.wallet} />
    );
  }

  return (
    <FundWalletLive
      wallet={status.wallet}
      context={context}
      busyRefresh={busyRefresh}
      onFunded={onFunded}
    />
  );
}

function FundWalletLive({
  wallet,
  context,
  busyRefresh,
  onFunded,
}: {
  wallet: string;
  context: WalletGasContext;
  busyRefresh: boolean;
  onFunded: () => void;
}) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      onFunded();
    },
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const address = wallets[0]?.address ?? wallet;

  async function addFunds() {
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
    setBusy(true);
    trackFolioEvent("cta_click", { cta: "fund_wallet", context });
    try {
      await fundWallet({
        address,
        options: {
          amount: "0.05",
          asset: "native-currency",
          uiConfig: {
            receiveFundsTitle: "Add SOL for fees",
            receiveFundsSubtitle:
              "About 0.05 SOL covers typical Meteora, Reflect, and Kamino network fees. You pay — FOLIO never sponsors gas.",
          },
        },
      });
      onFunded();
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "Funding closed — you can still send SOL to your address below.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fx-gas-ready-actions">
      <button
        type="button"
        className="fx-btn fx-btn-primary fx-btn-sm"
        data-testid="wallet-gas-add-funds"
        disabled={busy || busyRefresh}
        onClick={() => void addFunds()}
      >
        {busy ? "Opening…" : authenticated ? "Add SOL" : "Open App to add SOL"}
      </button>
      <ManualFundHint wallet={address} />
      {err ? <p className="fx-gas-ready-err">{err}</p> : null}
    </div>
  );
}

function ManualFundHint({ wallet }: { wallet: string }) {
  const short = `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
  return (
    <p className="fx-gas-ready-hint">
      Or send ~0.05 SOL to <code title={wallet}>{short}</code> from an exchange
      or Phantom.
    </p>
  );
}
