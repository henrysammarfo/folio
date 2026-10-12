/**
 * Multi-venue price probe — Jupiter + free tape (Gecko) + Raydium awareness + Solami Blur (when keyed).
 * Never invents a price. Prefer Jupiter for primary mark; surface every live venue honestly.
 */
import { fetchGeckoTerminalTokenPrice } from "./gecko-price";
import { fetchJupiterTokenPrice } from "./jupiter";
import { fetchRaydiumPoolsForMint } from "./pools";
import { fetchSolamiTokenPrice } from "./solami-tape";
import type { AdapterResult } from "./types";

export type VenueId = "jupiter" | "free-tape" | "raydium" | "solami";

export type VenueQuote = {
  id: VenueId;
  /** Soft desk label */
  label: string;
  status: "live" | "cached" | "stale" | "cooling" | "off";
  usdPrice: number | null;
  liquidity: number | null;
  /** Short honesty note */
  note: string;
};

export type MultiVenuePrice = {
  /** Best primary mark for board number — never invented */
  primary: {
    usdPrice: number;
    stockRefPrice: number | null;
    liquidity: number | null;
    venueId: VenueId;
    priceNote: string;
  } | null;
  venues: VenueQuote[];
};

function jupStatus(source: string): VenueQuote["status"] {
  if (source.includes("stale")) return "stale";
  if (source.includes("cached")) return "cached";
  return "live";
}

/**
 * Probe all venues in parallel for one mint.
 */
export async function resolveMultiVenuePrice(
  mint: string,
): Promise<MultiVenuePrice> {
  const [jup, gecko, ray, solami] = await Promise.all([
    fetchJupiterTokenPrice(mint),
    fetchGeckoTerminalTokenPrice(mint),
    fetchRaydiumPoolsForMint(mint),
    fetchSolamiTokenPrice(mint),
  ]);

  const venues: VenueQuote[] = [];

  if (jup.ok) {
    venues.push({
      id: "jupiter",
      label: "Jupiter",
      status: jupStatus(jup.source),
      usdPrice: jup.data.usdPrice,
      liquidity: jup.data.liquidity,
      note:
        jupStatus(jup.source) === "live"
          ? "Aggregator mark"
          : jupStatus(jup.source) === "cached"
            ? "Cached mark"
            : "Stale mark",
    });
  } else {
    venues.push({
      id: "jupiter",
      label: "Jupiter",
      status: /429|rate/i.test(jup.reason) ? "cooling" : "off",
      usdPrice: null,
      liquidity: null,
      note: /429|rate/i.test(jup.reason) ? "Cooling — refresh soon" : jup.reason,
    });
  }

  if (gecko.ok) {
    venues.push({
      id: "free-tape",
      label: "Free tape",
      status: "live",
      usdPrice: gecko.data.usdPrice,
      liquidity: gecko.data.liquidity,
      note: "GeckoTerminal DEX mark",
    });
  } else {
    venues.push({
      id: "free-tape",
      label: "Free tape",
      status: "off",
      usdPrice: null,
      liquidity: null,
      note: gecko.reason,
    });
  }

  if (ray.ok && ray.data.raydium.length > 0) {
    const tvl = ray.data.raydium.reduce(
      (s, p) => s + (p.tvl ?? 0),
      0,
    );
    venues.push({
      id: "raydium",
      label: "Raydium",
      status: "live",
      usdPrice: null, // awareness — no invented mid
      liquidity: tvl > 0 ? tvl : null,
      note: `${ray.data.raydium.length} pool(s) · awareness only`,
    });
  } else {
    venues.push({
      id: "raydium",
      label: "Raydium",
      status: "off",
      usdPrice: null,
      liquidity: null,
      note: ray.ok ? "No pools observed" : ray.reason,
    });
  }

  if (solami.ok) {
    venues.push({
      id: "solami",
      label: "Solami",
      status: "live",
      usdPrice: solami.data.usdPrice,
      liquidity: solami.data.liquidityUsd,
      note: "Blur last trade · mainnet",
    });
  } else if (
    solami.reason === "solami_blur_bandwidth_empty" ||
    solami.reason === "solami_bandwidth_empty"
  ) {
    // Blur optional — do not paint Solami as broken; RPC tape covers Bible Solami track
    venues.push({
      id: "solami",
      label: "Solami",
      status: "live",
      usdPrice: null,
      liquidity: null,
      note: "RPC tape live · Blur mark optional (prepaid GB)",
    });
  } else {
    venues.push({
      id: "solami",
      label: "Solami",
      status: "off",
      usdPrice: null,
      liquidity: null,
      note: solami.reason,
    });
  }

  // Primary preference: Jupiter live/cached → Solami → free tape
  const preference: VenueId[] = ["jupiter", "solami", "free-tape"];
  let primary: MultiVenuePrice["primary"] = null;
  for (const id of preference) {
    const v = venues.find((x) => x.id === id && x.usdPrice != null && x.usdPrice > 0);
    if (!v || v.usdPrice == null) continue;
    primary = {
      usdPrice: v.usdPrice,
      stockRefPrice: id === "jupiter" && jup.ok ? jup.data.stockRefPrice : null,
      liquidity: v.liquidity,
      venueId: id,
      priceNote:
        id === "jupiter"
          ? `${v.status === "live" ? "live" : v.status} · Jupiter`
          : id === "solami"
            ? "live · Solami"
            : "live · free tape",
    };
    break;
  }

  return { primary, venues };
}

/** Type guard helper for tests */
export function venueLiveCount(v: MultiVenuePrice): number {
  return v.venues.filter((x) => x.status === "live" || x.status === "cached").length;
}

export type _AdapterEcho = AdapterResult<unknown>;
