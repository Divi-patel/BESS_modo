"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Zap, BarChart3, Target, Download } from "lucide-react";
import { exportJson } from "@/lib/export";
import { Panel } from "@/components/Panel";
import { KpiCards } from "@/components/KpiCards";
import { HubRevenueChart } from "@/components/HubRevenueChart";
import { DaRtComparisonChart } from "@/components/DaRtComparisonChart";
import { RevenueHeatmap } from "@/components/RevenueHeatmap";
import { MonthlyBoxPlots } from "@/components/MonthlyBoxPlots";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { useDashboard } from "@/components/DashboardProvider";
import { getBacktestSummary, getHubRows, getNodeRows, getDaRtPairs } from "@/lib/data";
import type { BacktestRow } from "@/types";

const MODO_BENCHMARK = 17;

const LABEL_MAP: Record<string, string> = {
  HB_HOUSTON: "Houston",
  HB_NORTH: "North",
  HB_SOUTH: "South",
  HB_WEST: "West",
  LAMESASLR_G: "Lamesa",
  LHORN_N_U1_2: "Longhorn",
  MISAE_GEN_RN: "Misae",
  PC_NORTH_1: "Panther Creek",
  SWEC_G1: "Stanton",
};

export default function OverviewPage() {
  const { config, currentScenario, matrix } = useDashboard();
  const [rows, setRows] = useState<BacktestRow[] | null>(null);

  useEffect(() => {
    getBacktestSummary().then(setRows);
  }, []);

  // Rankings: where does current config rank among all scenarios for this location?
  const rank = useMemo(() => {
    if (!currentScenario || matrix.length === 0) return null;
    const locationScenarios = matrix
      .filter((s) => s.location === config.location && s.market === config.market)
      .sort((a, b) => b.revenue_per_kw_yr - a.revenue_per_kw_yr);
    if (locationScenarios.length === 0) return null;
    const idx = locationScenarios.findIndex(
      (s) => s.revenue_per_kw_yr <= (currentScenario?.revenue_per_kw_yr ?? 0)
    );
    const pos = idx === -1 ? locationScenarios.length : idx + 1;
    const pct = Math.round((pos / locationScenarios.length) * 100);
    return { pos, total: locationScenarios.length, pct };
  }, [matrix, config, currentScenario]);

  // Revenue range across all scenarios
  const revenueRange = useMemo(() => {
    if (matrix.length === 0) return null;
    const revs = matrix.map((s) => s.revenue_per_kw_yr);
    return { min: Math.min(...revs), max: Math.max(...revs) };
  }, [matrix]);

  if (!rows) {
    return (
      <div className="max-w-6xl space-y-4">
        <div className="h-24 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
        <div className="h-[380px] animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
      </div>
    );
  }

  const hubRows = getHubRows(rows, "RT");
  const nodeRows = getNodeRows(rows);
  const daRtPairs = getDaRtPairs(rows);

  // Use scenario matrix data if available, otherwise fall back to static data
  const revenue = currentScenario?.revenue_per_kw_yr;
  const cycles = currentScenario?.total_cycles;

  const bestHub = hubRows.reduce((best, r) =>
    r.revenue_per_kw_yr > best.revenue_per_kw_yr ? r : best, hubRows[0]);
  const bestNode = nodeRows.reduce((best, r) =>
    r.revenue_per_kw_yr > best.revenue_per_kw_yr ? r : best, nodeRows[0]);

  const hubWestRev = rows.find(r => r.location === "HB_WEST" && r.market === "RT")?.revenue_per_kw_yr ?? 0;
  const avgBasis =
    nodeRows.reduce((sum, n) => sum + ((n.revenue_per_kw_yr - hubWestRev) / hubWestRev) * 100, 0) / nodeRows.length;
  const captureRate = (MODO_BENCHMARK / bestHub.revenue_per_kw_yr) * 100;

  const kpiItems = [
    {
      label: revenue ? "Selected Config" : "Best Hub",
      value: revenue ? `$${revenue.toFixed(1)}/kW/yr` : `$${bestHub.revenue_per_kw_yr.toFixed(1)}/kW/yr`,
      sub: revenue
        ? `${LABEL_MAP[config.location] ?? config.location} · ${config.year}${rank ? ` · top ${rank.pct}%` : ""}`
        : `${bestHub.location.replace("HB_", "")} (#1 of ${hubRows.length} hubs)`,
      color: "green" as const,
      icon: <TrendingUp size={16} />,
    },
    {
      label: cycles ? "Annual Cycles" : "Best Node",
      value: cycles ? cycles.toFixed(1) : `$${bestNode.revenue_per_kw_yr.toFixed(1)}/kW/yr`,
      sub: cycles
        ? `${config.durationHours}h · ${(config.rte * 100).toFixed(0)}% RTE`
        : `${bestNode.site ?? bestNode.location} (#1 of ${nodeRows.length} nodes)`,
      color: "blue" as const,
      icon: <Zap size={16} />,
    },
    {
      label: "Avg Basis Premium",
      value: `+${avgBasis.toFixed(1)}%`,
      sub: `${nodeRows.length} nodes vs West Hub`,
      color: "amber" as const,
      icon: <BarChart3 size={16} />,
    },
    {
      label: "Capture Rate",
      value: `${captureRate.toFixed(1)}%`,
      sub: `Modo benchmark $${MODO_BENCHMARK}/kW/yr`,
      color: "red" as const,
      icon: <Target size={16} />,
    },
  ];

  const hasMatrix = matrix.length > 0;

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            Overview
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            BESS energy arbitrage analysis &middot; ERCOT
            {revenueRange && (
              <span className="ml-1">
                &middot; ${revenueRange.min.toFixed(0)}–${revenueRange.max.toFixed(0)}/kW/yr range
              </span>
            )}
            {currentScenario && (
              <span className="ml-2 text-[var(--color-accent)]">
                {LABEL_MAP[config.location]} &middot; {config.market} &middot; {config.year} &middot;
                {(config.rte * 100).toFixed(0)}% RTE &middot; {config.durationHours}h
              </span>
            )}
          </p>
        </div>
        {currentScenario && (
          <button
            onClick={() =>
              exportJson(
                { config, scenario: currentScenario },
                `bess-${config.location}-${config.market}-${config.year}.json`
              )
            }
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] rounded-md bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors border border-[var(--color-border-subtle)]"
          >
            <Download size={11} />
            Export
          </button>
        )}
      </div>

      <KpiCards items={kpiItems} />

      {/* New: Revenue Heatmap and Monthly Box Plots */}
      {hasMatrix && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Revenue by Location & Month" subtitle="Monthly revenue across all locations for selected config">
            <RevenueHeatmap />
          </Panel>
          <Panel title="Monthly Revenue Distribution" subtitle="Seasonal patterns across all available years">
            <MonthlyBoxPlots />
          </Panel>
        </div>
      )}

      {/* Wrap static charts in collapsible */}
      <CollapsiblePanel title="DA vs RT Comparison" subtitle="Hub revenue and market comparison">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Hub Arbitrage Revenue (RT, 2024)">
            <HubRevenueChart data={hubRows} />
          </Panel>
          <Panel title="DA vs RT Market Comparison">
            <DaRtComparisonChart data={daRtPairs} />
          </Panel>
        </div>
      </CollapsiblePanel>

      {/* Bankable Revenue Forecast — Gen 1-5 Vision */}
      <PlaceholderPanel
        title="Bankable Revenue Forecast"
        description="Full-stack output combining energy arbitrage, ancillary services, capacity payments, degradation modeling, and Monte Carlo risk quantification. The end goal: a lender-ready revenue projection with P50/P90 confidence bands."
        gen={5}
      >
        <div className="h-40 flex items-end gap-1 px-8 pb-4">
          {[45, 52, 58, 62, 55, 48, 65, 72, 68, 60, 55, 50].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-stretch gap-0.5">
              <div className="bg-[var(--color-accent)]/30 rounded-t" style={{ height: `${v * 0.3}%` }} />
              <div className="bg-[var(--color-accent)] rounded-t" style={{ height: `${v * 0.7}%` }} />
            </div>
          ))}
        </div>
      </PlaceholderPanel>

      {/* Summary bar */}
      <div className="text-[10px] text-[var(--color-text-muted)] text-center py-2">
        {matrix.length.toLocaleString()} scenarios &middot; 9 locations &middot; 15 years &middot;
        Perfect foresight &middot; 100 MW / {config.durationHours * 100} MWh LFP &middot;
        {(config.rte * 100).toFixed(0)}% RTE &middot; ERCOT {config.year}
      </div>
    </div>
  );
}
