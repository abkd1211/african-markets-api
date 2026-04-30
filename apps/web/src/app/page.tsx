import { Suspense } from "react";
import { api } from "@/lib/api";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [gseSnapshot, gseSummary, gseMovers, ngxSnapshot] = await Promise.all([
    api.gse.live(),
    api.gse.summary(),
    api.gse.movers(),
    api.ngx.live(),
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