"use client";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import { HUB_COLORS } from "@/lib/constants";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface HubRevenueChartProps {
  data: Array<{ location: string; revenue_per_kw_yr: number; total_cycles: number }>;
}

export function HubRevenueChart({ data }: HubRevenueChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div className="h-[380px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const hubs = data.map((d) => d.location.replace("HB_", ""));
  const revenues = data.map((d) => d.revenue_per_kw_yr);
  const cycles = data.map((d) => d.total_cycles);
  const colors = hubs.map((h) => HUB_COLORS[h] ?? theme.accent);

  const traces: Plotly.Data[] = [
    {
      type: "bar",
      x: hubs,
      y: revenues,
      marker: { color: colors },
      text: revenues.map((r) => `$${r.toFixed(0)}`),
      textposition: "outside",
      textfont: { color: theme.fontColor, size: 11 },
      hovertemplate: hubs.map(
        (h, i) =>
          `<b>${h}</b><br>Revenue: $${revenues[i].toFixed(1)}/kW/yr<br>Cycles: ${cycles[i].toFixed(0)}<extra></extra>`
      ),
      showlegend: false,
    },
  ];

  const layout = {
    ...baseLayout(theme, 380),
    xaxis: {
      tickfont: { color: theme.axisColor },
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
        x1: hubs.length - 0.5,
        y0: 17,
        y1: 17,
        line: { color: theme.breach, width: 2, dash: "dash" as const },
      },
    ],
    annotations: [
      {
        x: hubs[hubs.length - 1],
        y: 17,
        text: "Modo BESS Index ~$17/kW/yr",
        showarrow: false,
        xanchor: "right" as const,
        yanchor: "bottom" as const,
        font: { color: theme.breach, size: 10 },
      },
    ],
    showlegend: false,
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
