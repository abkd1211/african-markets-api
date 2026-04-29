import { Router, Request, Response } from "express";
import { fetchGseHistory } from "../adapters/gse.scraper";
import { fetchNgxHistory } from "../adapters/ngx.scraper";

const router = Router();

// GET /api/v1/history/gse/:symbol?range=1M|3M|1Y|all
router.get("/gse/:symbol", async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const range = (req.query.range as string) || "1Y";
    const history = await fetchGseHistory(symbol as string);
    const filtered = filterByRange(history.data, range);
    res.json({ ...history, data: filtered, range });
  } catch (err) {
    res.status(404).json({ error: "Historical data not found", symbol: req.params.symbol });
  }
});

// GET /api/v1/history/ngx/:symbol?range=1M|3M|1Y|all
router.get("/ngx/:symbol", async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const range = (req.query.range as string) || "1Y";
    const history = await fetchNgxHistory(symbol as string);
    const filtered = filterByRange(history.data, range);
    res.json({ ...history, data: filtered, range });
  } catch (err) {
    res.status(404).json({ error: "Historical data not found", symbol: req.params.symbol });
  }
});

function filterByRange(
  data: { date: string }[],
  range: string
): typeof data {
  if (range === "all") return data;

  const now = new Date();
  const cutoff = new Date();

  switch (range) {
    case "1W": cutoff.setDate(now.getDate() - 7); break;
    case "1M": cutoff.setMonth(now.getMonth() - 1); break;
    case "3M": cutoff.setMonth(now.getMonth() - 3); break;
    case "6M": cutoff.setMonth(now.getMonth() - 6); break;
    case "1Y": cutoff.setFullYear(now.getFullYear() - 1); break;
    default:   cutoff.setFullYear(now.getFullYear() - 1);
  }

  const cutoffStr = cutoff.toISOString().split("T")[0];
  return data.filter(d => d.date >= cutoffStr);
}

export default router;