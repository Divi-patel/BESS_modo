"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";
import { getChartTheme, baseLayout } from "@/lib/chart-theme";
import type { BessUnit } from "@/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface BessFleetMapProps {
  units: BessUnit[];
  statusFilter: string;
}

export function BessFleetMap({ units, statusFilter }: BessFleetMapProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const filtered = useMemo(() => {
    let data = units.filter((u) => u.lat != null && u.lon != null);
    if (statusFilter !== "all") {
      data = data.filter((u) => u.status === statusFilter);
    }
    return data;
  }, [units, statusFilter]);

  if (!mounted)
    return (
      <div className="h-[500px] animate-pulse bg-[var(--color-surface-hover)] rounded" />
    );

  const isDark = resolvedTheme === "dark";
  const theme = getChartTheme(isDark);

  const maxMw = Math.max(...filtered.map((u) => u.mw ?? 0), 1);

  const traces: Plotly.Data[] = [
    {
      type: "scattergeo",
      locationmode: "USA-states",
      lat: filtered.map((u) => u.lat),
      lon: filtered.map((u) => u.lon),
      text: filtered.map(
        (u) =>
          `${u.plant_name ?? "Unknown"}<br>${u.mw ?? "?"}MW / ${u.mwh ?? "?"}MWh<br>${u.state ?? ""} · ${u.status ?? ""}`
      ),
      marker: {
        size: filtered.map((u) => Math.max(4, Math.sqrt((u.mw ?? 1) / maxMw) * 25)),
        color: filtered.map((u) => u.mwh ?? 0),
        colorscale: "Viridis",
        colorbar: {
          title: { text: "MWh", font: { color: theme.fontColor, size: 10 } },
          tickfont: { color: theme.axisColor, size: 9 },
          thickness: 12,
          len: 0.6,
        },
        line: { width: 0.5, color: isDark ? "#30363d" : "#d0d7de" },
        opacity: 0.8,
      },
      hoverinfo: "text",
    } as Plotly.Data,
  ];

  const layout = {
    ...baseLayout(theme, 500),
    showlegend: false,
    margin: { t: 0, b: 0, l: 0, r: 0 },
    geo: {
      scope: "usa",
      projection: { type: "albers usa" },
      bgcolor: theme.plotBg,
      landcolor: isDark ? "#21262d" : "#f0f0f0",
      subunitcolor: isDark ? "#30363d" : "#d0d7de",
      countrycolor: isDark ? "#30363d" : "#d0d7de",
      showlakes: true,
      lakecolor: isDark ? "#0d1117" : "#ffffff",
      showsubunits: true,
    },
  };

  return (
    <div className="plotly-chart">
      <Plot
        data={traces}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", height: "500px" }}
        useResizeHandler
      />
    </div>
  );
}
