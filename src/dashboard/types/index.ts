/* ── Existing types (unchanged) ────────────────────────────────────────────── */

export interface BacktestRow {
  location: string;
  location_type: "hub" | "node";
  market: "DA" | "RT";
  annual_revenue_usd: number;
  revenue_per_kw_yr: number;
  total_cycles: number;
  months: number;
  site?: string | null;
  site_type?: string | null;
  site_mw?: number | null;
}

export interface RteSensitivity {
  RTE: number;
  "$/kW/yr": number;
  Cycles: number;
}

export interface DurationSensitivity {
  Duration: string;
  MWh: number;
  "$/kW/yr": number;
  Cycles: number;
}

export interface DispatchWeek {
  label: string;
  location: string;
  timestamps: string[];
  prices: number[];
  p_charge: number[];
  p_discharge: number[];
  soc: number[];
  revenue: number;
  cycles: number;
  avg_spread: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue_k: number;
}

/* ── New types for enhanced dashboard ─────────────────────────────────────── */

export interface BessConfig {
  location: string;
  market: "DA" | "RT";
  year: number;
  rte: number;
  durationHours: number;
  displayUnit: "kw_yr" | "mwh";
}

export interface ScenarioMonthly {
  month: number;
  revenue: number;
  cycles: number;
}

export interface ScenarioResult {
  location: string;
  market: string;
  year: number;
  rte: number;
  duration_hours: number;
  annual_revenue: number;
  revenue_per_kw_yr: number;
  total_cycles: number;
  monthly: ScenarioMonthly[];
}

export interface ScenarioMeta {
  locations: string[];
  markets: string[];
  years: number[];
  rte_values: number[];
  duration_hours: number[];
  total_scenarios: number;
  power_mw: number;
}

export interface PriceStat {
  location: string;
  market: string;
  year: number;
  month: number;
  count: number;
  mean: number;
  std: number;
  min: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  max: number;
}

export interface PriceDurationCurve {
  location: string;
  market: string;
  year: number;
  hours: number;
  prices: number[];
}

export interface BessUnit {
  plant_name: string | null;
  entity_name: string | null;
  state: string | null;
  county: string | null;
  lat: number | null;
  lon: number | null;
  mw: number | null;
  mwh: number | null;
  status: string | null;
  operating_year: number | null;
  technology: string | null;
  duration_hours: number | null;
  capabilities: string[];
}
