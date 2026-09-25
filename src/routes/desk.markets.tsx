import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AssetLogo } from "@/components/asset-logo";
import { DeskShell } from "@/components/desk-shell";
import { getMarketsBoard } from "@/lib/desk.functions";
import { humanizeVenueNote } from "@/lib/humanize-copy";
import { siteMeta } from "@/lib/site-meta";
import { LANE_META, type XStockLane } from "@/lib/xstock-catalog";

type LaneFilter = "all" | XStockLane;

export const Route = createFileRoute("/desk/markets")({
  head: () => ({
    meta: siteMeta({
      title: "Markets — FOLIO",
      description:
        "Live Jupiter venue prices for mega, IPO, and meme xStocks on Solana.",
      path: "/desk/markets",
    }),
  }),
  loader: async () => getMarketsBoard({ data: { lane: "all" } }),
  component: Page,
});

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 2 : 4,
  });
}

function shortLiq(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return money(n);
}

function Page() {
  const initial = Route.useLoaderData();
  const [lane, setLane] = useState<LaneFilter>("all");
  const fetchBoard = useServerFn(getMarketsBoard);
  const { data, isFetching } = useQuery({
    queryKey: ["markets-board", lane],
    queryFn: () => fetchBoard({ data: { lane } }),
    initialData: lane === "all" ? initial : undefined,
    initialDataUpdatedAt: Date.now(),
    staleTime: 20_000,
    refetchInterval: 45_000,
  });

  const rows = data?.rows ?? [];
  const priced = useMemo(
    () => rows.filter((r) => r.usdPrice != null).length,
    [rows],
  );

  return (
    <DeskShell title="Markets">
      <section className="fx-page fx-markets">
        <header className="fx-markets-hero">
          <div>
            <p className="fx-hero-kicker">Live board</p>
            <h1>Markets</h1>
            <p className="fx-sub">
              {data?.note ??
                "Jupiter + free-tape venue prices for the desk catalog."}
              {isFetching ? " · refreshing…" : ""}
            </p>
          </div>
          <div className="fx-markets-stats">
            <span>
              <b>{priced}</b> priced
            </span>
            <span>
              <b>{rows.length}</b> listed
            </span>
          </div>
        </header>

        <div
          className="fx-markets-flow"
          data-testid="markets-flow-strip"
          aria-label="Quick trade flow"
        >
          {rows.slice(0, 10).map((row) => (
            <Link
              key={row.symbol}
              to="/desk/acquire"
              className="fx-markets-flow-chip"
              aria-label={`Buy ${row.symbol}`}
            >
              <AssetLogo
                symbol={row.symbol}
                logo={row.logo}
                underlying={row.underlying}
                size={32}
              />
              <span>
                <strong>{row.underlying}</strong>
                <small>
                  {row.usdPrice != null ? money(row.usdPrice) : "—"}
                </small>
              </span>
            </Link>
          ))}
          {rows.length === 0 ? (
            <p className="fx-ticket-sub">Loading market flow…</p>
          ) : null}
        </div>

        <div className="fx-lane-row fx-markets-tabs" role="tablist">
          {(["all", "mega", "ipo", "meme"] as const).map((id) => {
            const meta = LANE_META.find((l) => l.id === id);
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={lane === id}
                className={`fx-lane${lane === id ? " is-on" : ""}`}
                onClick={() => setLane(id)}
              >
                {meta?.label ?? id}
              </button>
            );
          })}
        </div>

        <p className="fx-markets-explain">
          {LANE_META.find((l) => l.id === lane)?.body}
          {" "}
          Private pre-IPO stays on{" "}
          <Link to="/desk/preipo">PreStocks</Link> /{" "}
          <Link to="/desk/tessera">Tessera</Link>.
        </p>

        <div className="fx-board">
          <div className="fx-board-head" aria-hidden>
            <span>Asset</span>
            <span>Lane</span>
            <span>Session</span>
            <span>Liq</span>
            <span>Mark · venues</span>
          </div>
          <ul className="fx-board-list">
            {rows.map((row) => {
              const vsRef =
                row.usdPrice != null &&
                row.stockRefPrice != null &&
                row.stockRefPrice > 0
                  ? ((row.usdPrice - row.stockRefPrice) / row.stockRefPrice) *
                    100
                  : null;
              return (
                <li key={row.symbol}>
                  <Link
                    to="/desk/acquire"
                    className="fx-board-row"
                    aria-label={`Trade ${row.symbol}`}
                  >
                    <span className="fx-board-asset">
                      <AssetLogo
                        symbol={row.symbol}
                        logo={row.logo}
                        underlying={row.underlying}
                        size={36}
                      />
                      <span>
                        <strong>{row.underlying}</strong>
                        <small>
                          {row.symbol}
                          {!row.buyable ? " · watch" : ""}
                        </small>
                      </span>
                    </span>
                    <span className={`fx-board-lane lane-${row.lane}`}>
                      {row.lane}
                    </span>
                    <span className="fx-board-session">
                      {row.openNow === true
                        ? "Open"
                        : row.openNow === false
                          ? "Closed"
                          : "—"}
                      {row.tradingPeriod ? (
                        <small>{row.tradingPeriod}</small>
                      ) : null}
                    </span>
                    <span className="fx-board-liq">
                      {row.liquidity != null ? (
                        <strong>{shortLiq(row.liquidity)}</strong>
                      ) : (
                        <small>—</small>
                      )}
                    </span>
                    <span className="fx-board-price">
                      {row.usdPrice != null ? (
                        <>
                          <strong>{money(row.usdPrice)}</strong>
                          {vsRef != null ? (
                            <small>
                              {vsRef >= 0 ? "+" : ""}
                              {vsRef.toFixed(1)}% vs cash ref
                            </small>
                          ) : null}
                        </>
                      ) : (
                        <small>{humanizeVenueNote(row.priceNote)}</small>
                      )}
                      {row.venues.length > 0 ? (
                        <span
                          className="fx-venue-strip"
                          aria-label="Venues"
                        >
                          {row.venues.map((v) => (
                            <em
                              key={v.id}
                              className={`fx-venue-pill is-${v.status}`}
                              title={v.note}
                            >
                              <span className="fx-venue-mark" aria-hidden>
                                {v.id === "jupiter"
                                  ? "J"
                                  : v.id === "free-tape"
                                    ? "G"
                                    : v.id === "raydium"
                                      ? "R"
                                      : "S"}
                              </span>
                              {v.label}
                              {v.usdPrice != null
                                ? ` ${money(v.usdPrice)}`
                                : v.liquidity != null
                                  ? ` ${shortLiq(v.liquidity)}`
                                  : v.status === "cooling"
                                    ? " · cool"
                                    : v.status === "off"
                                      ? " · off"
                                      : ""}
                            </em>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="fx-markets-extra">
          <article className="fx-markets-aside">
            <h2>Stock ↔ stock</h2>
            <p>Rotate without cashing to USDC first — pairs on Buy.</p>
            <Link to="/desk/acquire">Open pairs →</Link>
          </article>
          <article className="fx-markets-aside">
            <h2>Pre-IPO</h2>
            <p>PreStocks private names · Tessera T-tokens on their own desks.</p>
            <Link to="/desk/preipo">PreStocks →</Link>
          </article>
        </div>
      </section>
    </DeskShell>
  );
}
