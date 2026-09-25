/**
 * Buy CTA — quote-only while fills paused; when armed: prepare → Privy sign → execute.
 * Supports xStocks catalog buys and partner mint path (PreStocks / Tessera in-desk).
 */
import { useLogin, usePrivy } from "@privy-io/react-auth";
import {
  useSignTransaction,
  useWallets,
} from "@privy-io/react-auth/solana";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { usePrivyShellReady } from "@/components/privy-app-provider";
import { trackFolioEvent } from "@/lib/analytics";
import {
  executeJupiterSwap,
  prepareJupiterSwap,
} from "@/lib/desk.functions";
import { base64ToBytes, bytesToBase64 } from "@/lib/solana-tx-bytes";

type Props = {
  canBuy: boolean;
  isPair: boolean;
  broadcastPaused: boolean;
  symbol: string;
  paySymbol: string;
  amount: number;
  slippageBps: number;
  /** Partner path — PreStocks / Tessera mint (skip xStocks catalog). */
  outputMint?: string | null;
  outputDecimals?: number;
  /** Partner only: buy = stable → mint · sell = mint → stable. */
  side?: "buy" | "sell";
  pausedLabel?: string;
  confirmLabel?: string;
  onError: (msg: string) => void;
  onSuccess: (sig: string | null) => void;
};

export function BuyExecuteButton(props: Props) {
  const shellReady = usePrivyShellReady();

  if (!props.canBuy) {
    return (
      <button
        type="button"
        className="fx-btn fx-btn-primary fx-btn-block"
        disabled
        data-testid="acquire-execute"
      >
        {props.pausedLabel ?? "Paused. Check wash or quote."}
      </button>
    );
  }

  if (props.broadcastPaused) {
    return (
      <button
        type="button"
        className="fx-btn fx-btn-primary fx-btn-block"
        disabled
        data-testid="acquire-execute"
      >
        {props.pausedLabel ??
          (props.isPair ? "Swap stocks. Fills paused." : "Swap. Fills paused.")}
      </button>
    );
  }

  if (!shellReady) {
    return (
      <button
        type="button"
        className="fx-btn fx-btn-primary fx-btn-block"
        disabled
        data-testid="acquire-execute"
      >
        Open App to buy
      </button>
    );
  }

  return <BuyExecuteArmed {...props} />;
}

function BuyExecuteArmed(props: Props) {
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin();
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const prepare = useServerFn(prepareJupiterSwap);
  const execute = useServerFn(executeJupiterSwap);
  const [busy, setBusy] = useState(false);

  const label =
    props.confirmLabel ??
    (props.isPair ? "Confirm stock swap" : "Confirm buy");

  async function run() {
    props.onError("");
    if (!ready) {
      props.onError("Wallet shell still loading — try again in a moment.");
      return;
    }
    if (!authenticated) {
      trackFolioEvent("open_app", { from: "buy_execute" });
      login();
      return;
    }
    const wallet = wallets[0];
    if (!wallet?.address) {
      props.onError("No Solana wallet — Open App and connect or create one.");
      return;
    }

    setBusy(true);
    trackFolioEvent("buy_prepare", {
      symbol: props.symbol,
      pair: props.isPair,
      amount: props.amount,
      partner: Boolean(props.outputMint),
    });
    try {
      const prepared = await prepare({
        data: {
          symbol: props.symbol,
          taker: wallet.address,
          slippageBps: props.slippageBps,
          ...(props.outputMint
            ? {
                spendUsdc: props.amount,
                amount: props.amount,
                paySymbol: props.paySymbol,
                outputMint: props.outputMint,
                outputDecimals: props.outputDecimals ?? 9,
                side: props.side ?? "buy",
              }
            : props.isPair
              ? { paySymbol: props.paySymbol, amount: props.amount }
              : {
                  spendUsdc: props.amount,
                  paySymbol: props.paySymbol,
                }),
        },
      });
      if (!prepared.ok) {
        trackFolioEvent("buy_execute_fail", {
          stage: "prepare",
          reason: prepared.reason,
        });
        props.onError(prepared.detail ?? prepared.reason);
        return;
      }
      const txB64 = prepared.data.transaction;
      const requestId = prepared.data.requestId;
      if (!txB64 || !requestId) {
        props.onError(
          "No signable order — try again or check gas / min size (~$10 for gasless).",
        );
        return;
      }

      const signed = await signTransaction({
        transaction: base64ToBytes(txB64),
        wallet,
      });
      const signedB64 = bytesToBase64(signed.signedTransaction);
      const landed = await execute({
        data: {
          signedTransaction: signedB64,
          requestId,
        },
      });
      if (!landed.ok) {
        trackFolioEvent("buy_execute_fail", {
          stage: "execute",
          reason: landed.reason,
        });
        props.onError(landed.detail ?? landed.reason);
        return;
      }
      trackFolioEvent("buy_execute", {
        symbol: props.symbol,
        status: landed.data.status,
      });
      props.onSuccess(landed.data.signature);
    } catch (e) {
      trackFolioEvent("buy_execute_fail", { stage: "client" });
      props.onError(
        e instanceof Error ? e.message : "Buy failed — try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="fx-btn fx-btn-primary fx-btn-block"
      data-testid="acquire-execute"
      disabled={busy || !props.canBuy}
      onClick={() => void run()}
    >
      {busy ? "Signing…" : !authenticated ? "Open App to buy" : label}
    </button>
  );
}
