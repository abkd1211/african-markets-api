import { Suspense } from "react";
import { api } from "@/lib/api";
import { DashboardClient } from "@/components/dashboard-client";

export const revalidate = 30;

export default async function Page() {
  const [snapshot, summary, movers] = await Promise.all([
    api.gse.live(),
    api.gse.summary(),
    api.gse.movers(),
  ]);

  return (
    <Suspense>
      <DashboardClient
        initialSnapshot={snapshot}
        initialSummary={summary}
        initialMovers={movers}
      />
    </Suspense>
  );
}