export interface Ticker {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  currency: string;
}

export interface MarketSnapshot {
  exchange: string;
  status: "OPEN" | "CLOSED";
  last_updated: string;
  tickers: Ticker[];
}

export interface MarketSummary {
  exchange: string;
  status: "OPEN" | "CLOSED";
  last_updated: string;
  total_listed: number;
  active_tickers: number;
  gainers: number;
  losers: number;
  unchanged: number;
  total_volume: number;
}

export interface TopMovers {
  exchange: string;
  last_updated: string;
  gainers: Ticker[];
  losers: Ticker[];
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