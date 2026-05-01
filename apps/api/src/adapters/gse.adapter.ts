import axios from "axios";
import { MarketSnapshot, Ticker, CompanyProfile } from "../types/market.types";
import { cache } from "../cache/market.cache";

const BASE = process.env.GSE_API_BASE || "https://dev.kwayisi.org/apis/gse";

// GSE trading hours: 10:00–15:00 GMT, weekdays only
function isGseOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  const timeInMinutes = hour * 60 + minute;
  const open = 10 * 60;   // 10:00 GMT
  const close = 15 * 60;  // 15:00 GMT
  return day >= 1 && day <= 5 && timeInMinutes >= open && timeInMinutes < close;
}

interface KwayisiLiveTicker {
  name: string;
  price: number;
  change: number;
  volume: number;
}

export async function fetchGseSnapshot(): Promise<MarketSnapshot> {
  console.log("[GSE] Starting fetch...");
  try {
    const { data } = await axios.get<KwayisiLiveTicker[]>(`${BASE}/live`, {
      timeout: 20000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    console.log(`[GSE] Fetched ${data.length} tickers`);
    
    const tickers: Ticker[] = data.map((t) => ({
      symbol: t.name,
      price: t.price,
      change: t.change,
      change_pct: t.price > 0 ? parseFloat(((t.change / (t.price - t.change)) * 100).toFixed(2)) : 0,
      volume: t.volume,
      currency: "GHS",
    }));

    const snapshot: MarketSnapshot = {
      exchange: "GSE",
      status: isGseOpen() ? "OPEN" : "CLOSED",
      last_updated: new Date().toISOString(),
      tickers,
    };

    cache.setGseSnapshot(snapshot);
    console.log(`[GSE] Cached snapshot with ${tickers.length} tickers`);
    return snapshot;
  } catch (err) {
    console.error("[GSE] Fetch failed:", err instanceof Error ? err.message : String(err));
    throw err;
  }
}

interface KwayisiEquity {
  name: string;
  price: number;
  capital?: number;
  dps?: number;
  eps?: number;
  shares?: number;
  company: {
    name: string;
    sector?: string;
    industry?: string;
    website?: string;
  };
}

export async function fetchGseProfile(symbol: string): Promise<CompanyProfile> {
  const cached = cache.getProfile(symbol);
  if (cached) return cached;

  const { data } = await axios.get<KwayisiEquity>(
    `${BASE}/equities/${symbol.toLowerCase()}`,
    { timeout: 30000 }
  );

  const profile: CompanyProfile = {
    symbol: data.name,
    exchange: "GSE",
    price: data.price,
    market_cap: data.capital ?? null,
    eps: data.eps ?? null,
    dps: data.dps ?? null,
    shares_outstanding: data.shares ?? null,
    company: {
      full_name: data.company.name,
      sector: data.company.sector ?? null,
      industry: data.company.industry ?? null,
      website: data.company.website ?? null,
    },
  };

  cache.setProfile(symbol, profile);
  return profile;
}