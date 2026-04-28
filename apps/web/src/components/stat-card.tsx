interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, accent }: Props) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: accent ? "var(--gold-glow)" : "var(--bg-card)",
        borderColor: accent ? "rgba(245,158,11,0.25)" : "var(--border-subtle)",
      }}
    >
      <p className="text-xs font-medium uppercase tracking-widest mb-1"
         style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
      <p
        className="text-2xl font-semibold tabular tracking-tight"
        style={{ color: accent ? "var(--gold)" : "var(--text-primary)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{sub}</p>
      )}
    </div>
  );
}