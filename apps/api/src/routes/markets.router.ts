import { Router, Request, Response } from "express";
import { fetchGseSnapshot, fetchGseProfile } from "../adapters/gse.adapter";
import { cache } from "../cache/market.cache";
import { Ticker, MarketSnapshot } from "../types/market.types";

const router = Router();

// Deduplicate parallel fetches to Kwayisi
let gseFetchPromise: Promise<void> | null = null;

async function getGseSnapshot(): Promise<MarketSnapshot> {
  const cached = cache.getGseSnapshot();
  const isStale = cache.isGseSnapshotStale();

  // If stale (includes ts=0 on startup), trigger background refresh
  if (isStale && !gseFetchPromise) {
    gseFetchPromise = (async () => {
      try {
        await fetchGseSnapshot();
      } catch (err) {
        console.error("[GSE] Background refresh failed:", err instanceof Error ? err.message : String(err));
        throw err;
      }
    })().finally(() => { gseFetchPromise = null; });
  }

  // If cache is empty and we are fetching, wait for it to finish
  if (cached.tickers.length === 0 && gseFetchPromise) {
    await gseFetchPromise;
    return cache.getGseSnapshot();
  }

  return cached;
}

// GET /api/v1/markets/gse/live
router.get("/live", async (req: Request, res: Response) => {
  try {
    const snapshot = await getGseSnapshot();
    res.json(snapshot);
  } catch (err) {
    res.status(200).json({ error: "Failed to fetch GSE data", detail: String(err), message: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
  }
});

// GET /api/v1/markets/gse/ticker/:symbol
router.get("/ticker/:symbol", async (req: Request, res: Response) => {
  try {
    const profile = await fetchGseProfile(req.params.symbol as string);
    res.json(profile);
  } catch (err) {
    res.status(200).json({ error: "Ticker not found", symbol: req.params.symbol, detail: String(err) });
  }
});

// GET /api/v1/markets/gse/movers?limit=5
router.get("/movers", async (req: Request, res: Response) => {
  try {
    const snapshot = await getGseSnapshot();

    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
    const sorted = [...snapshot.tickers].filter(t => t.change !== 0);

    const gainers: Ticker[] = sorted
      .filter(t => t.change > 0)
      .sort((a, b) => b.change_pct - a.change_pct)
      .slice(0, limit);

    const losers: Ticker[] = sorted
      .filter(t => t.change < 0)
      .sort((a, b) => a.change_pct - b.change_pct)
      .slice(0, limit);

    res.json({
      exchange: "GSE",
      last_updated: snapshot.last_updated,
      gainers,
      losers,
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch movers", detail: String(err) });
  }
});

// GET /api/v1/markets/gse/summary
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const snapshot = await getGseSnapshot();

    const active = snapshot.tickers.filter(t => t.volume > 0);
    const gainers = snapshot.tickers.filter(t => t.change > 0).length;
    const losers = snapshot.tickers.filter(t => t.change < 0).length;
    const totalVolume = snapshot.tickers.reduce((sum, t) => sum + t.volume, 0);

    res.json({
      exchange: "GSE",
      status: snapshot.status,
      last_updated: snapshot.last_updated,
      total_listed: snapshot.tickers.length,
      active_tickers: active.length,
      gainers,
      losers,
      unchanged: snapshot.tickers.length - gainers - losers,
      total_volume: totalVolume,
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch summary" });
  }
});

export default router;
