import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AssetLogo } from "@/components/asset-logo";
import { DeskShell } from "@/components/desk-shell";
import {
  useWalletGasStatus,
  WalletGasReady,
} from "@/components/wallet-gas-ready";
import { trackFolioEvent } from "@/lib/analytics";
import { getMeteoraDbcBundle } from "@/lib/desk.functions";
import { siteMeta } from "@/lib/site-meta";

export const Route = createFileRoute("/desk/dbc")({
  head: () => ({
    meta: siteMeta({
      title: "New launches — FOLIO",
      description: "Fresh Solana launches. Open a pool and trade with your wallet.",
      path: "/desk/dbc",
    }),
  }),
  loader: async () => getMeteoraDbcBundle(),
  component: Page,
});

function Page() {
  const initial = Route.useLoaderData();
  const fetchDbc = useServerFn(getMeteoraDbcBundle);
  const { data } = useQuery({
    queryKey: ["meteora-dbc"],
    queryFn: () => fetchDbc(),
    initialData: initial,
    initialDataUpdatedAt: Date.now(),
    staleTime: 30_000,
  });

  const ok = data?.dbc.ok;
  const sample = ok ? data.dbc.data.sample : [];
  const total = ok ? data.dbc.data.totalPools : null;
  const appUrl = ok ? data.dbc.data.appUrl : "https://app.meteora.ag/";
  const { data: gas } = useWalletGasStatus();
  const gasReady = Boolean(gas?.readyForExternalWrite);

  return (
    <DeskShell title="Launches">
      <section className="fx-page">
        <header className="fx-hero">
          <p className="fx-hero-kicker">New on Solana</p>
          <h1 className="fx-hero-value">
            {total != null ? total.toLocaleString("en-US") : "—"}
          </h1>
          <p className="fx-hero-sub">
            Fresh pools you can open and trade. Your wallet signs. FOLIO never
            holds the keys.
          </p>
        </header>

        <WalletGasReady context="launches" />

        <div className="fx-actions">
          {gasReady ? (
            <a
              href={appUrl}
              className="fx-btn fx-btn-primary"
              target="_blank"
              rel="noreferrer"
              data-testid="dbc-open-app"
              onClick={() =>
                trackFolioEvent("cta_click", { cta: "meteora_app" })
              }
            >
              Open Meteora
            </a>
          ) : (
            <a
              href={appUrl}
              className="fx-btn fx-btn-ghost"
              target="_blank"
              rel="noreferrer"
              data-testid="dbc-open-app"
              onClick={() =>
                trackFolioEvent("cta_click", {
                  cta: "meteora_app",
                  gas: "low",
                })
              }
            >
              Open Meteora anyway
            </a>
          )}
          <Link to="/desk/acquire" className="fx-btn fx-btn-ghost">
            Buy stocks
          </Link>
        </div>

        {sample.length > 0 ? (
          <>
            <h2 className="fx-section-title">Live pools</h2>
            <div className="fx-card">
              <ul className="fx-list" data-testid="dbc-pool-rows">
                {sample.map((p) => (
                  <li key={p.address} className="fx-asset">
                    <AssetLogo
                      symbol={p.baseSymbol}
                      mint={p.baseMint}
                      logo={p.baseLogo}
                      size={40}
                    />
                    <span className="fx-asset-main">
                      <strong>
                        {p.baseName?.trim() || p.baseSymbol}
                      </strong>
                      <small>
                        {p.baseSymbol}/{p.quoteSymbol}
                      </small>
                    </span>
                    <span className="fx-asset-right">
                      <a
                        href={p.tradeUrl}
                        className={`fx-btn fx-btn-sm ${gasReady ? "fx-btn-primary" : "fx-btn-ghost"}`}
                        target="_blank"
                        rel="noreferrer"
                        data-testid={`dbc-trade-${p.baseSymbol}`}
                        title={
                          gasReady
                            ? "Trade on Meteora with your wallet"
                            : "Needs SOL for fees — add funds above first"
                        }
                        onClick={() =>
                          trackFolioEvent("cta_click", {
                            cta: "meteora_trade",
                            pool: p.address.slice(0, 8),
                            gas: gasReady ? "ok" : "low",
                          })
                        }
                      >
                        {gasReady ? "Trade" : "Trade (needs SOL)"}
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="fx-sub" data-testid="dbc-unavailable">
            {ok === false && data?.dbc && !data.dbc.ok
              ? "Launches are offline right now. Try again in a minute."
              : "No pools to show yet."}
          </p>
        )}

        <p className="fx-sub" style={{ marginTop: "1.25rem" }}>
          Tap Trade to open the pool in Meteora and buy or sell with your wallet.
          Email sign-up wallets start empty — add a little SOL first. Stock buys
          on FOLIO stay on the Buy tab.
        </p>
      </section>
    </DeskShell>
  );
}
