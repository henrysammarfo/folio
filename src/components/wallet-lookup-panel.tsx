import { Link } from "@tanstack/react-router";
import { Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";

/** Consumer wallet lookup — no ephemeral/pubkey/session jargon. */
export function WalletLookupPanel({
  inspectInput,
  onInspectInput,
  inspectActive,
  onLookUp,
  onClear,
  boundElsewhere,
}: {
  inspectInput: string;
  onInspectInput: (value: string) => void;
  inspectActive: boolean;
  onLookUp: () => void;
  onClear: () => void;
  boundElsewhere?: boolean;
}) {
  return (
    <Panel
      title="Look up a wallet"
      meta={
        <StatusBadge tone={inspectActive ? "green" : "neutral"}>
          {inspectActive ? "Looking up" : boundElsewhere ? "Connected" : "Optional"}
        </StatusBadge>
      }
    >
      <p className="mb-3 text-sm opacity-80">
        Paste any Solana address to see live share counts. Prefer{" "}
        <Link to="/desk/settings" className="underline">
          Settings → connect wallet
        </Link>{" "}
        to save yours.
      </p>
      <div className="form-grid">
        <label>
          Wallet address
          <input
            value={inspectInput}
            onChange={(e) => onInspectInput(e.target.value)}
            placeholder="Paste wallet address"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="form-actions">
          <button
            type="button"
            className="wallet-pill"
            disabled={!inspectInput.trim()}
            onClick={onLookUp}
          >
            Look up
          </button>
          <button
            type="button"
            className="wallet-pill"
            disabled={!inspectActive}
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>
    </Panel>
  );
}

export function walletSourceBadge(source: string | null | undefined, authOk?: boolean): string {
  if (source === "membership" || source === "session") return "Connected";
  if (source === "watch-wallet") return "Connected";
  if (source === "inspect") return "Lookup";
  if (authOk) return "Connect a wallet";
  return "Connect a wallet";
}
