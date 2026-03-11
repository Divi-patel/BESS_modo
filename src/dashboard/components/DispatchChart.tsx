"use client";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import type { DispatchWeek } from "@/types";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface DispatchChartProps {
  week: DispatchWeek;
}

export function DispatchChart({ week }: DispatchChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div className="h-[650px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const ts = week.timestamps;
  const netPower = week.p_discharge.map((d, i) => d - week.p_charge[i]);
  const barColors = netPower.map((v) => (v >= 0 ? "#2ecc71" : "#e74c3c"));

  const socMin = 20;
  const socMax = 380;

  /* ---------- Panel 1: Prices ---------- */
  const priceTraces: Plotly.Data[] = [
    {
      type: "scatter",
      mode: "lines",
      x: ts,
      y: week.prices,
      line: { color: theme.accent, width: 1.5 },
      fill: "tozeroy",
      fillcolor: isDark ? "rgba(88,166,255,0.08)" : "rgba(9,105,218,0.06)",
      hovertemplate: "%{x}<br>$%{y:.1f}/MWh<extra></extra>",
      showlegend: false,
    },
  ];

  const priceLayout = {
    ...baseLayout(theme, 250),
    showlegend: false,
    margin: { t: 30, b: 10, l: 60, r: 20 },
    title: {
      text: week.label,
      font: { color: theme.fontColor, size: 12 },
      x: 0.01,
      xanchor: "left" as const,
    },
    xaxis: {
      showticklabels: false,
      gridcolor: theme.gridColor,
    },
    yaxis: {
      title: { text: "$/MWh", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
  };

  /* ---------- Panel 2: Net Power ---------- */
  const powerTraces: Plotly.Data[] = [
    {
      type: "bar",
      x: ts,
      y: netPower,
      marker: { color: barColors },
      hovertemplate: "%{x}<br>%{y:.0f} MW<extra></extra>",
      showlegend: false,
    },
  ];

  const powerLayout = {
    ...baseLayout(theme, 200),
    showlegend: false,
    margin: { t: 10, b: 10, l: 60, r: 20 },
    xaxis: {
      showticklabels: false,
      gridcolor: theme.gridColor,
    },
    yaxis: {
      title: { text: "MW", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
  };

  /* ---------- Panel 3: SOC ---------- */
  const socTraces: Plotly.Data[] = [
    {
      type: "scatter",
      mode: "lines",
      x: ts,
      y: week.soc,
      line: { color: "#3498db", width: 2 },
      hovertemplate: "%{x}<br>%{y:.0f} MWh<extra></extra>",
      showlegend: false,
    },
  ];

  const socLayout = {
    ...baseLayout(theme, 200),
    showlegend: false,
    margin: { t: 10, b: 48, l: 60, r: 20 },
    xaxis: {
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
      tickformat: "%a %H:%M",
    },
    yaxis: {
      title: { text: "MWh", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
    shapes: [
      {
        type: "line" as const,
        x0: ts[0],
        x1: ts[ts.length - 1],
        y0: socMin,
        y1: socMin,
        line: { color: "#e74c3c", width: 1.5, dash: "dash" as const },
      },
      {
        type: "line" as const,
        x0: ts[0],
        x1: ts[ts.length - 1],
        y0: socMax,
        y1: socMax,
        line: { color: "#e74c3c", width: 1.5, dash: "dash" as const },
      },
    ],
    annotations: [
      {
        x: ts[0],
        y: socMin,
        text: `Min ${socMin}`,
        showarrow: false,
        xanchor: "left" as const,
        yanchor: "top" as const,
        font: { color: "#e74c3c", size: 9 },
      },
      {
        x: ts[0],
        y: socMax,
        text: `Max ${socMax}`,
        showarrow: false,
        xanchor: "left" as const,
        yanchor: "bottom" as const,
        font: { color: "#e74c3c", size: 9 },
      },
    ],
  };

  /* ---------- Computed metrics ---------- */
  const totalChargeIn = week.p_charge.reduce((s, v) => s + v, 0); // MWh in (1h intervals)
  const totalDischargeOut = week.p_discharge.reduce((s, v) => s + v, 0);
  const effectiveRte = totalChargeIn > 0 ? ((totalDischargeOut / totalChargeIn) * 100).toFixed(1) : "—";

  const plotConfig = { displayModeBar: false, responsive: true } as const;

  return (
    <div className="flex flex-col gap-0">
      {/* Efficiency annotation */}
      <div className="flex gap-4 px-3 py-1.5 text-[10px] text-[var(--color-text-muted)]">
        <span>{totalChargeIn.toFixed(0)} MWh in → {totalDischargeOut.toFixed(0)} MWh out ({effectiveRte}% effective RTE)</span>
        <span>{week.cycles.toFixed(1)} cycles this week</span>
      </div>
      <div className="plotly-chart">
        <Plot
          data={priceTraces}
          layout={priceLayout}
          config={plotConfig}
          style={{ width: "100%", height: "250px" }}
          useResizeHandler
        />
      </div>
      <div className="plotly-chart">
        <Plot
          data={powerTraces}
          layout={powerLayout}
          config={plotConfig}
          style={{ width: "100%", height: "200px" }}
          useResizeHandler
        />
      </div>
      <div className="plotly-chart">
        <Plot
          data={socTraces}
          layout={socLayout}
          config={plotConfig}
          style={{ width: "100%", height: "200px" }}
          useResizeHandler
        />
      </div>
    </div>
  );
}
