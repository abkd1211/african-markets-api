import { Router, Request, Response } from "express";
import { fetchGseSnapshot, fetchGseProfile } from "../adapters/gse.adapter";
import { cache } from "../cache/market.cache";
import { Ticker, MarketSnapshot } from "../types/market.types";

const router = Router();

// Deduplicate parallel fetches to Kwayisi
let gseFetchPromise: Promise<MarketSnapshot> | null = null;

async function getGseSnapshot(): Promise<MarketSnapshot> {
  const cached = cache.getGseSnapshot();
  const isStale = cache.isGseSnapshotStale();

  // If we have data and it's not stale, return it
  if (cached && !isStale) return cached;

  // If we have data but it IS stale, return it immediately BUT trigger a background refresh
  if (cached && isStale) {
    if (!gseFetchPromise) {
      gseFetchPromise = fetchGseSnapshot().finally(() => { gseFetchPromise = null; });
    }
    return cached;
  }

  // If we have NO data at all (first run), we must wait
  if (gseFetchPromise) return gseFetchPromise;
  
  gseFetchPromise = fetchGseSnapshot().finally(() => {
    gseFetchPromise = null;
  });
  return gseFetchPromise;
}

// GET /api/v1/markets/gse/live
router.get("/live", async (req: Request, res: Response) => {
  try {
    const snapshot = await getGseSnapshot();
    res.json(snapshot);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch GSE data", detail: String(err) });
  }
});

// GET /api/v1/markets/gse/ticker/:symbol
router.get("/ticker/:symbol", async (req: Request, res: Response) => {
  try {
    const profile = await fetchGseProfile(req.params.symbol as string);
    res.json(profile);
  } catch (err) {
    res.status(404).json({ error: "Ticker not found", symbol: req.params.symbol });
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