"use client";
import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Code2, Zap } from "lucide-react";

// lucide-react doesn't ship brand icons — inline the GitHub mark instead
const GithubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);
import type { MarketSnapshot, MarketSummary, TopMovers } from "@/types/market";
import { ThemeToggle } from "./theme-toggle";
import { MarketStatus } from "./market-status";
import { StatCard } from "./stat-card";
import { TickerTable } from "./ticker-table";
import { TickerDrawer } from "./ticker-drawer";
import { api } from "@/lib/api";
import { formatVolume, timeAgo } from "@/lib/utils";

interface Props {
  initialSnapshot: MarketSnapshot;
  initialSummary: MarketSummary;
  initialMovers: TopMovers;
}

export function DashboardClient({ initialSnapshot, initialSummary, initialMovers }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [summary, setSummary] = useState(initialSummary);
  const [movers, setMovers] = useState(initialMovers);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [s, sum, m] = await Promise.all([
        api.gse.live(), api.gse.summary(), api.gse.movers()
      ]);
      setSnapshot(s); setSummary(sum); setMovers(m);
      setLastRefresh(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <header className="border-b sticky top-0 z-30 backdrop-blur-md"
        style={{ borderColor: "var(--border)", background: "rgba(var(--bg-primary), 0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--gold-glow)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <span className="text-xs font-bold gold-text">AM</span>
            </div>
            <span className="font-semibold text-sm tracking-tight"
              style={{ color: "var(--text-primary)" }}>
              African<span className="gold-text">Markets</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MarketStatus status={summary.status} lastUpdated={summary.last_updated} />
            <div className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />
            <button
              onClick={refresh}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Ghana Stock Exchange
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Live market data · {summary.total_listed} securities · Refreshes every 60s
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active" value={summary.active_tickers} sub={`of ${summary.total_listed} listed`} />
          <StatCard label="Gainers" value={summary.gainers} accent />
          <StatCard label="Losers" value={summary.losers} />
          <StatCard label="Volume" value={formatVolume(summary.total_volume)} sub="shares traded" />
        </div>

        {/* Movers */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Top Gainers */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--border)" }}>
            <div className="px-4 py-3 border-b flex items-center gap-2"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)" }} />
              <span className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--text-tertiary)" }}>Top Gainers</span>
            </div>
            <div>
              {movers.gainers.slice(0, 4).map((t, i) => (
                <div key={t.symbol}
                  onClick={() => setSelectedTicker(t.symbol)}
                  className="flex items-center justify-between px-4 py-2.5 border-b cursor-pointer transition-colors"
                  style={{ borderColor: "var(--border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--green-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-primary)" }}>{t.symbol}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tabular" style={{ color: "var(--text-secondary)" }}>
                      {t.price.toFixed(2)}
                    </span>
                    <span className="text-xs tabular font-medium px-2 py-0.5 rounded"
                      style={{ color: "var(--green)", background: "var(--green-bg)" }}>
                      +{t.change_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "var(--border)" }}>
            <div className="px-4 py-3 border-b flex items-center gap-2"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--red)" }} />
              <span className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "var(--text-tertiary)" }}>Top Losers</span>
            </div>
            <div>
              {movers.losers.slice(0, 4).map((t) => (
                <div key={t.symbol}
                  onClick={() => setSelectedTicker(t.symbol)}
                  className="flex items-center justify-between px-4 py-2.5 border-b cursor-pointer transition-colors"
                  style={{ borderColor: "var(--border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--red-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="text-xs font-semibold tracking-wide"
                    style={{ color: "var(--text-primary)" }}>{t.symbol}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tabular" style={{ color: "var(--text-secondary)" }}>
                      {t.price.toFixed(2)}
                    </span>
                    <span className="text-xs tabular font-medium px-2 py-0.5 rounded"
                      style={{ color: "var(--red)", background: "var(--red-bg)" }}>
                      {t.change_pct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main ticker table */}
        <TickerTable tickers={snapshot.tickers} onSelect={setSelectedTicker} />

        {/* Developer CTA */}
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
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-mono"
                style={{ background: "var(--bg-tertiary)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <Code2 size={12} style={{ color: "var(--gold)" }} />
                GET /api/v1/markets/gse/live
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="https://github.com/abkd1211/african-markets-api" target="_blank"
                className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--gold)" }}>
                <GithubIcon size={14} />
                View on GitHub
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

      {/* Ticker detail drawer */}
      <TickerDrawer symbol={selectedTicker} onClose={() => setSelectedTicker(null)} />
    </div>
  );
}