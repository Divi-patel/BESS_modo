"use client";

interface KpiItem {
  label: string;
  value: string;
  sub?: string;
  color: "green" | "blue" | "amber" | "red";
  icon: React.ReactNode;
}

interface KpiCardsProps {
  items: KpiItem[];
}

function KpiCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "green" | "blue" | "amber" | "red";
  icon: React.ReactNode;
}) {
  const colorMap = {
    green: {
      border: "border-[var(--color-safe)]/40",
      text: "text-[var(--color-safe)]",
      value: "text-[var(--color-safe)]",
    },
    amber: {
      border: "border-[var(--color-warning)]/40",
      text: "text-[var(--color-warning)]",
      value: "text-[var(--color-warning)]",
    },
    red: {
      border: "border-[var(--color-breach)]/40",
      text: "text-[var(--color-breach)]",
      value: "text-[var(--color-breach)]",
    },
    blue: {
      border: "border-[var(--color-accent)]/40",
      text: "text-[var(--color-accent)]",
      value: "text-[var(--color-text)]",
    },
  }[color];

  return (
    <div
      className={`
        flex-1 min-w-0 rounded-lg border ${colorMap.border}
        bg-[var(--color-surface)] px-4 py-3
        flex flex-col gap-1
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </span>
        <span className={colorMap.text}>{icon}</span>
      </div>
      <div className={`text-2xl font-mono font-bold ${colorMap.value}`}>
        {value}
      </div>
      {sub && (
        <div className="text-xs text-[var(--color-text-secondary)]">{sub}</div>
      )}
    </div>
  );
}

export function KpiCards({ items }: KpiCardsProps) {
  return (
    <div className="flex gap-3 w-full">
      {items.map((item, i) => (
        <KpiCard key={i} {...item} />
      ))}
    </div>
  );
}
