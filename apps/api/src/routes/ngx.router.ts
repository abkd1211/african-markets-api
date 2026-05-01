import { Router, Request, Response } from "express";
import {
  fetchNgxSnapshot,
  fetchNgxSummary,
} from "../adapters/ngx.scraper";
import { cache } from "../cache/market.cache";
import { NgxTicker, NgxSnapshot } from "../types/market.types";

const router = Router();

// Deduplicate parallel fetches to Kwayisi
let ngxFetchPromise: Promise<NgxSnapshot> | null = null;

async function getNgxSnapshot(): Promise<NgxSnapshot> {
  const cached = cache.getNgxSnapshot();
  const isStale = cache.isNgxSnapshotStale();

  if (isStale && !ngxFetchPromise) {
    ngxFetchPromise = (async () => {
      try {
        await fetchNgxSnapshot();
      } catch (err) {
        console.error("[NGX] Background refresh failed:", err instanceof Error ? err.message : String(err));
      }
    })().finally(() => { ngxFetchPromise = null; }) as any;
  }

  return cached;
}

// GET /api/v1/markets/ngx/live
router.get("/live", async (_req: Request, res: Response) => {
  try {
    const snapshot = await getNgxSnapshot();
    res.json(snapshot);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch NGX data" });
  }
});

// GET /api/v1/markets/ngx/summary
router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const summary = await fetchNgxSummary();
    res.json(summary);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch NGX summary" });
  }
});

// GET /api/v1/markets/ngx/movers?limit=5
router.get("/movers", async (req: Request, res: Response) => {
  try {
    const snapshot = await getNgxSnapshot();
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
    const active = snapshot.tickers.filter(t => t.change !== 0);

    const gainers: NgxTicker[] = active
      .filter(t => t.change > 0)
      .sort((a, b) => b.change_pct - a.change_pct)
      .slice(0, limit);

    const losers: NgxTicker[] = active
      .filter(t => t.change < 0)
      .sort((a, b) => a.change_pct - b.change_pct)
      .slice(0, limit);

    res.json({
      exchange: "NGX",
      last_updated: snapshot.last_updated,
      gainers,
      losers,
    });
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch NGX movers" });
  }
});

export default router;