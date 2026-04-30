const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.json();
}

export const api = {
  gse: {
    live:    () => fetcher<import("@/types/market").MarketSnapshot>("/api/v1/markets/gse/live"),
    summary: () => fetcher<import("@/types/market").MarketSummary>("/api/v1/markets/gse/summary"),
    movers:  (limit = 5) => fetcher<import("@/types/market").TopMovers>(`/api/v1/markets/gse/movers?limit=${limit}`),
    ticker:  (s: string) => fetcher<import("@/types/market").CompanyProfile>(`/api/v1/markets/gse/ticker/${s}`),
    history: (s: string, range = "1Y") => fetcher<import("@/types/market").HistoricalData>(`/api/v1/history/gse/${s}?range=${range}`),
  },
  ngx: {
    live:    () => fetcher<import("@/types/market").NgxSnapshot>("/api/v1/markets/ngx/live"),
    summary: () => fetcher<import("@/types/market").NgxSummary>("/api/v1/markets/ngx/summary"),
    movers:  (limit = 5) => fetcher<import("@/types/market").TopMovers>("/api/v1/markets/ngx/movers?limit=" + limit),
    history: (s: string, range = "1Y") => fetcher<import("@/types/market").HistoricalData>(`/api/v1/history/ngx/${s}?range=${range}`),
  },
};