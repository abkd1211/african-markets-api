const gotScrapingPromise = new Function("return import('got-scraping')")().then((m: any) => m.gotScraping);
import * as cheerio from "cheerio";
import {
  NgxSnapshot,
  NgxTicker,
  HistoricalData,
  HistoricalDataPoint,
} from "../types/market.types";
import { cache } from "../cache/market.cache";

const AF_BASE = "https://afx.kwayisi.org";

function buildProxyUrl(targetUrl: string): string {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) {
    throw new Error("SCRAPER_API_KEY is not defined in environment variables");
  }
  return `http://api.scraperapi.com/?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
}



export function isNgxOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  return day >= 1 && day <= 5 && mins >= 510 && mins < 810;
}

export async function fetchNgxSnapshot(): Promise<NgxSnapshot> {
  const cached = cache.getNgxSnapshot();
  if (cached && !cache.isNgxSnapshotStale()) return cached;

  console.log("[NGX] Starting fetch...");
  try {
    const gotScraping = await gotScrapingPromise;
    const page1 = await gotScraping.get(buildProxyUrl(`${AF_BASE}/ngx/`), { timeout: { request: 60000 } });
    await new Promise(r => setTimeout(r, 1500)); 
    const page2 = await gotScraping.get(buildProxyUrl(`${AF_BASE}/ngx/?page=2`), { timeout: { request: 60000 } });

    const html = page1.body + page2.body;
    const $ = cheerio.load(html);
    const tickers: NgxTicker[] = [];

    $("div.t table tbody tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 4) return;

      const symbol = $(cells[0]).find("a").text().trim();
      const name = $(cells[1]).find("a").text().trim();
      const volumeText = $(cells[2]).text().trim().replace(/,/g, "");
      const priceText = $(cells[3]).text().trim().replace(/,/g, "");
      const changeText = $(cells[4])?.text().trim().replace(/,/g, "") ?? "0";

      if (!symbol) return;
      const price = parseFloat(priceText);
      if (isNaN(price)) return;

      const change = parseFloat(changeText.replace("+", "")) || 0;
      const prevPrice = price - change;
      const change_pct = prevPrice > 0 ? parseFloat(((change / prevPrice) * 100).toFixed(2)) : 0;

      tickers.push({
        symbol,
        name: name || symbol,
        price,
        change,
        change_pct,
        volume: parseInt(volumeText, 10) || 0,
        currency: "NGN",
      });
    });

    const snapshot: NgxSnapshot = {
      exchange: "NGX",
      status: isNgxOpen() ? "OPEN" : "CLOSED",
      last_updated: new Date().toISOString(),
      tickers,
    };

    if (tickers.length > 0) {
      cache.setNgxSnapshot(snapshot);
      return snapshot;
    }
  } catch (err) {
    console.error("[NGX] Fetch failed:", err instanceof Error ? err.message : String(err));
    const cached = cache.getNgxSnapshot();
    if (cached) return cached;
  }
  throw new Error("Failed to fetch NGX snapshot and no cache available");
}

export async function fetchNgxHistory(symbol: string): Promise<HistoricalData> {
  const cached = cache.getNgxHistory(symbol);
  if (cached) return cached;

  try {
    const gotScraping = await gotScrapingPromise;
    const slug = symbol.toLowerCase() === "asi" ? "" : symbol.toLowerCase();
    const chartUrl = `${AF_BASE}/chart/ngx${slug ? "/" + slug : ""}`;
    
    const response = await gotScraping.get(buildProxyUrl(chartUrl), { timeout: { request: 60000 } });
    const js = response.body;

    const points = parseHighchartsScript(js);
    if (points.length > 0) {
      const result: HistoricalData = {
        symbol: symbol.toUpperCase(),
        exchange: "NGX",
        currency: "NGN",
        data: points,
      };
      cache.setNgxHistory(symbol, result);
      return result;
    }
  } catch (err) {
    console.error(`[NGX] History fetch failed for ${symbol}:`, err instanceof Error ? err.message : String(err));
    const cached = cache.getNgxHistory(symbol);
    if (cached) return cached;
  }

  try {
    const gotScraping = await gotScrapingPromise;
    const pageUrl = `${AF_BASE}/ngx/${symbol.toLowerCase()}.html`;
    const response = await gotScraping.get(buildProxyUrl(pageUrl), { timeout: { request: 60000 } });
    const html = response.body;

    const $ = cheerio.load(html);
    const points: HistoricalDataPoint[] = [];

    $("table[data-hist] tbody tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;

      const dateText = $(cells[0]).text().trim();
      const volumeText = $(cells[1]).text().trim().replace(/,/g, "");
      const closeText = $(cells[2]).text().trim();

      const close = parseFloat(closeText);
      if (!dateText || isNaN(close)) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return;

      points.push({
        date: dateText,
        open: null,
        high: null,
        low: null,
        close,
        volume: parseInt(volumeText, 10) || null,
      });
    });

    if (points.length > 0) {
      const result: HistoricalData = {
        symbol: symbol.toUpperCase(),
        exchange: "NGX",
        currency: "NGN",
        data: points.sort((a, b) => a.date.localeCompare(b.date)),
      };
      cache.setNgxHistory(symbol, result);
      return result;
    }
  } catch (err) {
    console.error(`[NGX] HTML fallback failed for ${symbol}:`, err instanceof Error ? err.message : String(err));
    const cached = cache.getNgxHistory(symbol);
    if (cached) return cached;
  }

  throw new Error(`No data found for NGX symbol: ${symbol}`);
}

function parseHighchartsScript(js: string): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];
  const dataMatch = js.match(/data:\[(\[d\([^\]]+\].*?)\]\}/s) ||
                    js.match(/data:\[([\s\S]+?)\]\s*\}\s*\]/);

  if (!dataMatch) return points;

  const rawPairs = dataMatch[1];
  const pairRegex = /\[d\("(\d{4}-\d{2}-\d{2})"\)\s*,\s*([\d.]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = pairRegex.exec(rawPairs)) !== null) {
    const date = match[1];
    const close = parseFloat(match[2]);
    if (!date || isNaN(close)) continue;
    points.push({ date, open: null, high: null, low: null, close, volume: null });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}