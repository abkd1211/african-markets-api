import { Suspense } from "react";
import { api } from "@/lib/api";
import { TickerPageClient } from "@/components/ticker-page-client";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ exchange: string; symbol: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { symbol, exchange } = await params;
  return {
    title: `${symbol.toUpperCase()} — ${exchange.toUpperCase()} | AfricanMarkets`,
    description: `Live price, historical chart and company profile for ${symbol.toUpperCase()} on the ${exchange.toUpperCase()}.`,
  };
}

export default async function TickerPage({ params }: Props) {
  const { exchange, symbol } = await params;
  const ex = exchange.toUpperCase() as "GSE" | "NGX";
  const sym = symbol.toUpperCase();

  try {
    const [history, profile] = await Promise.allSettled([
      ex === "GSE"
        ? api.gse.history(symbol, "1Y")
        : api.ngx.history(symbol, "1Y"),
      ex === "GSE"
        ? api.gse.ticker(symbol)
        : Promise.resolve(null),
    ]);

    const historyData = history.status === "fulfilled" ? history.value : null;
    const profileData = profile.status === "fulfilled" ? profile.value : null;

    if (!historyData || historyData.data.length === 0) return notFound();

    return (
      <Suspense>
        <TickerPageClient
          symbol={sym}
          exchange={ex}
          initialHistory={historyData}
          initialProfile={profileData}
        />
      </Suspense>
    );
  } catch {
    return notFound();
  }
}