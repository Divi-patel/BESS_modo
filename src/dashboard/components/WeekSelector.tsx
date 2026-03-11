"use client";

interface WeekSelectorProps {
  weeks: Array<{ label: string }>;
  selected: number;
  onChange: (idx: number) => void;
}

export function WeekSelector({ weeks, selected, onChange }: WeekSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {weeks.map((w, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-md transition-colors
            ${
              i === selected
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            }
          `}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
