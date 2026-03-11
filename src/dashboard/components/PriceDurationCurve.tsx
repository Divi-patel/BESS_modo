"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import { useDashboard } from "./DashboardProvider";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const COLORS = ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c"];

export function PriceDurationCurve() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { config, priceCurves } = useDashboard();

  // Show all locations for the selected market+year
  const curves = useMemo(() => {
    return priceCurves.filter(
      (c) => c.market === config.market && c.year === config.year
    );
  }, [priceCurves, config.market, config.year]);

  if (!mounted)
    return (
      <div className="h-[400px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

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

  const traces: Plotly.Data[] = curves.map((curve, i) => {
    const n = curve.prices.length;
    const x = curve.prices.map((_, j) => (j / (n - 1)) * 100);

    return {
      type: "scatter",
      mode: "lines",
      x,
      y: curve.prices,
      name: LABEL_MAP[curve.location] ?? curve.location,
      line: {
        color: COLORS[i % COLORS.length],
        width: curve.location === config.location ? 2.5 : 1.5,
      },
      opacity: curve.location === config.location ? 1 : 0.5,
      fill: curve.location === config.location ? ("tozeroy" as const) : undefined,
      fillcolor:
        curve.location === config.location
          ? `${COLORS[i % COLORS.length]}15`
          : undefined,
      hovertemplate: `${LABEL_MAP[curve.location]}<br>Hour %{x:.0f}%: $%{y:.1f}/MWh<extra></extra>`,
    };
  });

  const layout = {
    ...baseLayout(theme, 400),
    xaxis: {
      title: { text: "% of Hours", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
      ticksuffix: "%",
      range: [0, 100],
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
      y: -0.15,
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
        style={{ width: "100%", height: "400px" }}
        useResizeHandler
      />
    </div>
  );
}
