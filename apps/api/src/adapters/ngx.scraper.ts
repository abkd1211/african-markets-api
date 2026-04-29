import axios from "axios";
import * as cheerio from "cheerio";
import {
  NgxSnapshot,
  NgxTicker,
  HistoricalData,
  HistoricalDataPoint,
} from "../types/market.types";
import { cache } from "../cache/market.cache";

const AFX_BASE = "https://afx.kwayisi.org";

const HEADERS = {
  "User-Agent": "AfricanMarkets/1.0 (data aggregator)",
  "Accept": "text/html",
};

// NGX: 09:30–14:30 WAT = 08:30–13:30 UTC
function isNgxOpen(): boolean {
  const now = new Date();
  const day = now.getUTCDay();
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  return day >= 1 && day <= 5 && mins >= 510 && mins < 810;
}

export async function fetchNgxSnapshot(): Promise<NgxSnapshot> {
  const cached = cache.getNgxSnapshot();
  if (cached && !cache.isNgxSnapshotStale()) return cached;

  const { data: html } = await axios.get<string>(`${AFX_BASE}/ngx/`, {
    timeout: 15000,
    headers: HEADERS,
  });

  const $ = cheerio.load(html);
  const tickers: NgxTicker[] = [];

  // The main ticker table is inside div.t > table
  // Columns: Ticker | Name | Volume | Price | Change
  // Rows with class="ss" are suspended — still include them, just no volume/change
  $("div.t table tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 4) return;

    // Symbol is in an <a> tag inside first td
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
    const change_pct = prevPrice > 0
      ? parseFloat(((change / prevPrice) * 100).toFixed(2))
      : 0;

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

  // Parse ASI from the index summary table (first table, class=c)
  let asi: number | null = null;
  let asiChangePct: number | null = null;

  $("table.c tbody tr td").first().each((_, el) => {
    const text = $(el).text().trim().replace(/,/g, "");
    const match = text.match(/([\d.]+)/);
    if (match) asi = parseFloat(match[1]);
  });

  const snapshot: NgxSnapshot = {
    exchange: "NGX",
    status: isNgxOpen() ? "OPEN" : "CLOSED",
    last_updated: new Date().toISOString(),
    tickers,
  };

  if (tickers.length > 0) cache.setNgxSnapshot(snapshot);
  return snapshot;
}

export async function fetchNgxSummary() {
  const snapshot = await fetchNgxSnapshot();
  const gainers = snapshot.tickers.filter(t => t.change > 0).length;
  const losers = snapshot.tickers.filter(t => t.change < 0).length;
  const active = snapshot.tickers.filter(t => t.volume > 0).length;
  const totalVolume = snapshot.tickers.reduce((s, t) => s + t.volume, 0);

  return {
    exchange: "NGX",
    status: snapshot.status,
    last_updated: snapshot.last_updated,
    total_listed: snapshot.tickers.length,
    active_tickers: active,
    gainers,
    losers,
    unchanged: snapshot.tickers.length - gainers - losers,
    total_volume: totalVolume,
    all_share_index: null,
    index_change_pct: null,
  };
}

export async function fetchNgxHistory(symbol: string): Promise<HistoricalData> {
  const cached = cache.getNgxHistory(symbol);
  if (cached) return cached;

  // Try chart JSON endpoint first
  try {
    const chartUrl = `${AFX_BASE}/chart/ngx/${symbol.toLowerCase()}`;
    const { data } = await axios.get(chartUrl, {
      timeout: 10000,
      headers: { ...HEADERS, Accept: "application/json, text/html" },
    });

    const points = parseHighchartsScript(data);
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
  } catch {
    // fall through
  }

  // Fallback: scrape data-hist table from ticker page
  // NGX ticker URLs use .html extension: /ngx/mtnn.html
  const pageUrl = `${AFX_BASE}/ngx/${symbol.toLowerCase()}.html`;
  const { data: html } = await axios.get<string>(pageUrl, {
    timeout: 15000,
    headers: HEADERS,
  });

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

  points.sort((a, b) => a.date.localeCompare(b.date));

  const result: HistoricalData = {
    symbol: symbol.toUpperCase(),
    exchange: "NGX",
    currency: "NGN",
    data: points,
  };

  if (points.length > 0) cache.setNgxHistory(symbol, result);
  return result;
}

function parseHighchartsScript(js: string): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];

  const dataMatch = js.match(/data:\[(\[d\([^\]]+\].*?)\]\}/s) ||
                    js.match(/data:\[([\s\S]+?)\]\s*\}\s*\]/);

  if (!dataMatch) return points;

  const pairRegex = /\[d\("(\d{4}-\d{2}-\d{2})"\)\s*,\s*([\d.]+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = pairRegex.exec(dataMatch[1])) !== null) {
    const date = match[1];
    const close = parseFloat(match[2]);
    if (!date || isNaN(close)) continue;
    points.push({ date, open: null, high: null, low: null, close, volume: null });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}