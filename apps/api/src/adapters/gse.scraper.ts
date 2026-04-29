import axios from "axios";
import * as cheerio from "cheerio";
import { HistoricalData, HistoricalDataPoint } from "../types/market.types";
import { cache } from "../cache/market.cache";

const AFX_BASE = "https://afx.kwayisi.org";

const HEADERS = {
  "User-Agent": "AfricanMarkets/1.0 (data aggregator)",
  "Accept": "text/html, application/javascript",
};

export async function fetchGseHistory(symbol: string): Promise<HistoricalData> {
  const cached = cache.getGseHistory(symbol);
  if (cached) return cached;

  // Primary: chart JS endpoint — full history since IPO
  try {
    const chartUrl = `${AFX_BASE}/chart/gse/${symbol.toLowerCase()}`;
    const { data: js } = await axios.get<string>(chartUrl, {
      timeout: 10000,
      headers: HEADERS,
    });

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
  } catch {
    // fall through to HTML scrape
  }

  // Fallback: [data-hist] table — last 10 trading days only
  const pageUrl = `${AFX_BASE}/gse/${symbol.toLowerCase()}.html`;
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
    exchange: "GSE",
    currency: "GHS",
    data: points,
  };

  if (points.length > 0) cache.setGseHistory(symbol, result);
  return result;
}

/**
 * Parses Highcharts StockChart JS like:
 * data:[[d("2018-09-03"),0.75],[d("2018-09-04"),0.75],...]
 */
function parseHighchartsScript(js: string): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];

  // Extract the data array: everything between data:[ and the closing ]
  const dataMatch = js.match(/data:\[(\[d\([^\]]+\].*?)\]\}/s) ||
                    js.match(/data:\[([\s\S]+?)\]\s*\}\s*\]/);

  if (!dataMatch) return points;

  const rawPairs = dataMatch[1];

  // Match each [d("YYYY-MM-DD"),price] pair
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