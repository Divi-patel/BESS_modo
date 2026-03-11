export function getChartTheme(isDark: boolean) {
  return {
    paperBg: isDark ? "#161b22" : "#ffffff",
    plotBg: isDark ? "#0d1117" : "#fafbfc",
    fontColor: isDark ? "#e6edf3" : "#1f2328",
    gridColor: isDark ? "#21262d" : "#e8eaed",
    axisColor: isDark ? "#8b949e" : "#656d76",
    accent: isDark ? "#58a6ff" : "#0969da",
    safe: isDark ? "#3fb950" : "#1a7f37",
    breach: isDark ? "#f85149" : "#cf222e",
    warning: isDark ? "#d29922" : "#9a6700",
  };
}

export function baseLayout(theme: ReturnType<typeof getChartTheme>, height = 380) {
  return {
    paper_bgcolor: theme.paperBg,
    plot_bgcolor: theme.plotBg,
    height,
    margin: { t: 20, b: 48, l: 60, r: 20 },
    font: {
      family: "JetBrains Mono, Menlo, monospace",
      color: theme.fontColor,
      size: 11,
    },
    hoverlabel: {
      bgcolor: theme.paperBg,
      bordercolor: theme.gridColor,
      font: { color: theme.fontColor, size: 11 },
    },
    showlegend: true,
    legend: {
      orientation: "h" as const,
      x: 0,
      y: -0.18,
      font: { size: 10, color: theme.fontColor },
      bgcolor: "transparent",
    },
  };
}
