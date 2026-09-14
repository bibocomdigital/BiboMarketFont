import { QueryClient, keepPreviousData } from "@tanstack/react-query";
import { queryRetryDelay, shouldRetryMutation, shouldRetryQuery } from "./query-retry";

const DEFAULT_STALE_TIME_MS = 30_000;
const DEFAULT_GC_TIME_MS = 10 * 60_000;

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        retryDelay: queryRetryDelay,
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        placeholderData: keepPreviousData,
      },
      mutations: {
        retry: shouldRetryMutation,
        retryDelay: queryRetryDelay,
      },
    },
  });
}
