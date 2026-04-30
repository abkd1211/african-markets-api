import { Suspense } from "react";
import { api } from "@/lib/api";
import { DashboardClient } from "@/components/dashboard-client";
import { MarketSnapshot, MarketSummary, TopMovers, NgxSnapshot } from "@/types/market";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [gseSnapshot, gseSummary, gseMovers, ngxSnapshot] = await Promise.all([
    api.gse.live().catch(() => ({ tickers: [], status: "CLOSED", last_updated: new Date().toISOString(), exchange: "GSE" } as MarketSnapshot)),
    api.gse.summary().catch(() => ({ exchange: "GSE", status: "CLOSED", total_listed: 0, active_tickers: 0, gainers: 0, losers: 0, unchanged: 0, total_volume: 0, last_updated: new Date().toISOString() } as MarketSummary)),
    api.gse.movers().catch(() => ({ exchange: "GSE", last_updated: new Date().toISOString(), gainers: [], losers: [] } as TopMovers)),
    api.ngx.live().catch(() => ({ tickers: [], status: "CLOSED", last_updated: new Date().toISOString(), exchange: "NGX" } as NgxSnapshot)),
  ]);

  return (
    <Suspense>
      <DashboardClient
        initialGseSnapshot={gseSnapshot}
        initialGseSummary={gseSummary}
        initialGseMovers={gseMovers}
        initialNgxSnapshot={ngxSnapshot}
      />
    </Suspense>
  );
}