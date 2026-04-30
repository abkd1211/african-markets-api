"use client";
import { useState, useMemo } from "react";
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import type { Ticker } from "@/types/market";
import { formatPrice, formatVolume, formatChange } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  tickers: Ticker[];
  onSelect: (symbol: string) => void;
  exchange: "GSE" | "NGX";
}

type SortKey = "symbol" | "price" | "change_pct" | "volume";

export function TickerTable({ tickers, onSelect, exchange }: Props) {
  const currency = exchange === "NGX" ? "NGN" : "GHS";
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all");

  const filtered = useMemo(() => {
    let data = tickers.filter(t =>
      t.symbol.toLowerCase().includes(search.toLowerCase())
    );
    if (filter === "gainers") data = data.filter(t => t.change > 0);
    if (filter === "losers") data = data.filter(t => t.change < 0);
    return data.sort((a, b) => {
      const mult = sortDir === "asc" ? 1 : -1;
      if (sortKey === "symbol") return mult * a.symbol.localeCompare(b.symbol);
      return mult * (a[sortKey] - b[sortKey]);
    });
  }, [tickers, search, sortKey, sortDir, filter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const SortBtn = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 w-full hover:opacity-80 transition-opacity ${align === "right" ? "justify-end" : "justify-start"}`}
    >
      {label}
      <ArrowUpDown size={11} style={{ opacity: sortKey === k ? 1 : 0.3 }} />
    </button>
  );

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 border-b"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
      >
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ticker..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none border"
            style={{
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              borderColor: "var(--border)",
            }}
          />
        </div>
        <div className="flex gap-1">
          {(["all", "gainers", "losers"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                filter === f ? "text-white" : ""
              )}
              style={{
                background: filter === f
                  ? f === "gainers" ? "var(--green)"
                  : f === "losers" ? "var(--red)"
                  : "var(--gold)"
                  : "var(--bg-tertiary)",
                color: filter === f ? "white" : "var(--text-secondary)",
              }}
            >
              {f === "gainers" && <TrendingUp size={11} className="inline mr-1" />}
              {f === "losers" && <TrendingDown size={11} className="inline mr-1" />}
              {f}
            </button>
          ))}
        </div>
        <span className="text-xs ml-auto tabular" style={{ color: "var(--text-tertiary)" }}>
          {filtered.length} securities
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: "18%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "35%" }} />
            <col style={{ width: "25%" }} />
          </colgroup>
          <thead>
            <tr className="text-xs uppercase tracking-wider"
              style={{ background: "var(--bg-secondary)", color: "var(--text-tertiary)" }}>
              <th className="text-left px-4 py-2.5 font-medium">
                <SortBtn k="symbol" label="Ticker" align="left" />
              </th>
              <th className="px-4 py-2.5 font-medium">
                <SortBtn k="price" label="Price" align="right" />
              </th>
              <th className="px-4 py-2.5 font-medium">
                <SortBtn k="change_pct" label="Change" align="right" />
              </th>
              <th className="px-4 py-2.5 font-medium hidden sm:table-cell">
                <SortBtn k="volume" label="Volume" align="right" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const isUp = t.change > 0;
              const isDown = t.change < 0;
              return (
                <tr
                  key={t.symbol}
                  onClick={() => onSelect(t.symbol)}
                  className="border-t cursor-pointer transition-colors hover:bg-opacity-50"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: i % 2 === 0 ? "transparent" : "var(--bg-secondary)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--gold-glow)")}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "var(--bg-secondary)")}
                >
                  <td className="px-4 py-3 align-middle">
                    <span className="font-semibold tracking-wide text-xs px-2 py-1 rounded"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}>
                      {t.symbol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular font-medium align-middle"
                    style={{ color: "var(--text-primary)" }}>
                    {formatPrice(t.price, currency)}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex justify-end">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                        style={{
                          color: isUp ? "var(--green)" : isDown ? "var(--red)" : "var(--text-tertiary)",
                          background: isUp ? "var(--green-bg)" : isDown ? "var(--red-bg)" : "transparent",
                        }}
                      >
                        {isUp && <TrendingUp size={11} />}
                        {isDown && <TrendingDown size={11} />}
                        {t.change !== 0 ? formatChange(t.change, t.change_pct) : "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular hidden sm:table-cell align-middle"
                    style={{ color: "var(--text-secondary)" }}>
                    {formatVolume(t.volume)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}