"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import type { CompanyProfile } from "@/types/market";
import { formatPrice, formatMarketCap, formatChange } from "@/lib/utils";
import { api } from "@/lib/api";

interface Props { symbol: string | null; onClose: () => void; }

export function TickerDrawer({ symbol, onClose }: Props) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setProfile(null);
    api.gse.ticker(symbol)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [symbol]);

  if (!symbol) return null;

  const isUp = profile && profile.price > 0 && true;
  const changeColor = profile
    ? "var(--text-secondary)"
    : "var(--text-tertiary)";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-sm z-50 border-l overflow-y-auto animate-slide-up"
        style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0"
          style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}>
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {symbol}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse"
                  style={{ background: "var(--bg-tertiary)" }} />
              ))}
            </div>
          )}

          {profile && (
            <div className="space-y-5 animate-fade-in">
              {/* Price hero */}
              <div>
                <p className="text-3xl font-semibold tabular tracking-tight"
                  style={{ color: "var(--text-primary)" }}>
                  {formatPrice(profile.price)}
                </p>
                <p className="text-sm mt-1 tabular" style={{ color: "var(--text-secondary)" }}>
                  {profile.company.full_name}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {profile.company.sector && (
                  <span className="text-xs px-2.5 py-1 rounded-full border"
                    style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                    {profile.company.sector}
                  </span>
                )}
                {profile.company.industry && (
                  <span className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
                    {profile.company.industry}
                  </span>
                )}
              </div>

              {/* Fundamentals */}
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest font-medium mb-2"
                  style={{ color: "var(--text-tertiary)" }}>Fundamentals</p>
                {[
                  ["Market Cap", formatMarketCap(profile.market_cap)],
                  ["Shares Outstanding", profile.shares_outstanding?.toLocaleString() ?? "—"],
                  ["EPS", profile.eps != null ? `GHS ${profile.eps.toFixed(2)}` : "—"],
                  ["DPS", profile.dps != null ? `GHS ${profile.dps.toFixed(2)}` : "—"],
                  ["Exchange", profile.exchange],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b"
                    style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>{label}</span>
                    <span className="text-sm tabular font-medium" style={{ color: "var(--text-primary)" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Website */}
              {profile.company.website && (
                <a
                  href={`https://${profile.company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--gold)" }}
                >
                  <ExternalLink size={13} />
                  {profile.company.website}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}