import type { BacktestRow, RteSensitivity, DurationSensitivity, DispatchWeek, MonthlyRevenue } from "@/types";

const BASE = "/data";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`);
  return res.json();
}

export async function getBacktestSummary(): Promise<BacktestRow[]> {
  return fetchJson("backtest-summary.json");
}

export async function getRteSensitivity(): Promise<RteSensitivity[]> {
  return fetchJson("sensitivity-rte.json");
}

export async function getDurationSensitivity(): Promise<DurationSensitivity[]> {
  return fetchJson("sensitivity-duration.json");
}

export async function getDispatchWeeks(): Promise<DispatchWeek[]> {
  return fetchJson("dispatch-weeks.json");
}

export async function getMonthlyRevenue(): Promise<Record<string, MonthlyRevenue[]>> {
  return fetchJson("monthly-revenue.json");
}

// Derived data helpers
export function getHubRows(data: BacktestRow[], market: "DA" | "RT" = "RT"): BacktestRow[] {
  return data.filter(r => r.location_type === "hub" && r.market === market)
    .sort((a, b) => a.revenue_per_kw_yr - b.revenue_per_kw_yr);
}

export function getNodeRows(data: BacktestRow[]): BacktestRow[] {
  return data.filter(r => r.location_type === "node" && r.market === "RT");
}

export function getDaRtPairs(data: BacktestRow[]): Array<{
  hub: string;
  rt: number;
  da: number;
  premium_pct: number;
}> {
  const hubs = [...new Set(data.filter(r => r.location_type === "hub").map(r => r.location))];
  return hubs.map(hub => {
    const rt = data.find(r => r.location === hub && r.market === "RT")!;
    const da = data.find(r => r.location === hub && r.market === "DA")!;
    return {
      hub: hub.replace("HB_", ""),
      rt: rt.revenue_per_kw_yr,
      da: da.revenue_per_kw_yr,
      premium_pct: ((da.revenue_per_kw_yr - rt.revenue_per_kw_yr) / rt.revenue_per_kw_yr) * 100,
    };
  }).sort((a, b) => a.rt - b.rt);
}
