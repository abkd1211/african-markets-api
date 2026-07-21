import * as cheerio from "cheerio";
import { HistoricalData, HistoricalDataPoint } from "../types/market.types";
import { cache } from "../cache/market.cache";
import { fetchUrlWithScraperFallback } from "./scraper.client";

const AF_BASE = "https://afx.kwayisi.org";



export async function fetchGseHistory(symbol: string): Promise<HistoricalData> {
  const cached = cache.getGseHistory(symbol);
  if (cached) return cached;

  // Primary: chart JS endpoint or embedded JS for index
  try {
    const slug = symbol.toLowerCase() === "gse-ci" ? "" : symbol.toLowerCase();
    const chartUrl = `${AF_BASE}/chart/gse${slug ? "/" + slug : ""}`;
    
    const response = await fetchUrlWithScraperFallback(chartUrl, "text");
    const js = String(response.body);

    const points = parseHighchartsScript(js);
    if (points.length > 0) {
      const result: HistoricalData = {
        symbol: symbol.toUpperCase(),
        exchange: "GSE",
        currency: "GHS",
        data: points,
      };
      cache.setGseHistory(symbol, result);
      return result;
    }
  } catch (err) {
    console.error(`[GSE] History fetch failed for ${symbol}:`, err instanceof Error ? err.message : String(err));
    const cached = cache.getGseHistory(symbol);
    if (cached) {
      console.log(`[GSE] Returning stale cache for ${symbol}`);
      return cached;
    }
  }

  // Fallback: scrape data-hist table
  try {
    const pageUrl = `${AF_BASE}/gse/${symbol.toLowerCase()}.html`;
    const response = await fetchUrlWithScraperFallback(pageUrl, "text");
    const html = String(response.body);

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
        exchange: "GSE",
        currency: "GHS",
        data: points.sort((a, b) => a.date.localeCompare(b.date)),
      };
      cache.setGseHistory(symbol, result);
      return result;
    }
  } catch (err) {
    console.error(`[GSE] HTML fallback failed for ${symbol}:`, err instanceof Error ? err.message : String(err));
    const cached = cache.getGseHistory(symbol);
    if (cached) return cached;
  }

  throw new Error(`No data found for GSE symbol: ${symbol}`);
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

    points.push({
      date,
      open: null,
      high: null,
      low: null,
      close,
      volume: null,
    });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}