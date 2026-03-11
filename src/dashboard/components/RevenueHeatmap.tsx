"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import { useDashboard } from "./DashboardProvider";
import { EmptyState } from "./EmptyState";
import { getLocationSlice } from "@/lib/scenario-matrix";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const LOCATION_LABELS: Record<string, string> = {
  HB_HOUSTON: "Houston",
  HB_NORTH: "North",
  HB_SOUTH: "South",
  HB_WEST: "West",
  LAMESASLR_G: "Lamesa",
  LHORN_N_U1_2: "Longhorn",
  MISAE_GEN_RN: "Misae",
  PC_NORTH_1: "Panther Ck",
  SWEC_G1: "Stanton",
};

export function RevenueHeatmap() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { config, matrix } = useDashboard();

  const { zData, locationNames } = useMemo(() => {
    const slice = getLocationSlice(
      matrix,
      config.market,
      config.year,
      config.rte,
      config.durationHours
    );

    if (slice.length === 0) return { zData: [], locationNames: [] };

    const locations = slice.map((s) => s.location);
    const names = locations.map((l) => LOCATION_LABELS[l] ?? l);
    const z: number[][] = [];

    for (const scenario of slice) {
      const row = new Array(12).fill(0);
      for (const m of scenario.monthly) {
        row[m.month - 1] = m.revenue / 1000; // Convert to $K
      }
      z.push(row);
    }

    return { zData: z, locationNames: names };
  }, [matrix, config.market, config.year, config.rte, config.durationHours]);

  if (!mounted)
    return (
      <div className="h-[350px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  if (zData.length === 0)
    return (
      <EmptyState
        message={`No revenue data for ${config.market} / ${config.year}`}
        detail="Adjust market or year in the sidebar. Some year-location combinations may not have data."
        height="h-[350px]"
      />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const traces: Plotly.Data[] = [
    {
      type: "heatmap",
      x: MONTH_LABELS,
      y: locationNames,
      z: zData,
      colorscale: "YlGn",
      hovertemplate:
        "%{y} · %{x}<br>$%{z:.1f}K revenue<extra></extra>",
      showscale: true,
      colorbar: {
        title: { text: "$K/mo", font: { color: theme.fontColor, size: 10 } },
        tickfont: { color: theme.axisColor, size: 9 },
        thickness: 12,
        len: 0.8,
      },
    },
  ];

  const layout = {
    ...baseLayout(theme, 350),
    showlegend: false,
    margin: { t: 10, b: 40, l: 80, r: 60 },
    xaxis: {
      tickfont: { color: theme.axisColor, size: 10 },
      side: "bottom" as const,
    },
    yaxis: {
      tickfont: { color: theme.axisColor, size: 10 },
      autorange: "reversed" as const,
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
