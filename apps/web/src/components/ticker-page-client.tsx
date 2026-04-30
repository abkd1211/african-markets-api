"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { HistoricalData, CompanyProfile } from "@/types/market";
import { PriceChart } from "./price-chart";
import { ThemeToggle } from "./theme-toggle";
import { api } from "@/lib/api";
import { formatPrice, formatMarketCap, formatVolume } from "@/lib/utils";

type Range = "1M" | "3M" | "6M" | "1Y" | "All";

interface Props {
  symbol: string;
  exchange: "GSE" | "NGX";
  initialHistory: HistoricalData;
  initialProfile: CompanyProfile | null;
}

export function TickerPageClient({ symbol, exchange, initialHistory, initialProfile }: Props) {
  const [history, setHistory] = useState(initialHistory);
  const [loading, setLoading] = useState(false);

  const currency = exchange === "GSE" ? "GHS" : "NGN";
  const latest = history.data[history.data.length - 1];
  const prev = history.data[history.data.length - 2];
  const change = latest && prev ? latest.close - prev.close : null;
  const changePct = prev && change != null ? (change / prev.close) * 100 : null;
  const isUp = change != null && change >= 0;

  const handleRangeChange = useCallback(async (range: Range) => {
    setLoading(true);
    try {
      const data = exchange === "GSE"
        ? await api.gse.history(symbol.toLowerCase(), range)
        : await api.ngx.history(symbol.toLowerCase(), range);
      setHistory(data);
    } finally {
      setLoading(false);
    }
  }, [symbol, exchange]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <header
        className="border-b sticky top-0 z-30 backdrop-blur-md"
        style={{ borderColor: "var(--border)", background: "rgba(13,12,10,0.85)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Markets</span>
            </Link>
            <span style={{ color: "var(--border)" }}>·</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {symbol}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: "var(--gold-glow)", color: "var(--gold)" }}
              >
                {exchange}
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Price hero */}
        <div className="space-y-1">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {initialProfile?.company.full_name ?? symbol}
          </p>
          <div className="flex items-end gap-3 flex-wrap">
            <h1 className="text-4xl font-semibold tabular tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              {latest ? formatPrice(latest.close, currency) : "—"}
            </h1>
            {change != null && changePct != null && (
              <span
                className="text-base font-medium tabular mb-1 px-2.5 py-1 rounded-lg"
                style={{
                  color: isUp ? "var(--green)" : "var(--red)",
                  background: isUp ? "var(--green-bg)" : "var(--red-bg)",
                }}
              >
                {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePct.toFixed(2)}%)
              </span>
            )}
          </div>
          {latest && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              As of {latest.date} · {currency}
            </p>
          )}
        </div>

        {/* Chart */}
        <div
          className="rounded-2xl border p-4 sm:p-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <PriceChart
            data={history.data}
            currency={currency}
            symbol={symbol}
            onRangeChange={handleRangeChange}
            isLoading={loading}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ["Market Cap", initialProfile ? formatMarketCap(initialProfile.market_cap) : "—"],
            ["Shares Out.", initialProfile?.shares_outstanding
              ? formatVolume(initialProfile.shares_outstanding)
              : "—"],
            ["EPS", initialProfile?.eps != null
              ? `${currency} ${initialProfile.eps.toFixed(2)}`
              : "—"],
            ["DPS", initialProfile?.dps != null
              ? `${currency} ${initialProfile.dps.toFixed(2)}`
              : "—"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border p-4"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
            >
              <p className="text-xs uppercase tracking-widest font-medium mb-1"
                style={{ color: "var(--text-tertiary)" }}>{label}</p>
              <p className="text-lg font-semibold tabular"
                style={{ color: "var(--text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Company profile */}
        {initialProfile && (
          <div
            className="rounded-2xl border p-5 sm:p-6 space-y-4"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}>Company</h2>
            <div className="flex flex-wrap gap-2">
              {initialProfile.company.sector && (
                <span className="text-xs px-2.5 py-1 rounded-full border"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                  {initialProfile.company.sector}
                </span>
              )}
              {initialProfile.company.industry && (
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
                  {initialProfile.company.industry}
                </span>
              )}
            </div>
            
            {initialProfile.company.website && (
              <a
                href={`https://${initialProfile.company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--gold)" }}
              >
                <ExternalLink size={13} />
                {initialProfile.company.website}
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}