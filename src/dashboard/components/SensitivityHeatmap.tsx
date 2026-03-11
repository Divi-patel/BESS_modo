"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import { useDashboard } from "./DashboardProvider";
import { EmptyState } from "./EmptyState";
import { getHeatmapSlice } from "@/lib/scenario-matrix";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export function SensitivityHeatmap() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { config, matrix } = useDashboard();

  const { zData, rteValues, durValues, annotations } = useMemo(() => {
    const slice = getHeatmapSlice(matrix, config.location, config.market, config.year);
    if (slice.length === 0)
      return { zData: [], rteValues: [], durValues: [], annotations: [] };

    const rtes = [...new Set(slice.map((s) => s.rte))].sort((a, b) => a - b);
    const durs = [...new Set(slice.map((s) => s.duration_hours))].sort((a, b) => a - b);

    // Build 2D matrix: rows = RTE, cols = Duration
    const z: number[][] = [];
    const annots: Array<{ x: number; y: number; text: string }> = [];

    for (const rte of rtes) {
      const row: number[] = [];
      for (const dur of durs) {
        const s = slice.find((s) => s.rte === rte && s.duration_hours === dur);
        const val = s?.revenue_per_kw_yr ?? 0;
        row.push(val);
        annots.push({
          x: dur,
          y: rte * 100,
          text: `$${val.toFixed(0)}`,
        });
      }
      z.push(row);
    }

    return {
      zData: z,
      rteValues: rtes.map((r) => r * 100),
      durValues: durs,
      annotations: annots,
    };
  }, [matrix, config.location, config.market, config.year]);

  if (!mounted)
    return (
      <div className="h-[400px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  if (zData.length === 0) {
    return (
      <EmptyState
        message={`No scenario data for ${config.location} / ${config.market} / ${config.year}`}
        detail="Try a different location, market, or year. Hub locations have data from 2010–2025; resource nodes may have shorter ranges."
        height="h-[400px]"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const traces: Plotly.Data[] = [
    {
      type: "heatmap",
      x: durValues,
      y: rteValues,
      z: zData,
      colorscale: [
        [0, isDark ? "#1a1a2e" : "#fff3e0"],
        [0.25, isDark ? "#16213e" : "#ffe0b2"],
        [0.5, isDark ? "#0f3460" : "#ffb74d"],
        [0.75, isDark ? "#1a7f37" : "#66bb6a"],
        [1, isDark ? "#3fb950" : "#2e7d32"],
      ],
      hovertemplate:
        "Duration: %{x}h<br>RTE: %{y:.0f}%<br>Revenue: $%{z:.1f}/kW/yr<extra></extra>",
      showscale: true,
      colorbar: {
        title: { text: "$/kW/yr", font: { color: theme.fontColor, size: 10 } },
        tickfont: { color: theme.axisColor, size: 9 },
        thickness: 12,
        len: 0.8,
      },
    },
  ];

  // Add crosshair marker at current config
  const crosshairTraces: Plotly.Data[] = [
    {
      type: "scatter",
      x: [config.durationHours],
      y: [config.rte * 100],
      mode: "markers",
      marker: {
        size: 16,
        color: "transparent",
        line: { color: isDark ? "#ffffff" : "#000000", width: 2.5 },
        symbol: "circle-open",
      },
      hoverinfo: "skip",
      showlegend: false,
    },
  ];

  const layout = {
    ...baseLayout(theme, 400),
    showlegend: false,
    xaxis: {
      title: { text: "Duration (hours)", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
      tickvals: durValues,
      ticktext: durValues.map((d) => `${d}h`),
    },
    yaxis: {
      title: { text: "Round-Trip Efficiency (%)", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
      ticksuffix: "%",
    },
    annotations: annotations.map((a) => ({
      x: a.x,
      y: a.y,
      text: a.text,
      showarrow: false,
      font: {
        color: theme.fontColor,
        size: 9,
        family: "JetBrains Mono, monospace",
      },
    })),
  };

  return (
    <div className="plotly-chart">
      <Plot
        data={[...traces, ...crosshairTraces]}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "400px" }}
        useResizeHandler
      />
    </div>
  );
}
