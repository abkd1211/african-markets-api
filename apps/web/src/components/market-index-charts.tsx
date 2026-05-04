"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PriceChart } from "./price-chart";
import { StatCard } from "./stat-card";
import type { HistoricalDataPoint } from "@/types/market";
import { TrendingUp, TrendingDown, LayoutGrid, Activity } from "lucide-react";

export function MarketIndexCharts() {
  const [gseIndex, setGseIndex] = useState<HistoricalDataPoint[]>([]);
  const [ngxIndex, setNgxIndex] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"GSE" | "NGX">("GSE");

  useEffect(() => {
    async function fetchIndices() {
      try {
        const [gse, ngx] = await Promise.all([
          api.gse.history("gse-ci", "All"),
          api.ngx.history("asi", "All"),
        ]);
        setGseIndex(gse.data);
        setNgxIndex(ngx.data);
      } catch (error) {
        console.error("Failed to fetch market indices:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchIndices();
  }, []);

  const currentData = activeTab === "GSE" ? gseIndex : ngxIndex;
  const lastPoint = currentData[currentData.length - 1];
  const firstPoint = currentData[0];
  const change = lastPoint && firstPoint ? lastPoint.close - firstPoint.close : 0;
  const changePct = firstPoint ? (change / firstPoint.close) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-gold-500" />
          <h2 className="text-lg font-semibold tracking-tight">Market Performance</h2>
        </div>
        <div className="flex bg-bg-secondary p-1 rounded-lg border border-border-subtle">
          <button
            onClick={() => setActiveTab("GSE")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "GSE"
                ? "bg-bg-primary text-gold-500 shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            GSE (Ghana)
          </button>
          <button
            onClick={() => setActiveTab("NGX")}
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "NGX"
                ? "bg-bg-primary text-gold-500 shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            NGX (Nigeria)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border overflow-hidden bg-bg-card">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                {activeTab === "GSE" ? "GSE Composite Index (GSE-CI)" : "NGX All-Share Index (ASI)"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold tabular">
                  {lastPoint ? lastPoint.close.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                </span>
                {change !== 0 && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                    change > 0 ? "text-green bg-green-bg" : "text-red bg-red-bg"
                  }`}>
                    {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {changePct.toFixed(2)}% (1Y)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="w-full p-4 pt-0">
            {!loading ? (
              <PriceChart 
                data={currentData} 
                height={320}
                showControls={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gold-glow border-t-gold-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <StatCard 
            label="Market Cap" 
            value={activeTab === "GSE" ? "GHS 285.8B" : "NGN 55.4T"} 
            sub="Total Market Value"
            accent
          />
          <StatCard 
            label="Year High" 
            value={currentData.length > 0 ? Math.max(...currentData.map(d => d.close)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} 
            sub="Highest Point (1Y)"
          />
          <StatCard 
            label="Year Low" 
            value={currentData.length > 0 ? Math.min(...currentData.map(d => d.close)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"} 
            sub="Lowest Point (1Y)"
          />
        </div>
      </div>
    </div>
  );
}
