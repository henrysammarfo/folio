/**
 * Overview partner lanes — PreStocks (SPV) + Tessera (loan participation).
 * Keeps separate desk URLs for Stocklana bounty judges; overview links in.
 * Logos + skeleton loaders — never bare "Loading…" (Henry desk doctrine).
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AssetLogo } from "@/components/asset-logo";
import { getPreipoBundle, getTesseraBundle } from "@/lib/desk.functions";
import { trackFolioEvent } from "@/lib/analytics";
import { humanizeWashNote } from "@/lib/humanize-copy";

export type PartnerLaneId = "stocks" | "preipo" | "tessera";

const LANES: { id: PartnerLaneId; label: string }[] = [
  { id: "stocks", label: "Stocks" },
  { id: "preipo", label: "PreStocks" },
  { id: "tessera", label: "Tessera" },
];

export function PartnerLaneTabs({
  lane,
  onChange,
}: {
  lane: PartnerLaneId;
  onChange: (id: PartnerLaneId) => void;
}) {
  return (
    <div
      className="netro-partner-tabs"
      role="tablist"
      aria-label="Market partner lane"
      data-testid="partner-lane-tabs"
    >
      {LANES.map((l) => (
        <button
          key={l.id}
          type="button"
          role="tab"
          aria-selected={lane === l.id}
          className={`netro-partner-tab${lane === l.id ? " is-on" : ""}`}
          onClick={() => {
            trackFolioEvent("partner_lane", { lane: l.id });
            onChange(l.id);
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function PartnerLanePanel({ lane }: { lane: PartnerLaneId }) {
  if (lane === "stocks") return null;
  if (lane === "preipo") return <PreipoLanePanel />;
  return <TesseraLanePanel />;
}

function money(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  });
}

function PartnerSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="netro-partner-list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="netro-partner-skel">
          <span className="netro-skel-face" />
          <span className="netro-skel-lines">
            <i />
            <i />
          </span>
          <span className="netro-skel-chip" />
        </li>
      ))}
    </ul>
  );
}

function PreipoLanePanel() {
  const fetchPreipo = useServerFn(getPreipoBundle);
  const { data, isFetching, isPending } = useQuery({
    queryKey: ["partner-lane", "preipo"],
    queryFn: () => fetchPreipo({ data: { spendUsdc: 1 } }),
    staleTime: 30_000,
  });

  const rows = data?.catalog.ok ? data.catalog.data.rows.slice(0, 6) : [];
  const selected = data?.selected;
  const premium =
    selected?.tokenPrice != null &&
    selected?.markPrice != null &&
    selected.markPrice > 0
      ? ((selected.tokenPrice - selected.markPrice) / selected.markPrice) * 100
      : null;
  const loading = isPending || (isFetching && !data?.catalog.ok);

  return (
    <section
      className="netro-partner-panel"
      data-testid="partner-lane-preipo"
      aria-label="PreStocks"
    >
      <header className="netro-partner-head">
        <div>
          <strong>PreStocks</strong>
          <p>Private company names. Live quotes, not public share equity.</p>
        </div>
        <Link to="/desk/preipo" className="fx-btn fx-btn-dark fx-btn-sm">
          Open PreStocks
        </Link>
      </header>

      <div className="netro-partner-truth" aria-label="PreStocks truth">
        <div>
          <span>Token</span>
          <b>
            {selected?.tokenPrice != null
              ? money(selected.tokenPrice)
              : loading
                ? "…"
                : "—"}
          </b>
        </div>
        <div>
          <span>Mark</span>
          <b>
            {selected?.markPrice != null ? money(selected.markPrice) : "—"}
          </b>
        </div>
        <div>
          <span>Premium</span>
          <b>
            {premium != null
              ? `${premium >= 0 ? "+" : ""}${premium.toFixed(1)}%`
              : "—"}
          </b>
        </div>
        <div>
          <span>Wash</span>
          <b>{data ? (data.washOk ? "Clear" : "Paused") : "…"}</b>
        </div>
        <div>
          <span>$1 quote</span>
          <b>
            {data?.jupiter.ok
              ? `${data.jupiter.data.outUiAmount.toFixed(4)} tok`
              : loading
                ? "…"
                : "—"}
          </b>
        </div>
      </div>

      {loading ? (
        <PartnerSkeleton />
      ) : !data?.catalog.ok ? (
        <p className="fx-sub">
          {data?.catalog && !data.catalog.ok
            ? humanizeWashNote(data.catalog.reason)
            : "Catalog unavailable"}
        </p>
      ) : (
        <ul className="netro-partner-list">
          {rows.map((row) => {
            const prem =
              row.tokenPrice != null &&
              row.markPrice != null &&
              row.markPrice > 0
                ? ((row.tokenPrice - row.markPrice) / row.markPrice) * 100
                : null;
            return (
              <li key={row.mint}>
                <Link to="/desk/preipo" className="netro-partner-row">
                  <AssetLogo
                    symbol={row.symbol}
                    logo={row.image}
                    underlying={row.symbol}
                    size={40}
                  />
                  <span className="netro-partner-copy">
                    <strong>{row.symbol}</strong>
                    <small>{row.name}</small>
                  </span>
                  <em>
                    {prem != null
                      ? `${prem >= 0 ? "+" : ""}${prem.toFixed(0)}%`
                      : row.tokenPrice != null
                        ? money(row.tokenPrice, 0)
                        : "—"}
                  </em>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="netro-partner-foot">
        Stocklana PreStocks track ·{" "}
        {data?.washNote ? humanizeWashNote(data.washNote) : "wash gated"}
      </p>
    </section>
  );
}

function TesseraLanePanel() {
  const fetchTessera = useServerFn(getTesseraBundle);
  const { data, isFetching, isPending } = useQuery({
    queryKey: ["partner-lane", "tessera"],
    queryFn: () => fetchTessera({ data: { spendUsdc: 1 } }),
    staleTime: 30_000,
  });

  const rows = data?.catalog.ok ? data.catalog.data.rows.slice(0, 6) : [];
  const selected = data?.selected;
  const loading = isPending || (isFetching && !data?.catalog.ok);

  return (
    <section
      className="netro-partner-panel"
      data-testid="partner-lane-tessera"
      aria-label="Tessera T-tokens"
    >
      <header className="netro-partner-head">
        <div>
          <strong>Tessera T-tokens</strong>
          <p>Loan participation for SpaceX, OpenAI, Kalshi. Buys stay in FOLIO.</p>
        </div>
        <Link to="/desk/tessera" className="fx-btn fx-btn-dark fx-btn-sm">
          Open Tessera
        </Link>
      </header>

      <div className="netro-partner-truth" aria-label="Tessera truth">
        <div>
          <span>Structure</span>
          <b>Loan participation</b>
        </div>
        <div>
          <span>Mark</span>
          <b>
            {selected?.markPrice != null
              ? money(selected.markPrice)
              : loading
                ? "…"
                : "—"}
          </b>
        </div>
        <div>
          <span>Holders</span>
          <b>{selected?.holders != null ? selected.holders : "—"}</b>
        </div>
        <div>
          <span>Wash</span>
          <b>{data ? (data.washOk ? "Clear" : "Paused") : "…"}</b>
        </div>
        <div>
          <span>$1 quote</span>
          <b>
            {data?.jupiter.ok
              ? `${data.jupiter.data.outUiAmount.toFixed(4)} T`
              : loading
                ? "…"
                : "—"}
          </b>
        </div>
      </div>

      {loading ? (
        <PartnerSkeleton />
      ) : !data?.catalog.ok ? (
        <p className="fx-sub">
          {data?.catalog && !data.catalog.ok
            ? humanizeWashNote(data.catalog.reason)
            : "Catalog unavailable"}
        </p>
      ) : (
        <ul className="netro-partner-list">
          {rows.map((row) => (
            <li key={row.mint}>
              <Link to="/desk/tessera" className="netro-partner-row">
                <AssetLogo symbol={row.symbol} size={40} />
                <span className="netro-partner-copy">
                  <strong>{row.symbol}</strong>
                  <small>{row.sector ?? row.name}</small>
                </span>
                <em>
                  {row.markPrice != null ? money(row.markPrice, 0) : "—"}
                </em>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="netro-partner-foot">
        Stocklana Tessera track ·{" "}
        {data?.washNote ? humanizeWashNote(data.washNote) : "wash gated"}
      </p>
    </section>
  );
}
