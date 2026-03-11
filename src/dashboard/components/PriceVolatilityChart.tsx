"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import { useDashboard } from "./DashboardProvider";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const LABEL_MAP: Record<string, string> = {
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

export function PriceVolatilityChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { config, priceStats } = useDashboard();

  const volatilityData = useMemo(() => {
    // Get annual average std per location for the selected year+market
    const filtered = priceStats.filter(
      (s) => s.market === config.market && s.year === config.year
    );

    const byLocation = new Map<string, number[]>();
    for (const s of filtered) {
      if (!byLocation.has(s.location)) byLocation.set(s.location, []);
      byLocation.get(s.location)!.push(s.std);
    }

    return [...byLocation.entries()]
      .map(([location, stds]) => ({
        location,
        label: LABEL_MAP[location] ?? location,
        avgStd: stds.reduce((a, b) => a + b, 0) / stds.length,
      }))
      .sort((a, b) => b.avgStd - a.avgStd);
  }, [priceStats, config.market, config.year]);

  if (!mounted || volatilityData.length === 0)
    return (
      <div className="h-[300px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const isSelected = volatilityData.map((d) => d.location === config.location);
  const barColors = volatilityData.map((d) =>
    d.location === config.location
      ? theme.accent
      : isDark
      ? "rgba(88,166,255,0.25)"
      : "rgba(9,105,218,0.2)"
  );

  const traces: Plotly.Data[] = [
    {
      type: "bar",
      x: volatilityData.map((d) => d.label),
      y: volatilityData.map((d) => d.avgStd),
      marker: {
        color: barColors,
        line: {
          color: isSelected.map((s) =>
            s ? theme.accent : "transparent"
          ),
          width: isSelected.map((s) => (s ? 2 : 0)),
        },
      },
      text: volatilityData.map((d) => `$${d.avgStd.toFixed(1)}`),
      textposition: "outside" as const,
      textfont: { color: theme.fontColor, size: 9 },
      hovertemplate: volatilityData.map(
        (d) => `${d.label}<br>Avg Std Dev: $${d.avgStd.toFixed(2)}/MWh<extra></extra>`
      ),
      showlegend: false,
    },
  ];

  const layout = {
    ...baseLayout(theme, 300),
    showlegend: false,
    xaxis: {
      tickfont: { color: theme.axisColor, size: 10 },
      tickangle: -30,
    },
    yaxis: {
      title: { text: "Avg Price Std Dev ($/MWh)", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
      tickprefix: "$",
    },
    margin: { t: 20, b: 60, l: 60, r: 20 },
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
