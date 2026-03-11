"use client";

import { useState, useEffect, useMemo } from "react";
import { Panel } from "@/components/Panel";
import { BessFleetMap } from "@/components/BessFleetMap";
import { FleetTable } from "@/components/FleetTable";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import type { BessUnit } from "@/types";

export default function RegistryPage() {
  const [units, setUnits] = useState<BessUnit[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/bess-registry.json")
      .then((r) => r.json())
      .then((data) => {
        setUnits(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const filtered =
      statusFilter === "all" ? units : units.filter((u) => u.status === statusFilter);
    const totalMw = filtered.reduce((s, u) => s + (u.mw ?? 0), 0);
    const totalMwh = filtered.reduce((s, u) => s + (u.mwh ?? 0), 0);
    const withDuration = filtered.filter((u) => u.duration_hours != null);
    const avgDuration =
      withDuration.length > 0
        ? withDuration.reduce((s, u) => s + u.duration_hours!, 0) / withDuration.length
        : 0;

    const states = new Map<string, number>();
    for (const u of filtered) {
      if (u.state) states.set(u.state, (states.get(u.state) ?? 0) + 1);
    }
    const topStates = [...states.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { count: filtered.length, totalMw, totalMwh, avgDuration, topStates };
  }, [units, statusFilter]);

  const statusOptions = useMemo(() => {
    const statuses = new Set(units.map((u) => u.status).filter(Boolean));
    return ["all", ...statuses] as string[];
  }, [units]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">US BESS Registry</h1>
        <div className="h-[500px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            US BESS Registry
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {stats.count} battery storage units &middot; EIA-860 enriched dataset
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-text-muted)]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sidebar-select w-auto"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All" : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Units" value={stats.count.toLocaleString()} />
        <StatCard label="Total Capacity" value={`${(stats.totalMw / 1000).toFixed(1)} GW`} />
        <StatCard label="Total Energy" value={`${(stats.totalMwh / 1000).toFixed(1)} GWh`} />
        <StatCard label="Avg Duration" value={`${stats.avgDuration.toFixed(1)}h`} />
      </div>

      <Panel title="Fleet Map" subtitle="Marker size = MW capacity, color = MWh energy">
        <BessFleetMap units={units} statusFilter={statusFilter} />
      </Panel>

      <Panel title="Fleet Data">
        <FleetTable units={units} statusFilter={statusFilter} />
      </Panel>

      {/* Gen 5 Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlaceholderPanel
          title="Fleet Correlation Matrix"
          description="Cross-correlation of BESS fleet performance across ISOs. Identifies diversification opportunities and correlated risk exposures."
          gen={5}
        >
          <div className="h-48 grid grid-cols-5 grid-rows-5 gap-0.5 p-4">
            {Array.from({ length: 25 }, (_, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              const val = row === col ? 1 : 0.3 + Math.random() * 0.5;
              return (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    backgroundColor: `rgba(var(--color-accent-rgb, 59, 130, 246), ${val * 0.8})`,
                    opacity: 0.6,
                  }}
                />
              );
            })}
          </div>
        </PlaceholderPanel>

        <PlaceholderPanel
          title="Optimal Siting Recommendation"
          description="Multi-factor site ranking combining price volatility, congestion patterns, interconnection queue position, and renewable co-location synergies."
          gen={5}
        >
          <div className="h-48 flex flex-col justify-center gap-2 px-6">
            {["ERCOT West", "PJM ComEd", "CAISO SP15", "NYISO Zone J"].map((site, i) => (
              <div key={site} className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--color-text-muted)] w-20 truncate">{site}</span>
                <div className="flex-1 h-3 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent)] rounded-full"
                    style={{ width: `${90 - i * 15}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </PlaceholderPanel>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
        {label}
      </div>
      <div className="text-xl font-semibold text-[var(--color-text)] mt-1">
        {value}
      </div>
    </div>
  );
}
