const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  gse: {
    live:    () => fetcher<import("@/types/market").MarketSnapshot>("/api/v1/markets/gse/live"),
    summary: () => fetcher<import("@/types/market").MarketSummary>("/api/v1/markets/gse/summary"),
    movers:  () => fetcher<import("@/types/market").TopMovers>("/api/v1/markets/gse/movers?limit=5"),
    ticker:  (s: string) => fetcher<import("@/types/market").CompanyProfile>(`/api/v1/markets/gse/ticker/${s}`),
  },
};