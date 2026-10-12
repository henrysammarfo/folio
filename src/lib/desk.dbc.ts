/**
 * Meteora DBC desk bundle — separate lane from xStock truth spine.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  fetchMeteoraDbcAwareness,
  METEORA_DBC_DOCS_URL,
  type MeteoraDbcSnapshot,
} from "./adapters/meteora-dbc";
import type { AdapterResult } from "./adapters/types";

export type MeteoraDbcBundle = {
  dbc: AdapterResult<MeteoraDbcSnapshot>;
  docsUrl: string;
  note: string;
};

export const getMeteoraDbcBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<MeteoraDbcBundle> => {
    const dbc = await fetchMeteoraDbcAwareness({ pageSize: 8 });
    return {
      dbc,
      docsUrl: METEORA_DBC_DOCS_URL,
      note: dbc.ok
        ? "Separate Meteora DBC lane · not xStock economic truth · FOLIO does not launch or swap DBC CPI here"
        : "Meteora DBC awareness unavailable · fail-closed",
    };
  },
);
