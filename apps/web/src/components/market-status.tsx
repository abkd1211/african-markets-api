"use client";
interface Props { status: "OPEN" | "CLOSED"; lastUpdated: string; }

export function MarketStatus({ status, lastUpdated }: Props) {
  const isOpen = status === "OPEN";
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {isOpen && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: "var(--green)" }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-2 w-2"
          style={{ background: isOpen ? "var(--green)" : "var(--text-tertiary)" }}
        />
      </span>
      <span className="text-xs tabular" style={{ color: "var(--text-secondary)" }}>
        {isOpen ? "Market Open" : "Market Closed"}
        <span className="ml-2" style={{ color: "var(--text-tertiary)" }}>
          · Updated {new Date(lastUpdated).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </span>
    </div>
  );
}