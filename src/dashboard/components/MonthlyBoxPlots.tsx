"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import { useDashboard } from "./DashboardProvider";
import { computeMonthlyStats } from "@/lib/stats";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function MonthlyBoxPlots() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { config, matrix } = useDashboard();

  const stats = useMemo(() => {
    // Get all years for this location/market/rte/duration
    const scenarios = matrix.filter(
      (s) =>
        s.location === config.location &&
        s.market === config.market &&
        s.rte === config.rte &&
        s.duration_hours === config.durationHours
    );

    const monthlyData: Array<{ month: number; value: number }> = [];
    for (const s of scenarios) {
      for (const m of s.monthly) {
        monthlyData.push({ month: m.month, value: m.revenue / 1000 });
      }
    }

    return computeMonthlyStats(monthlyData);
  }, [matrix, config.location, config.market, config.rte, config.durationHours]);

  if (!mounted || stats.length === 0)
    return (
      <div className="h-[300px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  // IQR boxes (Q1 to Q3) as stacked bars
  const traces: Plotly.Data[] = [
    // Invisible base (0 to Q1)
    {
      type: "bar",
      x: stats.map((s) => MONTH_LABELS[s.month - 1]),
      y: stats.map((s) => s.q1),
      marker: { color: "transparent" },
      showlegend: false,
      hoverinfo: "skip",
    },
    // IQR box (Q1 to Q3)
    {
      type: "bar",
      x: stats.map((s) => MONTH_LABELS[s.month - 1]),
      y: stats.map((s) => s.q3 - s.q1),
      marker: { color: isDark ? "rgba(88,166,255,0.3)" : "rgba(9,105,218,0.2)" },
      name: "IQR (P25–P75)",
      hovertemplate: stats.map(
        (s) =>
          `${MONTH_LABELS[s.month - 1]}<br>P25: $${s.q1.toFixed(1)}K<br>P75: $${s.q3.toFixed(1)}K<extra></extra>`
      ),
    },
    // Median line
    {
      type: "scatter",
      mode: "lines+markers",
      x: stats.map((s) => MONTH_LABELS[s.month - 1]),
      y: stats.map((s) => s.median),
      name: "Median",
      marker: { color: theme.accent, size: 6 },
      line: { color: theme.accent, width: 2 },
      hovertemplate: stats.map(
        (s) => `${MONTH_LABELS[s.month - 1]}: $${s.median.toFixed(1)}K (median)<extra></extra>`
      ),
    },
    // P10 line
    {
      type: "scatter",
      mode: "lines",
      x: stats.map((s) => MONTH_LABELS[s.month - 1]),
      y: stats.map((s) => s.p10),
      name: "P10",
      line: { color: theme.breach, width: 1, dash: "dot" },
      hovertemplate: stats.map(
        (s) => `${MONTH_LABELS[s.month - 1]}: $${s.p10.toFixed(1)}K (P10)<extra></extra>`
      ),
    },
    // P90 line
    {
      type: "scatter",
      mode: "lines",
      x: stats.map((s) => MONTH_LABELS[s.month - 1]),
      y: stats.map((s) => s.p90),
      name: "P90",
      line: { color: theme.safe, width: 1, dash: "dot" },
      hovertemplate: stats.map(
        (s) => `${MONTH_LABELS[s.month - 1]}: $${s.p90.toFixed(1)}K (P90)<extra></extra>`
      ),
    },
  ];

  const layout = {
    ...baseLayout(theme, 300),
    barmode: "stack" as const,
    xaxis: {
      tickfont: { color: theme.axisColor, size: 10 },
    },
    yaxis: {
      title: { text: "Revenue ($K/mo)", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
    legend: {
      orientation: "h" as const,
      x: 0,
      y: -0.2,
      font: { size: 9, color: theme.fontColor },
      bgcolor: "transparent",
    },
  };

  return (
    <div className="plotly-chart">
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "300px" }}
        useResizeHandler
      />
    </div>
  );
}
