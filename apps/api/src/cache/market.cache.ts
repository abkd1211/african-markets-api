import { MarketSnapshot, CompanyProfile } from "../types/market.types";

interface CacheStore {
  snapshot: MarketSnapshot | null;
  profiles: Map<string, CompanyProfile>;
  snapshotAge: number;
}

const store: CacheStore = {
  snapshot: null,
  profiles: new Map(),
  snapshotAge: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const cache = {
  setSnapshot(data: MarketSnapshot) {
    store.snapshot = data;
    store.snapshotAge = Date.now();
  },
  getSnapshot(): MarketSnapshot | null {
    return store.snapshot;
  },
  isStale(): boolean {
    return Date.now() - store.snapshotAge > CACHE_TTL_MS;
  },
  setProfile(symbol: string, data: CompanyProfile) {
    store.profiles.set(symbol.toUpperCase(), data);
  },
  getProfile(symbol: string): CompanyProfile | undefined {
    return store.profiles.get(symbol.toUpperCase());
  },
};