import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Panel } from "@/components/desk-shell";
import { StatusBadge } from "@/components/folio-brand";

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isPlausibleSolanaAddress(value: string): boolean {
  const v = value.trim();
  return BASE58_RE.test(v);
}

/** Consumer wallet lookup — validated address + honeypot spam trap. */
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
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  function submit() {
    if (honeypot.trim()) return; // bot filled hidden field
    const next = inspectInput.trim();
    if (!next) {
      setError("Paste a wallet address.");
      return;
    }
    if (!isPlausibleSolanaAddress(next)) {
      setError("That doesn’t look like a Solana address.");
      return;
    }
    setError(null);
    onLookUp();
  }

  return (
    <Panel
      title="Look up a wallet"
      className="desk-card-lift"
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
      <div className="form-grid form-grid-single">
        <label>
          Wallet address
          <input
            value={inspectInput}
            onChange={(e) => {
              onInspectInput(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste wallet address"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "wallet-lookup-error" : undefined}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </label>
        {/* Honeypot — hidden from users */}
        <label className="hp-field" aria-hidden="true">
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
        {error ? (
          <p id="wallet-lookup-error" className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="form-actions">
          <button
            type="button"
            className="wallet-pill wallet-pill-primary"
            disabled={!inspectInput.trim()}
            onClick={submit}
          >
            Look up
          </button>
          <button
            type="button"
            className="wallet-pill"
            disabled={!inspectActive}
            onClick={() => {
              setError(null);
              onClear();
            }}
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
