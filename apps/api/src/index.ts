import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import marketsRouter from "./routes/markets.router";
import ngxRouter from "./routes/ngx.router";
import historyRouter from "./routes/history.router";
import { fetchGseSnapshot, isGseOpen } from "./adapters/gse.adapter";
import { fetchNgxSnapshot, isNgxOpen } from "./adapters/ngx.scraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/markets/gse", marketsRouter);
app.use("/api/v1/markets/ngx", ngxRouter);
app.use("/api/v1/history", historyRouter);

// Health
app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    exchanges: ["GSE", "NGX"],
    endpoints: [
      "/api/v1/markets/gse/live",
      "/api/v1/markets/gse/summary",
      "/api/v1/markets/gse/movers",
      "/api/v1/markets/gse/ticker/:symbol",
      "/api/v1/markets/ngx/live",
      "/api/v1/markets/ngx/summary",
      "/api/v1/markets/ngx/movers",
      "/api/v1/history/gse/:symbol",
      "/api/v1/history/ngx/:symbol",
    ],
  });
});

// GSE: poll every 5 min during market hours
cron.schedule("*/5 * * * *", async () => {
  if (!isGseOpen()) {
    console.log("[cron] GSE is closed. Skipping fetch.");
    return;
  }
  console.log("[cron] Polling GSE...");
  try { await fetchGseSnapshot(); console.log("[cron] GSE updated."); }
  catch (e) { console.error("[cron] GSE failed:", e); }
});

// NGX: poll every 5 min during market hours (offset by 1 min to avoid overlap)
cron.schedule("1-56/5 * * * *", async () => {
  if (!isNgxOpen()) {
    console.log("[cron] NGX is closed. Skipping fetch.");
    return;
  }
  console.log("[cron] Polling NGX...");
  try { await fetchNgxSnapshot(); console.log("[cron] NGX updated."); }
  catch (e) { console.error("[cron] NGX failed:", e); }
});

// Startup with retries
async function bootstrap() {
  console.log("[startup] Fetching initial data...");
  
  // Retry logic: try up to 3 times with 2s delay
  async function retryFetch(name: string, fn: () => Promise<any>, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await fn();
        console.log(`[startup] ${name} ready.`);
        return;
      } catch (err) {
        console.error(`[startup] ${name} attempt ${i + 1} failed:`, String(err).slice(0, 100));
        if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 2000));
      }
    }
    console.error(`[startup] ${name} failed after ${maxRetries} attempts.`);
  }

  // Run sequentially with delays to prevent triggering rate limits
  await retryFetch("GSE", () => fetchGseSnapshot());
  await new Promise(r => setTimeout(r, 3000)); // 3s delay
  await retryFetch("NGX", () => fetchNgxSnapshot());
  
  console.log("[startup] Data initialization complete.");
}

bootstrap().catch(err => console.error("[startup] Bootstrap error:", err));

app.listen(PORT as number, "0.0.0.0", () => {
  console.log(`African Markets API → http://0.0.0.0:${PORT}`);
});