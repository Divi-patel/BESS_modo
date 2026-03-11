import type { ScenarioResult, ScenarioMeta, BessConfig } from "@/types";

let _matrix: ScenarioResult[] | null = null;
let _meta: ScenarioMeta | null = null;

export async function loadScenarioMatrix(): Promise<ScenarioResult[]> {
  if (_matrix) return _matrix;
  const res = await fetch("/data/scenario-matrix.json");
  _matrix = await res.json();
  return _matrix!;
}

export async function loadScenarioMeta(): Promise<ScenarioMeta> {
  if (_meta) return _meta;
  const res = await fetch("/data/scenario-meta.json");
  _meta = await res.json();
  return _meta!;
}

/** Find exact match in the scenario matrix */
export function getScenario(
  matrix: ScenarioResult[],
  config: BessConfig
): ScenarioResult | null {
  return (
    matrix.find(
      (s) =>
        s.location === config.location &&
        s.market === config.market &&
        s.year === config.year &&
        s.rte === config.rte &&
        s.duration_hours === config.durationHours
    ) ?? null
  );
}

/** Find nearest RTE match (for when exact grid point doesn't exist) */
export function getNearestScenario(
  matrix: ScenarioResult[],
  config: BessConfig
): ScenarioResult | null {
  const candidates = matrix.filter(
    (s) =>
      s.location === config.location &&
      s.market === config.market &&
      s.year === config.year &&
      s.duration_hours === config.durationHours
  );
  if (candidates.length === 0) return null;

  candidates.sort(
    (a, b) => Math.abs(a.rte - config.rte) - Math.abs(b.rte - config.rte)
  );
  return candidates[0];
}

/** Interpolate between two nearest RTE grid points */
export function getInterpolatedScenario(
  matrix: ScenarioResult[],
  config: BessConfig
): ScenarioResult | null {
  const candidates = matrix
    .filter(
      (s) =>
        s.location === config.location &&
        s.market === config.market &&
        s.year === config.year &&
        s.duration_hours === config.durationHours
    )
    .sort((a, b) => a.rte - b.rte);

  if (candidates.length === 0) return null;

  // Exact match
  const exact = candidates.find((s) => s.rte === config.rte);
  if (exact) return exact;

  // Find bracketing points
  const lower = candidates.filter((s) => s.rte <= config.rte).pop();
  const upper = candidates.find((s) => s.rte >= config.rte);

  if (!lower) return upper ?? null;
  if (!upper) return lower;

  // Linear interpolation
  const t = (config.rte - lower.rte) / (upper.rte - lower.rte);
  const lerp = (a: number, b: number) => a + t * (b - a);

  return {
    ...lower,
    rte: config.rte,
    annual_revenue: lerp(lower.annual_revenue, upper.annual_revenue),
    revenue_per_kw_yr: lerp(lower.revenue_per_kw_yr, upper.revenue_per_kw_yr),
    total_cycles: lerp(lower.total_cycles, upper.total_cycles),
    monthly: lower.monthly.map((m, i) => ({
      month: m.month,
      revenue: lerp(m.revenue, upper.monthly[i]?.revenue ?? m.revenue),
      cycles: lerp(m.cycles, upper.monthly[i]?.cycles ?? m.cycles),
    })),
  };
}

/** Get a slice of the matrix for heatmap: all RTE × Duration for a given location/year/market */
export function getHeatmapSlice(
  matrix: ScenarioResult[],
  location: string,
  market: string,
  year: number
): ScenarioResult[] {
  return matrix.filter(
    (s) => s.location === location && s.market === market && s.year === year
  );
}

/** Get all scenarios for a given location/market across all years (for one RTE+duration) */
export function getYearSlice(
  matrix: ScenarioResult[],
  location: string,
  market: string,
  rte: number,
  durationHours: number
): ScenarioResult[] {
  return matrix
    .filter(
      (s) =>
        s.location === location &&
        s.market === market &&
        s.rte === rte &&
        s.duration_hours === durationHours
    )
    .sort((a, b) => a.year - b.year);
}

/** Get all locations for a given year/market/rte/duration */
export function getLocationSlice(
  matrix: ScenarioResult[],
  market: string,
  year: number,
  rte: number,
  durationHours: number
): ScenarioResult[] {
  return matrix.filter(
    (s) =>
      s.market === market &&
      s.year === year &&
      s.rte === rte &&
      s.duration_hours === durationHours
  );
}
