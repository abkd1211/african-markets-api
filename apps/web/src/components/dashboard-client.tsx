"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Code2, Zap } from "lucide-react";

// lucide-react doesn't ship brand icons — inline the GitHub mark instead
const GithubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);
import type { MarketSnapshot, MarketSummary, TopMovers, NgxSnapshot } from "@/types/market";
import { ThemeToggle } from "./theme-toggle";
import { MarketStatus } from "./market-status";
import { StatCard } from "./stat-card";
import { TickerTable } from "./ticker-table";
import { ExchangeTabs } from "./exchange-tabs";
import { Logo } from "./logo";
import { api } from "@/lib/api";
import { formatVolume } from "@/lib/utils";

interface Props {
  initialGseSnapshot: MarketSnapshot;
  initialGseSummary: MarketSummary;
  initialGseMovers: TopMovers;
  initialNgxSnapshot: NgxSnapshot;
}

export function DashboardClient({
  initialGseSnapshot,
  initialGseSummary,
  initialGseMovers,
  initialNgxSnapshot,
}: Props) {
  const [activeExchange, setActiveExchange] = useState<"GSE" | "NGX">("GSE");
  const [gseSnapshot, setGseSnapshot] = useState(initialGseSnapshot);
  const [gseSummary, setGseSummary] = useState(initialGseSummary);
  const [gseMovers, setGseMovers] = useState(initialGseMovers);
  const [ngxSnapshot, setNgxSnapshot] = useState(initialNgxSnapshot);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [gs, gsum, gm, ns] = await Promise.all([
        api.gse.live(), api.gse.summary(), api.gse.movers(),
        api.ngx.live(),
      ]);
      setGseSnapshot(gs); setGseSummary(gsum); setGseMovers(gm);
      setNgxSnapshot(ns);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  const isGse = activeExchange === "GSE";

  // Build ticker list for table — normalize NGX to same shape
  const tickers = isGse
    ? gseSnapshot.tickers
    : ngxSnapshot.tickers.map(t => ({
        symbol: t.symbol,
        price: t.price,
        change: t.change,
        change_pct: t.change_pct,
        volume: t.volume,
        currency: t.currency,
      }));

  const summary = isGse ? gseSummary : {
    exchange: "NGX",
    status: ngxSnapshot.status,
    last_updated: ngxSnapshot.last_updated,
    total_listed: ngxSnapshot.tickers.length,
    active_tickers: ngxSnapshot.tickers.filter(t => t.volume > 0).length,
    gainers: ngxSnapshot.tickers.filter(t => t.change > 0).length,
    losers: ngxSnapshot.tickers.filter(t => t.change < 0).length,
    unchanged: 0,
    total_volume: ngxSnapshot.tickers.reduce((s, t) => s + t.volume, 0),
  };

  // Top movers for the active exchange
  const activeTickers = isGse ? gseSnapshot.tickers : ngxSnapshot.tickers.map(t => ({
    ...t, currency: t.currency as string
  }));
  const gainers = [...activeTickers].filter(t => t.change > 0)
    .sort((a, b) => b.change_pct - a.change_pct).slice(0, 4);
  const losers = [...activeTickers].filter(t => t.change < 0)
    .sort((a, b) => a.change_pct - b.change_pct).slice(0, 4);

  const exchangeName = isGse ? "Ghana Stock Exchange" : "Nigerian Exchange";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <header className="border-b sticky top-0 z-30 backdrop-blur-md"
        style={{ borderColor: "var(--border)", background: "rgba(13,12,10,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="font-semibold text-sm tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              African<span className="gold-text">Markets</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MarketStatus
              status={summary.status as "OPEN" | "CLOSED"}
              lastUpdated={summary.last_updated}
            />
            <div className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />
            <button onClick={refresh} disabled={refreshing}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Exchange tabs */}
        <div className="space-y-4">
          <ExchangeTabs
            active={activeExchange}
            onChange={setActiveExchange}
            gseStatus={gseSummary.status}
            ngxStatus={ngxSnapshot.status}
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--text-primary)" }}>{exchangeName}</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Live market data · {summary.total_listed} securities · Refreshes every 60s
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active" value={summary.active_tickers}
            sub={`of ${summary.total_listed} listed`} />
          <StatCard label="Gainers" value={summary.gainers} accent />
          <StatCard label="Losers" value={summary.losers} />
          <StatCard label="Volume" value={formatVolume(summary.total_volume)}
            sub="shares traded" />
        </div>

        {/* Movers */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: "Top Gainers", color: "var(--green)", data: gainers, pos: true },
            { title: "Top Losers", color: "var(--red)", data: losers, pos: false },
          ].map(({ title, color, data, pos }) => (
            <div key={title} className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "var(--border)" }}>
              <div className="px-4 py-3 border-b flex items-center gap-2"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-xs font-medium uppercase tracking-widest"
                  style={{ color: "var(--text-tertiary)" }}>{title}</span>
              </div>
              <div>
                {data.map(t => (
                  <a key={t.symbol}
                    href={`/ticker/${activeExchange.toLowerCase()}/${t.symbol.toLowerCase()}`}
                    className="flex items-center justify-between px-4 py-2.5 border-b transition-colors no-underline"
                    style={{ borderColor: "var(--border-subtle)" }}
                    onMouseEnter={e => (e.currentTarget.style.background =
                      pos ? "var(--green-bg)" : "var(--red-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span className="text-xs font-semibold tracking-wide"
                      style={{ color: "var(--text-primary)" }}>{t.symbol}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs tabular"
                        style={{ color: "var(--text-secondary)" }}>
                        {t.price.toFixed(2)}
                      </span>
                      <span className="text-xs tabular font-medium px-2 py-0.5 rounded"
                        style={{ color, background: pos ? "var(--green-bg)" : "var(--red-bg)" }}>
                        {pos ? "+" : ""}{t.change_pct.toFixed(2)}%
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Ticker table */}
        <TickerTable
          tickers={tickers}
          exchange={activeExchange}
          onSelect={(symbol) => {
            window.location.href = `/ticker/${activeExchange.toLowerCase()}/${symbol.toLowerCase()}`;
          }}
        />

        {/* Dev CTA */}
        <div className="rounded-2xl border p-6 sm:p-8"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: "var(--gold)" }} />
              <span className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--gold)" }}>For Developers</span>
            </div>
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              African market data in your AI agent
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Everything you see here is available via a clean REST API and MCP server —
              built for Claude, Cursor, and any agent that needs African financial data.
              No Bloomberg subscription. No scraping. Just a clean endpoint.
            </p>
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border w-fit font-mono"
              style={{ background: "var(--bg-tertiary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              <Code2 size={12} style={{ color: "var(--gold)" }} />
              GET /api/v1/markets/gse/live
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="https://github.com/abkd1211/african-markets-api" target="_blank"
                className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--gold)" }}>
                <GithubIcon size={14} /> View on GitHub
              </a>
              <span style={{ color: "var(--border)" }}>·</span>
              <a href="mailto:asare7890.d@gmail.com"
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-secondary)" }}>
                Get API access
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}