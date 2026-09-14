"use client";

import Fetcher from "@/infrastructure/api/fetcher";

let sharedFetcher: Fetcher | null = null;

export function getClientFetcher(): Fetcher {
  if (!sharedFetcher) {
    sharedFetcher = new Fetcher();
  }
  return sharedFetcher;
}
