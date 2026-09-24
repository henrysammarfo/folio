import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";
import { useState } from "react";
import { usePrivyShellReady } from "@/components/privy-app-provider";

/**
 * Advanced custody — link external wallet + export embedded key with warnings.
 * Consumer-facing; no API key jargon.
 */
export function AccountCustodyPanel() {
  const shellReady = usePrivyShellReady();
  const [ack, setAck] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!shellReady) {
    return (
      <p className="fx-sub">
        Sign in with Open App first — then you can link a wallet or export your
        embedded key.
      </p>
    );
  }

  return (
    <AccountCustodyLive
      ack={ack}
      setAck={setAck}
      msg={msg}
      setMsg={setMsg}
      busy={busy}
      setBusy={setBusy}
    />
  );
}

function AccountCustodyLive({
  ack,
  setAck,
  msg,
  setMsg,
  busy,
  setBusy,
}: {
  ack: boolean;
  setAck: (v: boolean) => void;
  msg: string;
  setMsg: (v: string) => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
}) {
  const { ready, authenticated, linkWallet, user } = usePrivy();
  const { exportWallet } = useExportWallet();

  if (!ready) {
    return <p className="fx-sub">Loading account tools…</p>;
  }

  if (!authenticated) {
    return (
      <p className="fx-sub">
        Sign in with Open App first — then you can link a wallet or export your
        embedded key.
      </p>
    );
  }

  const hasEmbedded = Boolean(
    user?.linkedAccounts?.some(
      (a) =>
        a.type === "wallet" &&
        "walletClientType" in a &&
        a.walletClientType === "privy" &&
        "chainType" in a &&
        a.chainType === "solana",
    ),
  );

  return (
    <div className="fx-custody">
      <p className="fx-sub">
        Email sign-in creates an embedded Solana wallet. Already have Phantom or
        Solflare? Link it. Leaving FOLIO? Export only after you understand the
        risks.
      </p>

      <div className="fx-chip-row" style={{ marginTop: "0.85rem" }}>
        <button
          type="button"
          className="fx-btn fx-btn-dark fx-btn-sm"
          disabled={busy}
          onClick={() => linkWallet()}
        >
          Link wallet
        </button>
      </div>

      <div className="fx-custody-warn" style={{ marginTop: "1.1rem" }}>
        <h3 style={{ margin: "0 0 0.35rem", fontSize: "0.85rem" }}>
          Export private key
        </h3>
        <ul className="fx-sub" style={{ margin: "0 0 0.65rem", paddingLeft: "1.1rem" }}>
          <li>Anyone with this key can take your funds.</li>
          <li>Never paste it into a website chat, Discord, or DM.</li>
          <li>Prefer hardware / official Phantom · Solflare · MetaMask import.</li>
          <li>FOLIO cannot reverse a leaked key.</li>
        </ul>
        <label className="fx-sub" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
          />
          <span>I understand — show export only to me on this device.</span>
        </label>
        <button
          type="button"
          className="fx-btn fx-btn-primary fx-btn-sm"
          style={{ marginTop: "0.75rem" }}
          disabled={!ack || busy || !hasEmbedded}
          onClick={() => {
            setBusy(true);
            setMsg("");
            void (async () => {
              try {
                await exportWallet();
                setMsg("Export opened in Privy’s secure dialog.");
              } catch (e) {
                setMsg(
                  e instanceof Error
                    ? e.message
                    : "Export unavailable for this account.",
                );
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? "…" : hasEmbedded ? "Export key…" : "No embedded wallet"}
        </button>
        {msg ? <p className="fx-sub" style={{ marginTop: "0.5rem" }}>{msg}</p> : null}
      </div>
    </div>
  );
}
