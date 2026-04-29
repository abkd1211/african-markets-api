export interface Ticker {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  currency: string;
}

export interface CompanyProfile {
  symbol: string;
  exchange: string;
  price: number;
  market_cap: number | null;
  eps: number | null;
  dps: number | null;
  shares_outstanding: number | null;
  company: {
    full_name: string;
    sector: string | null;
    industry: string | null;
    website: string | null;
  };
}

export interface MarketSnapshot {
  exchange: string;
  status: "OPEN" | "CLOSED";
  last_updated: string;
  tickers: Ticker[];
}

export interface TopMovers {
  exchange: string;
  last_updated: string;
  gainers: Ticker[];
  losers: Ticker[];
}

export interface HistoricalDataPoint {
  date: string;        // ISO date string "2026-01-15"
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

export interface HistoricalData {
  symbol: string;
  exchange: "GSE" | "NGX";
  currency: string;
  data: HistoricalDataPoint[];
}

export interface NgxTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  currency: "NGN";
}

export interface NgxSnapshot {
  exchange: "NGX";
  status: "OPEN" | "CLOSED";
  last_updated: string;
  tickers: NgxTicker[];
}

export interface NgxSummary {
  exchange: "NGX";
  status: "OPEN" | "CLOSED";
  last_updated: string;
  total_listed: number;
  active_tickers: number;
  gainers: number;
  losers: number;
  unchanged: number;
  total_volume: number;
  all_share_index: number | null;
  index_change_pct: number | null;
}