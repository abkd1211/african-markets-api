"use client";

interface Props {
  active: "GSE" | "NGX";
  onChange: (exchange: "GSE" | "NGX") => void;
  gseStatus: "OPEN" | "CLOSED";
  ngxStatus: "OPEN" | "CLOSED";
}

export function ExchangeTabs({ active, onChange, gseStatus, ngxStatus }: Props) {
  const tabs = [
    { id: "GSE" as const, label: "Ghana Stock Exchange", short: "GSE", status: gseStatus, flag: "🇬🇭" },
    { id: "NGX" as const, label: "Nigerian Exchange", short: "NGX", status: ngxStatus, flag: "🇳🇬" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map(tab => {
        const isActive = active === tab.id;
        const isOpen = tab.status === "OPEN";
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all text-left"
            style={{
              background: isActive ? "var(--gold-glow)" : "var(--bg-secondary)",
              borderColor: isActive ? "rgba(245,158,11,0.3)" : "var(--border-subtle)",
            }}
          >
            <span className="text-lg leading-none">{tab.flag}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-semibold"
                  style={{ color: isActive ? "var(--gold)" : "var(--text-primary)" }}
                >
                  {tab.short}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: isOpen ? "var(--green)" : "var(--text-tertiary)" }}
                />
              </div>
              <div className="text-xs hidden sm:block" style={{ color: "var(--text-tertiary)" }}>
                {tab.label}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}