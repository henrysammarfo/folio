import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { PriceMap } from "@/lib/market";
import { getPrices } from "@/lib/prices.functions";

export function usePrices() {
  const fetchPrices = useServerFn(getPrices);
  const query = useQuery<PriceMap>({
    queryKey: ["prices"],
    queryFn: () => fetchPrices(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  return { prices: query.data ?? {}, isLoading: query.isLoading, isError: query.isError, updatedAt: query.dataUpdatedAt };
}
