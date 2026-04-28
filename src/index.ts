import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import marketsRouter from "./routes/markets.router";
import { fetchGseSnapshot } from "./adapters/gse.adapter";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/markets", marketsRouter);

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Poll GSE every 5 minutes on weekdays
cron.schedule("*/5 * * * 1-5", async () => {
  console.log("[cron] Polling GSE...");
  try {
    await fetchGseSnapshot();
    console.log("[cron] GSE snapshot updated.");
  } catch (err) {
    console.error("[cron] GSE poll failed:", err);
  }
});

// Initial fetch on startup
fetchGseSnapshot()
  .then(() => console.log("[startup] GSE data loaded."))
  .catch((err) => console.error("[startup] Initial GSE fetch failed:", err));

app.listen(PORT, () => {
  console.log(`African Markets API running on http://localhost:${PORT}`);
});