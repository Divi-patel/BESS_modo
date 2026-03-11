"use client";

import { useState, useEffect } from "react";
import { Panel } from "@/components/Panel";
import { DispatchChart } from "@/components/DispatchChart";
import { WeekSelector } from "@/components/WeekSelector";
import { getDispatchWeeks } from "@/lib/data";
import type { DispatchWeek } from "@/types";

export default function DispatchPage() {
  const [weeks, setWeeks] = useState<DispatchWeek[] | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(2);

  useEffect(() => {
    getDispatchWeeks().then(setWeeks);
  }, []);

  if (!weeks) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="h-10 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
        <div className="h-[650px] animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
      </div>
    );
  }

  const week = weeks[selectedWeek];

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          Dispatch Profile
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          Perfect-foresight optimal dispatch at HB_WEST
        </p>
      </div>

      <WeekSelector weeks={weeks} selected={selectedWeek} onChange={setSelectedWeek} />

      <div className="flex gap-3 w-full">
        <div className="flex-1 min-w-0 rounded-lg border border-[var(--color-safe)]/40 bg-[var(--color-surface)] px-4 py-3">
          <div className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Revenue
          </div>
          <div className="text-2xl font-mono font-bold text-[var(--color-safe)] mt-1">
            ${week.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="flex-1 min-w-0 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-surface)] px-4 py-3">
          <div className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Cycles
          </div>
          <div className="text-2xl font-mono font-bold text-[var(--color-text)] mt-1">
            {week.cycles.toFixed(1)}
          </div>
        </div>
        <div className="flex-1 min-w-0 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-surface)] px-4 py-3">
          <div className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Max Spread
          </div>
          <div className="text-2xl font-mono font-bold text-[var(--color-warning)] mt-1">
            ${week.avg_spread.toFixed(0)}/MWh
          </div>
        </div>
      </div>

      <Panel title={`Optimal Dispatch — ${week.location}`} subtitle="Battery charges at low prices, discharges at peaks">
        <DispatchChart week={week} />
      </Panel>
    </div>
  );
}
