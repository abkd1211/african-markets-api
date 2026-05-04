import { Suspense } from "react";
import { api } from "@/lib/api";
import { TickerPageClient } from "@/components/ticker-page-client";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ exchange: string; symbol: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { symbol, exchange } = await params;
  const ex = exchange.toUpperCase() as "GSE" | "NGX";
  
  try {
    const history = await (ex === "GSE" 
      ? api.gse.history(symbol, "1M") 
      : api.ngx.history(symbol, "1M"));
    
    const lastPoint = history.data[history.data.length - 1];
    const firstPoint = history.data[0];
    const price = lastPoint?.close;
    const changePct = firstPoint && lastPoint ? ((lastPoint.close - firstPoint.close) / firstPoint.close) * 100 : 0;
    const sign = changePct >= 0 ? "+" : "";
    const currency = ex === "GSE" ? "GH₵" : "₦";

    return {
      title: `${symbol.toUpperCase()}: ${currency} ${price?.toLocaleString()} (${sign}${changePct.toFixed(2)}%) | AfricanMarkets`,
      description: `Live share price for ${symbol.toUpperCase()} on the ${exchange.toUpperCase()}. Current price: ${currency} ${price?.toLocaleString()}. View 10-year historical charts, performance metrics, and company profiles on AfricanMarkets.`,
      openGraph: {
        title: `${symbol.toUpperCase()} Stock Price | AfricanMarkets`,
        description: `Track ${symbol.toUpperCase()} performance on the ${exchange.toUpperCase()}. Real-time data and historical analysis.`,
        type: "website",
      }
    };
  } catch {
    return {
      title: `${symbol.toUpperCase()} — ${exchange.toUpperCase()} | AfricanMarkets`,
    };
  }
}

export default async function TickerPage({ params }: Props) {
  const { exchange, symbol } = await params;
  const ex = exchange.toUpperCase() as "GSE" | "NGX";
  const sym = symbol.toUpperCase();

  try {
    const [history, profile] = await Promise.allSettled([
      ex === "GSE"
        ? api.gse.history(symbol, "All")
        : api.ngx.history(symbol, "All"),
      ex === "GSE"
        ? api.gse.ticker(symbol)
        : Promise.resolve(null),
    ]);

    const historyData = history.status === "fulfilled" ? history.value : null;
    const profileData = profile.status === "fulfilled" ? profile.value : null;

    if (!historyData || historyData.data.length === 0) return notFound();

    const lastPoint = historyData.data[historyData.data.length - 1];

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FinancialQuote",
      "symbol": sym,
      "exchange": ex,
      "price": lastPoint?.close,
      "priceCurrency": ex === "GSE" ? "GHS" : "NGN",
      "url": `https://african-markets.vercel.app/ticker/${exchange}/${symbol}`,
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Suspense>
          <TickerPageClient
            symbol={sym}
            exchange={ex}
            initialHistory={historyData}
            initialProfile={profileData}
          />
        </Suspense>
      </>
    );
  } catch {
    return notFound();
  }
}