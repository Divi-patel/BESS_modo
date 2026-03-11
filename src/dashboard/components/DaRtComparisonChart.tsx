"use client";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface DaRtComparisonChartProps {
  data: Array<{ hub: string; rt: number; da: number; premium_pct: number }>;
}

export function DaRtComparisonChart({ data }: DaRtComparisonChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div className="h-[380px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const hubs = data.map((d) => d.hub);
  const rtVals = data.map((d) => d.rt);
  const daVals = data.map((d) => d.da);

  const traces: Plotly.Data[] = [
    {
      type: "bar",
      name: "RT",
      x: hubs,
      y: rtVals,
      marker: { color: "#e74c3c" },
      text: rtVals.map((v) => `$${v.toFixed(0)}`),
      textposition: "outside",
      textfont: { color: theme.fontColor, size: 10 },
      hovertemplate: hubs.map(
        (h, i) => `<b>${h} RT</b><br>$${rtVals[i].toFixed(1)}/kW/yr<extra></extra>`
      ),
    },
    {
      type: "bar",
      name: "DA",
      x: hubs,
      y: daVals,
      marker: { color: "#3498db" },
      text: daVals.map((v) => `$${v.toFixed(0)}`),
      textposition: "outside",
      textfont: { color: theme.fontColor, size: 10 },
      hovertemplate: hubs.map(
        (h, i) => `<b>${h} DA</b><br>$${daVals[i].toFixed(1)}/kW/yr<extra></extra>`
      ),
    },
  ];

  const annotations = data.map((d) => ({
    x: d.hub,
    y: d.da,
    text: `${d.premium_pct > 0 ? "+" : ""}${d.premium_pct.toFixed(0)}%`,
    showarrow: false,
    yshift: 20,
    font: { color: "#e74c3c", size: 10, family: "JetBrains Mono, monospace" },
  }));

  const layout = {
    ...baseLayout(theme, 380),
    barmode: "group" as const,
    xaxis: {
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
    yaxis: {
      title: { text: "$/kW/yr", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
    annotations,
  };

  return (
    <div className="plotly-chart">
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "380px" }}
        useResizeHandler
      />
    </div>
  );
}
