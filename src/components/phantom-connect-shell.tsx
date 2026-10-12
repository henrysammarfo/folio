import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const PhantomShellReadyContext = createContext(false);

/** True when desk is wrapped in a live PhantomProvider (client). */
export function usePhantomShellReady(): boolean {
  return useContext(PhantomShellReadyContext);
}

const PhantomProviderLazy = lazy(async () => {
  const mod = await import("@phantom/react-sdk");
  const { AddressType } = await import("@phantom/browser-sdk");
  function LivePhantomProvider({
    appId,
    children,
  }: {
    appId: string | null;
    children: ReactNode;
  }) {
    const providers = appId
      ? (["google", "apple", "phantom", "injected"] as const)
      : (["injected"] as const);
    return (
      <mod.PhantomProvider
        config={{
          providers: [...providers],
          addressTypes: [AddressType.solana],
          ...(appId ? { appId } : {}),
        }}
        appName="FOLIO"
      >
        <PhantomShellReadyContext.Provider value={true}>
          {children}
        </PhantomShellReadyContext.Provider>
      </mod.PhantomProvider>
    );
  }
  return { default: LivePhantomProvider };
});

/**
 * Desk Phantom Connect dual-path beside Privy.
 * Injected extension works without App ID; embedded social needs PHANTOM_APP_ID.
 * Never mints folio_session — bind watch-wallet after connect if desired.
 */
export function PhantomConnectShell({
  appId,
  children,
}: {
  appId: string | null | undefined;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <PhantomShellReadyContext.Provider value={false}>
        {children}
      </PhantomShellReadyContext.Provider>
    );
  }

  return (
    <Suspense
      fallback={
        <PhantomShellReadyContext.Provider value={false}>
          {children}
        </PhantomShellReadyContext.Provider>
      }
    >
      <PhantomProviderLazy appId={appId?.trim() || null}>
        {children}
      </PhantomProviderLazy>
    </Suspense>
  );
}
