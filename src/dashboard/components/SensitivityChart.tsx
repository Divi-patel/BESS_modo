"use client";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SensitivityChartProps {
  rteData: Array<{ RTE: number; "$/kW/yr": number; Cycles: number }>;
  durationData: Array<{
    Duration: string;
    MWh: number;
    "$/kW/yr": number;
    Cycles: number;
  }>;
}

export function SensitivityChart({ rteData, durationData }: SensitivityChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted)
    return (
      <div className="h-[350px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  /* ---------- RTE panel ---------- */
  const rteX = rteData.map((d) => d.RTE * 100);
  const rteY = rteData.map((d) => d["$/kW/yr"]);

  const rteTraces: Plotly.Data[] = [
    {
      type: "scatter",
      mode: "text+lines+markers",
      x: rteX,
      y: rteY,
      text: rteY.map((v) => `$${v.toFixed(0)}`),
      textposition: "top center",
      textfont: { color: theme.fontColor, size: 10 },
      marker: { color: "#2ecc71", size: 7 },
      line: { color: "#2ecc71", width: 2 },
      fill: "tozeroy",
      fillcolor: "rgba(46,204,113,0.12)",
      hovertemplate: rteX.map(
        (x, i) =>
          `RTE: ${x.toFixed(0)}%<br>$${rteY[i].toFixed(1)}/kW/yr<br>Cycles: ${rteData[i].Cycles.toFixed(0)}<extra></extra>`
      ),
      showlegend: false,
    },
  ];

  const rteLayout = {
    ...baseLayout(theme, 350),
    showlegend: false,
    xaxis: {
      title: { text: "Round-Trip Efficiency (%)", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
      ticksuffix: "%",
    },
    yaxis: {
      title: { text: "$/kW/yr", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
  };

  /* ---------- Duration panel ---------- */
  const durHours = durationData.map((d) => d.MWh / 100);
  const durY = durationData.map((d) => d["$/kW/yr"]);

  const durTraces: Plotly.Data[] = [
    {
      type: "scatter",
      mode: "text+lines+markers",
      x: durHours,
      y: durY,
      text: durY.map((v) => `$${v.toFixed(0)}`),
      textposition: "top center",
      textfont: { color: theme.fontColor, size: 10 },
      marker: { color: "#3498db", size: 7 },
      line: { color: "#3498db", width: 2 },
      hovertemplate: durationData.map(
        (d, i) =>
          `Duration: ${d.Duration}<br>${d.MWh} MWh<br>$${durY[i].toFixed(1)}/kW/yr<br>Cycles: ${d.Cycles.toFixed(0)}<extra></extra>`
      ),
      showlegend: false,
    },
  ];

  const durLayout = {
    ...baseLayout(theme, 350),
    showlegend: false,
    xaxis: {
      title: { text: "Duration (hours)", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
      ticksuffix: "h",
    },
    yaxis: {
      title: { text: "$/kW/yr", font: { color: theme.axisColor, size: 11 } },
      tickfont: { color: theme.axisColor },
      gridcolor: theme.gridColor,
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="plotly-chart">
        <Plot
          data={rteTraces}
          layout={rteLayout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%", height: "350px" }}
          useResizeHandler
        />
      </div>
      <div className="plotly-chart">
        <Plot
          data={durTraces}
          layout={durLayout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%", height: "350px" }}
          useResizeHandler
        />
      </div>
    </div>
  );
}
