"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
  CandlestickSeries,
  LineData,
  CandlestickData,
  Time,
  ColorType,
  LineStyle,
} from "lightweight-charts";
import type { HistoricalDataPoint } from "@/types/market";
import { cn } from "@/lib/utils";

type Range = "1M" | "3M" | "6M" | "1Y" | "All";
type ChartType = "line" | "candle";

interface Props {
  data: HistoricalDataPoint[];
  currency?: string;
  symbol?: string;
  onRangeChange?: (range: Range) => void;
  isLoading?: boolean;
  height?: number;
  showControls?: boolean;
}

const RANGES: Range[] = ["1M", "3M", "6M", "1Y", "All"];

function filterByRange(data: HistoricalDataPoint[], range: Range): HistoricalDataPoint[] {
  if (range === "All") return data;
  const now = new Date();
  const cutoff = new Date();
  if (range === "1M") cutoff.setMonth(now.getMonth() - 1);
  if (range === "3M") cutoff.setMonth(now.getMonth() - 3);
  if (range === "6M") cutoff.setMonth(now.getMonth() - 6);
  if (range === "1Y") cutoff.setFullYear(now.getFullYear() - 1);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return data.filter(d => d.date >= cutoffStr);
}

// In v5, ISeriesApi still uses the string key "Line" | "Candlestick"
type AnySeriesApi = ISeriesApi<"Line"> | ISeriesApi<"Candlestick">;

export function PriceChart({ 
  data, 
  currency, 
  symbol, 
  onRangeChange, 
  isLoading,
  height = 320,
  showControls = true
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<AnySeriesApi | null>(null);
  const [range, setRange] = useState<Range>("1Y");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [isDark, setIsDark] = useState(true);

  // Detect theme from html.dark class
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const getColors = useCallback(() => ({
    bg:        isDark ? "#0d0c0a" : "#ffffff",
    grid:      isDark ? "#1a1814" : "#f0ece4",
    text:      isDark ? "#a09588" : "#6b6358",
    border:    isDark ? "#2a2620" : "#e8e2d9",
    gold:      isDark ? "#fbbf24" : "#d97706",
    green:     isDark ? "#22c55e" : "#16a34a",
    red:       isDark ? "#ef4444" : "#dc2626",
    crosshair: isDark ? "#2a2620" : "#e8e2d9",
  }), [isDark]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const colors = getColors();

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        // textColor lives in layout in v5
        textColor: colors.text,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: colors.grid, style: LineStyle.Dotted },
        horzLines: { color: colors.grid, style: LineStyle.Dotted },
      },
      crosshair: {
        vertLine: { color: colors.crosshair, width: 1, style: LineStyle.Dashed },
        horzLine: { color: colors.crosshair, width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: colors.border,
      },
      // In v5, timeScale.textColor moved to layout; only borderColor stays here
      timeScale: {
        borderColor: colors.border,
        visible: true,
        timeVisible: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const filtered = filterByRange(data, range);

    if (chartType === "line") {
      // v5 unified API: chart.addSeries(LineSeries, options)
      const series = chart.addSeries(LineSeries, {
        color: colors.gold,
        lineWidth: 2,
        priceLineVisible: true,
        priceLineColor: colors.gold,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBackgroundColor: colors.gold,
        lastValueVisible: true,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      });

      const lineData: LineData<Time>[] = filtered
        .filter(d => d.close != null)
        .map(d => ({
          // ISO date strings are valid Time values in lightweight-charts
          time: d.date as Time,
          value: d.close,
        }));

      series.setData(lineData);
      seriesRef.current = series;
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: colors.green,
        downColor: colors.red,
        borderUpColor: colors.green,
        borderDownColor: colors.red,
        wickUpColor: colors.green,
        wickDownColor: colors.red,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      });

      // Only close prices available — simulate OHLC from adjacent closes
      const candleData: CandlestickData<Time>[] = filtered
        .filter(d => d.close != null)
        .map((d, i, arr) => {
          const open  = d.open  ?? (i > 0 ? arr[i - 1].close : d.close);
          const close = d.close;
          const high  = d.high  ?? Math.max(open, close) * 1.005;
          const low   = d.low   ?? Math.min(open, close) * 0.995;
          return { time: d.date as Time, open, high, low, close };
        });

      series.setData(candleData);
      seriesRef.current = series;
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [data, range, chartType, isDark, getColors]);

  function handleRangeChange(r: Range) {
    setRange(r);
    onRangeChange?.(r);
  }

  const filtered = filterByRange(data, range);
  const first = filtered[0]?.close;
  const last  = filtered[filtered.length - 1]?.close;
  const perfPct    = first && last ? ((last - first) / first) * 100 : null;
  const isPositive = perfPct != null && perfPct >= 0;

  return (
    <div className="space-y-3">
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                range === r ? "text-black" : ""
              )}
              style={{
                background: range === r ? "var(--gold)" : "var(--bg-tertiary)",
                color: range === r ? "#000" : "var(--text-secondary)",
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {perfPct != null && (
            <span
              className="text-xs font-medium tabular px-2.5 py-1 rounded-lg"
              style={{
                color: isPositive ? "var(--green)" : "var(--red)",
                background: isPositive ? "var(--green-bg)" : "var(--red-bg)",
              }}
            >
              {isPositive ? "+" : ""}{perfPct.toFixed(2)}%
            </span>
          )}

          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: "var(--border)" }}
          >
            {(["line", "candle"] as ChartType[]).map(t => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className="px-3 py-1 text-xs font-medium transition-colors capitalize"
                style={{
                  background: chartType === t ? "var(--bg-tertiary)" : "transparent",
                  color: chartType === t ? "var(--text-primary)" : "var(--text-tertiary)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Chart canvas */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ border: "0.5px solid var(--border)" }}
      >
        {isLoading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Loading chart...
            </div>
          </div>
        )}
        <div ref={containerRef} style={{ height: `${height}px`, width: "100%" }} />
      </div>

      {chartType === "candle" && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Open/High/Low are estimated from closing prices. Full OHLC data is not available from this source.
        </p>
      )}
    </div>
  );
}