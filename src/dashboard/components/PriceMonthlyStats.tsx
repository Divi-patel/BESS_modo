"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import { useDashboard } from "./DashboardProvider";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function PriceMonthlyStats() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { config, priceStats } = useDashboard();

  const monthlyData = useMemo(() => {
    return priceStats
      .filter(
        (s) =>
          s.location === config.location &&
          s.market === config.market &&
          s.year === config.year
      )
      .sort((a, b) => a.month - b.month);
  }, [priceStats, config.location, config.market, config.year]);

  if (!mounted || monthlyData.length === 0)
    return (
      <div className="h-[350px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const months = monthlyData.map((d) => MONTH_LABELS[d.month - 1]);

  const traces: Plotly.Data[] = [
    // P10-P90 band
    {
      type: "scatter",
      x: months,
      y: monthlyData.map((d) => d.p90),
      mode: "lines",
      line: { width: 0 },
      showlegend: false,
      hoverinfo: "skip",
    },
    {
      type: "scatter",
      x: months,
      y: monthlyData.map((d) => d.p10),
      mode: "lines",
      line: { width: 0 },
      fill: "tonexty",
      fillcolor: isDark ? "rgba(88,166,255,0.1)" : "rgba(9,105,218,0.08)",
      name: "P10–P90",
      hoverinfo: "skip",
    },
    // P25-P75 band
    {
      type: "scatter",
      x: months,
      y: monthlyData.map((d) => d.p75),
      mode: "lines",
      line: { width: 0 },
      showlegend: false,
      hoverinfo: "skip",
    },
    {
      type: "scatter",
      x: months,
      y: monthlyData.map((d) => d.p25),
      mode: "lines",
      line: { width: 0 },
      fill: "tonexty",
      fillcolor: isDark ? "rgba(88,166,255,0.2)" : "rgba(9,105,218,0.15)",
      name: "IQR",
      hoverinfo: "skip",
    },
    // Median
    {
      type: "scatter",
      mode: "lines+markers",
      x: months,
      y: monthlyData.map((d) => d.p50),
      name: "Median",
      marker: { color: theme.accent, size: 5 },
      line: { color: theme.accent, width: 2 },
      hovertemplate: monthlyData.map(
        (d) =>
          `${MONTH_LABELS[d.month - 1]}<br>` +
          `Median: $${d.p50.toFixed(1)}<br>` +
          `P10: $${d.p10.toFixed(1)} · P90: $${d.p90.toFixed(1)}<br>` +
          `Std: $${d.std.toFixed(1)}<extra></extra>`
      ),
    },
    // Mean as dashed
    {
      type: "scatter",
      mode: "lines",
      x: months,
      y: monthlyData.map((d) => d.mean),
      name: "Mean",
      line: { color: theme.warning, width: 1.5, dash: "dash" },
      hovertemplate: monthlyData.map(
        (d) => `${MONTH_LABELS[d.month - 1]}: $${d.mean.toFixed(1)} (mean)<extra></extra>`
      ),
    },
  ];

  const layout = {
    ...baseLayout(theme, 350),
    xaxis: {
      tickfont: { color: theme.axisColor, size: 10 },
    },
    yaxis: {
      title: { text: "Price ($/MWh)", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
      tickprefix: "$",
    },
    legend: {
      orientation: "h" as const,
      x: 0,
      y: -0.18,
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
        style={{ width: "100%", height: "350px" }}
        useResizeHandler
      />
    </div>
  );
}
