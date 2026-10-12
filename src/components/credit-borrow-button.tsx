/**
 * In-desk Kamino borrow — ktx assembles deposit/borrow txs; Privy wallet signs + sends.
 * No outbound Kamino/NestUSD CTA. No FOLIO program CPI.
 */
import { useLogin, usePrivy } from "@privy-io/react-auth";
import {
  useSignAndSendTransaction,
  useWallets,
} from "@privy-io/react-auth/solana";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import bs58 from "bs58";
import { usePrivyShellReady } from "@/components/privy-app-provider";
import { trackFolioEvent } from "@/lib/analytics";
import {
  prepareKaminoBorrow,
  prepareKaminoDeposit,
} from "@/lib/desk.functions";
import { KAMINO_USDC_RESERVE } from "@/lib/adapters/kamino-ktx";
import { base64ToBytes } from "@/lib/solana-tx-bytes";

type Props = {
  broadcastPaused: boolean;
  /** Collateral reserve pubkey (xStock). */
  collateralReserve: string;
  collateralSymbol: string;
  /** Decimal amount of collateral to deposit (0 = skip deposit). */
  depositAmount: string;
  /** Decimal USDC to borrow (0 = deposit-only). */
  borrowAmount: string;
  onError: (msg: string) => void;
  onSuccess: (sig: string | null, stage: "deposit" | "borrow") => void;
};

export function CreditBorrowButton(props: Props) {
  const shellReady = usePrivyShellReady();
  const depositOk =
    Number(props.depositAmount) > 0 && Boolean(props.collateralReserve);
  const borrowOk = Number(props.borrowAmount) > 0;
  const canRun = depositOk || borrowOk;

  if (!canRun) {
    return (
      <button
        type="button"
        className="fx-btn fx-btn-primary fx-btn-block"
        disabled
        data-testid="credit-borrow-execute"
      >
        Enter deposit or borrow amount
      </button>
    );
  }

  if (props.broadcastPaused) {
    return (
      <button
        type="button"
        className="fx-btn fx-btn-primary fx-btn-block"
        disabled
        data-testid="credit-borrow-execute"
      >
        Borrow — fills paused
      </button>
    );
  }

  if (!shellReady) {
    return (
      <button
        type="button"
        className="fx-btn fx-btn-primary fx-btn-block"
        disabled
        data-testid="credit-borrow-execute"
      >
        Open App to borrow
      </button>
    );
  }

  return <CreditBorrowArmed {...props} depositOk={depositOk} borrowOk={borrowOk} />;
}

function CreditBorrowArmed(
  props: Props & { depositOk: boolean; borrowOk: boolean },
) {
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const prepareDeposit = useServerFn(prepareKaminoDeposit);
  const prepareBorrow = useServerFn(prepareKaminoBorrow);
  const [busy, setBusy] = useState(false);

  const label =
    props.depositOk && props.borrowOk
      ? `Deposit ${props.collateralSymbol} · borrow USDC`
      : props.depositOk
        ? `Deposit ${props.collateralSymbol}`
        : "Borrow USDC";

  async function signSend(
    txB64: string,
    wallet: (typeof wallets)[0],
  ): Promise<string> {
    const result = await signAndSendTransaction({
      transaction: base64ToBytes(txB64),
      wallet,
    });
    return bs58.encode(result.signature);
  }

  async function run() {
    props.onError("");
    if (!ready) {
      props.onError("Wallet shell still loading — try again in a moment.");
      return;
    }
    if (!authenticated) {
      trackFolioEvent("open_app", { from: "credit_borrow" });
      login();
      return;
    }
    const wallet = wallets[0];
    if (!wallet?.address) {
      props.onError("No Solana wallet — Open App and connect or create one.");
      return;
    }

    setBusy(true);
    trackFolioEvent("cta_click", {
      cta: "borrow_inhouse",
      symbol: props.collateralSymbol,
    });

    try {
      if (props.depositOk) {
        const prepared = await prepareDeposit({
          data: {
            wallet: wallet.address,
            reserve: props.collateralReserve,
            amount: props.depositAmount,
          },
        });
        if (!prepared.ok) {
          props.onError(prepared.detail ?? prepared.reason);
          return;
        }
        const sig = await signSend(prepared.data.transaction, wallet);
        props.onSuccess(sig, "deposit");
      }

      if (props.borrowOk) {
        const prepared = await prepareBorrow({
          data: {
            wallet: wallet.address,
            reserve: KAMINO_USDC_RESERVE,
            amount: props.borrowAmount,
          },
        });
        if (!prepared.ok) {
          props.onError(
            prepared.detail ??
              prepared.reason +
                (props.depositOk
                  ? ""
                  : " — deposit collateral first if you have no Kamino obligation."),
          );
          return;
        }
        const sig = await signSend(prepared.data.transaction, wallet);
        props.onSuccess(sig, "borrow");
      }
    } catch (e) {
      props.onError(
        e instanceof Error ? e.message : "Borrow failed — try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="fx-btn fx-btn-primary fx-btn-block"
      data-testid="credit-borrow-execute"
      disabled={busy}
      onClick={() => void run()}
    >
      {busy ? "Signing…" : !authenticated ? "Open App to borrow" : label}
    </button>
  );
}
