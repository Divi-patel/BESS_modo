export const BESS_CONFIG = {
  power_mw: 100,
  energy_mwh: 400,
  rte: 0.87,
  soc_min_pct: 5,
  soc_max_pct: 95,
  duration_hours: 4,
  backtest_year: 2024,
};

export const HUB_COLORS: Record<string, string> = {
  HOUSTON: "#e74c3c",
  NORTH: "#3498db",
  SOUTH: "#2ecc71",
  WEST: "#f39c12",
};

export const SITE_META: Record<string, { label: string; type: string; mw: number; node: string }> = {
  lamesa_solar: { label: "Lamesa Solar", type: "Solar", mw: 102, node: "LAMESASLR_G" },
  misae_solar: { label: "Misae Solar", type: "Solar", mw: 240, node: "MISAE_GEN_RN" },
  longhorn_wind: { label: "Longhorn Wind", type: "Wind", mw: 200, node: "LHORN_N_U1_2" },
  panther_creek_wind_i: { label: "Panther Creek", type: "Wind", mw: 142.5, node: "PC_NORTH_1" },
  stanton_wind_energy: { label: "Stanton Wind", type: "Wind", mw: 120, node: "SWEC_G1" },
};
