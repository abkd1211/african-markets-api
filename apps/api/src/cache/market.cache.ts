import {
  MarketSnapshot,
  CompanyProfile,
  HistoricalData,
  NgxSnapshot,
} from "../types/market.types";

const SNAPSHOT_TTL = 5 * 60 * 1000;      // 5 min
const HISTORICAL_TTL = 60 * 60 * 1000;   // 1 hour
const NGX_TTL = 5 * 60 * 1000;           // 5 min

interface Entry<T> { data: T; ts: number; }

function isStale<T>(entry: Entry<T> | null, ttl: number): boolean {
  if (!entry) return true;
  return Date.now() - entry.ts > ttl;
}

// Initial empty states to prevent blocking on first run
const emptyGse: MarketSnapshot = {
  exchange: "GSE",
  status: "CLOSED",
  last_updated: new Date().toISOString(),
  tickers: []
};

const emptyNgx: NgxSnapshot = {
  exchange: "NGX",
  status: "CLOSED",
  last_updated: new Date().toISOString(),
  tickers: []
};

// GSE
let gseSnapshot: Entry<MarketSnapshot> = { data: emptyGse, ts: 0 };
const gseProfiles = new Map<string, Entry<CompanyProfile>>();
const gseHistory = new Map<string, Entry<HistoricalData>>();

// NGX
let ngxSnapshot: Entry<NgxSnapshot> = { data: emptyNgx, ts: 0 };
const ngxHistory = new Map<string, Entry<HistoricalData>>();

export const cache = {
  // GSE snapshot
  setGseSnapshot(data: MarketSnapshot) {
    gseSnapshot = { data, ts: Date.now() };
  },
  getGseSnapshot() { return gseSnapshot.data; },
  isGseSnapshotStale() { return isStale(gseSnapshot, SNAPSHOT_TTL); },

  // GSE profiles
  setProfile(symbol: string, data: CompanyProfile) {
    gseProfiles.set(symbol.toUpperCase(), { data, ts: Date.now() });
  },
  getProfile(symbol: string) {
    return gseProfiles.get(symbol.toUpperCase())?.data ?? null;
  },

  // GSE history
  setGseHistory(symbol: string, data: HistoricalData) {
    gseHistory.set(symbol.toUpperCase(), { data, ts: Date.now() });
  },
  getGseHistory(symbol: string) {
    const entry = gseHistory.get(symbol.toUpperCase());
    return isStale(entry ?? null, HISTORICAL_TTL) ? null : entry?.data ?? null;
  },

  // NGX snapshot
  setNgxSnapshot(data: NgxSnapshot) {
    ngxSnapshot = { data, ts: Date.now() };
  },
  getNgxSnapshot() { return ngxSnapshot.data; },
  isNgxSnapshotStale() { return isStale(ngxSnapshot, NGX_TTL); },

  // NGX history
  setNgxHistory(symbol: string, data: HistoricalData) {
    ngxHistory.set(symbol.toUpperCase(), { data, ts: Date.now() });
  },
  getNgxHistory(symbol: string) {
    const entry = ngxHistory.get(symbol.toUpperCase());
    return isStale(entry ?? null, HISTORICAL_TTL) ? null : entry?.data ?? null;
  },
};