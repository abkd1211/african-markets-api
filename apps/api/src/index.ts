import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import marketsRouter from "./routes/markets.router";
import ngxRouter from "./routes/ngx.router";
import historyRouter from "./routes/history.router";
import { fetchGseSnapshot } from "./adapters/gse.adapter";
import { fetchNgxSnapshot } from "./adapters/ngx.scraper";

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

// GSE: poll every 5 min on weekdays 10:00–15:00 GMT
cron.schedule("*/5 10-15 * * 1-5", async () => {
  console.log("[cron] Polling GSE...");
  try { await fetchGseSnapshot(); console.log("[cron] GSE updated."); }
  catch (e) { console.error("[cron] GSE failed:", e); }
});

// NGX: poll every 5 min on weekdays 08:30–13:30 UTC
cron.schedule("*/5 8-14 * * 1-5", async () => {
  console.log("[cron] Polling NGX...");
  try { await fetchNgxSnapshot(); console.log("[cron] NGX updated."); }
  catch (e) { console.error("[cron] NGX failed:", e); }
});

// Startup
async function bootstrap() {
  console.log("[startup] Fetching initial data...");
  await Promise.allSettled([
    fetchGseSnapshot().then(() => console.log("[startup] GSE ready.")),
    fetchNgxSnapshot().then(() => console.log("[startup] NGX ready.")),
  ]);
}

bootstrap();

app.listen(PORT, () => {
  console.log(`African Markets API → http://localhost:${PORT}`);
});