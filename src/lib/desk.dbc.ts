/**
 * Meteora launches desk bundle — consumer list + trade deep-links.
 */

import { createServerFn } from "@tanstack/react-start";
import {
  fetchMeteoraDbcAwareness,
  METEORA_APP_URL,
  METEORA_DBC_DOCS_URL,
  type MeteoraDbcSnapshot,
} from "./adapters/meteora-dbc";
import type { AdapterResult } from "./adapters/types";

export type MeteoraDbcBundle = {
  dbc: AdapterResult<MeteoraDbcSnapshot>;
  docsUrl: string;
  appUrl: string;
  note: string;
};

export const getMeteoraDbcBundle = createServerFn({ method: "GET" }).handler(
  async (): Promise<MeteoraDbcBundle> => {
    const dbc = await fetchMeteoraDbcAwareness({ pageSize: 8 });
    return {
      dbc,
      docsUrl: METEORA_DBC_DOCS_URL,
      appUrl: dbc.ok ? dbc.data.appUrl : METEORA_APP_URL,
      note: dbc.ok
        ? "Fresh pools · trade with your wallet on Meteora"
        : "Launches offline · try again shortly",
    };
  },
);
