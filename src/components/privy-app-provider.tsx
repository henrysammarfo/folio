import {
  PrivyProvider,
  type PrivyClientConfig,
} from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const solanaConnectors = toSolanaWalletConnectors();

const PrivyShellReadyContext = createContext(false);

/** True only when desk is wrapped in a live PrivyProvider (client + app id). */
export function usePrivyShellReady(): boolean {
  return useContext(PrivyShellReadyContext);
}

/**
 * Desk-wide Privy shell — email / social → embedded Solana wallet,
 * or connect Phantom / Solflare. Public App ID only (never secret).
 * Client-only mount so SSR / first paint never call usePrivy without a provider.
 */
export function PrivyAppProvider({
  appId,
  children,
}: {
  appId: string | null | undefined;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const id = appId?.trim() ?? "";
  const config = useMemo<PrivyClientConfig>(
    () => ({
      appearance: {
        theme: "light",
        accentColor: "#0EA5C9",
        walletChainType: "solana-only",
      },
      loginMethods: ["email", "wallet", "google"],
      embeddedWallets: {
        solana: {
          createOnLogin: "users-without-wallets",
        },
      },
      externalWallets: {
        solana: {
          connectors: solanaConnectors,
        },
      },
    }),
    [],
  );

  const live = Boolean(id && mounted);

  if (!live) {
    return (
      <PrivyShellReadyContext.Provider value={false}>
        {children}
      </PrivyShellReadyContext.Provider>
    );
  }

  return (
    <PrivyProvider appId={id} config={config}>
      <PrivyShellReadyContext.Provider value={true}>
        {children}
      </PrivyShellReadyContext.Provider>
    </PrivyProvider>
  );
}
