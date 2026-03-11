"use client";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface BasisChartProps {
  hubRevenue: number;
  nodes: Array<{ site: string; revenue_per_kw_yr: number; basis_pct: number }>;
}

export function BasisChart({ hubRevenue, nodes }: BasisChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div className="h-[420px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const sites = nodes.map((n) => n.site);
  const nodeRevs = nodes.map((n) => n.revenue_per_kw_yr);

  const traces: Plotly.Data[] = [
    {
      type: "bar",
      name: "Hub (HB_WEST)",
      x: sites,
      y: sites.map(() => hubRevenue),
      marker: { color: "#3498db" },
      text: sites.map(() => `$${hubRevenue.toFixed(0)}`),
      textposition: "outside",
      textfont: { color: theme.fontColor, size: 10 },
      hovertemplate: sites.map(
        (s) => `<b>${s} — Hub</b><br>$${hubRevenue.toFixed(1)}/kW/yr<extra></extra>`
      ),
    },
    {
      type: "bar",
      name: "Resource Node",
      x: sites,
      y: nodeRevs,
      marker: { color: "#e07c5a" },
      text: nodeRevs.map((v) => `$${v.toFixed(0)}`),
      textposition: "outside",
      textfont: { color: theme.fontColor, size: 10 },
      hovertemplate: nodes.map(
        (n) =>
          `<b>${n.site} — Node</b><br>$${n.revenue_per_kw_yr.toFixed(1)}/kW/yr<br>Basis: ${n.basis_pct > 0 ? "+" : ""}${n.basis_pct.toFixed(1)}%<extra></extra>`
      ),
    },
  ];

  const annotations = nodes.map((n) => ({
    x: n.site,
    y: n.revenue_per_kw_yr,
    text: `${n.basis_pct > 0 ? "+" : ""}${n.basis_pct.toFixed(1)}%`,
    showarrow: false,
    yshift: 22,
    font: {
      color: n.basis_pct >= 0 ? "#2ecc71" : "#e74c3c",
      size: 10,
      family: "JetBrains Mono, monospace",
    },
  }));

  const layout = {
    ...baseLayout(theme, 420),
    barmode: "group" as const,
    xaxis: {
      tickfont: { color: theme.axisColor },
      tickangle: -30,
      gridcolor: theme.gridColor,
    },
    yaxis: {
      title: { text: "$/kW/yr", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
    shapes: [
      {
        type: "line" as const,
        x0: -0.5,
        x1: sites.length - 0.5,
        y0: 17,
        y1: 17,
        line: { color: theme.axisColor, width: 1.5, dash: "dash" as const },
      },
    ],
    annotations: [
      ...annotations,
      {
        x: sites[sites.length - 1],
        y: 17,
        text: "Modo ~$17",
        showarrow: false,
        xanchor: "right" as const,
        yanchor: "bottom" as const,
        font: { color: theme.axisColor, size: 9 },
      },
    ],
  };

  return (
    <div className="plotly-chart">
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "420px" }}
        useResizeHandler
      />
    </div>
  );
}
