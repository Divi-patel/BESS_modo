/** Statistical utilities — ported from reference dashboard lib/stats.ts */

/** Linear-interpolation percentile (matches numpy default). */
export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export interface PercentileMap {
  P10: number;
  P25: number;
  P50: number;
  P75: number;
  P90: number;
}

export function computePercentiles(values: number[]): PercentileMap {
  return {
    P10: percentile(values, 10),
    P25: percentile(values, 25),
    P50: percentile(values, 50),
    P75: percentile(values, 75),
    P90: percentile(values, 90),
  };
}

export interface MonthlyStats {
  month: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  p10: number;
  p90: number;
  min: number;
  max: number;
}

/** Compute monthly statistics from arrays of monthly values across multiple years. */
export function computeMonthlyStats(
  monthlyArrays: Array<{ month: number; value: number }>
): MonthlyStats[] {
  const byMonth = new Map<number, number[]>();
  for (const { month, value } of monthlyArrays) {
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(value);
  }

  const stats: MonthlyStats[] = [];
  for (const [month, values] of byMonth) {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    stats.push({
      month,
      mean,
      median: percentile(sorted, 50),
      q1: percentile(sorted, 25),
      q3: percentile(sorted, 75),
      p10: percentile(sorted, 10),
      p90: percentile(sorted, 90),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    });
  }

  return stats.sort((a, b) => a.month - b.month);
}

/** Gaussian KDE with Silverman's bandwidth rule. */
export function gaussianKDE(
  data: number[],
  nPoints: number = 200,
  bandwidth?: number
): { x: number[]; y: number[] } {
  if (data.length === 0) return { x: [], y: [] };

  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(
    data.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)
  );
  const h = bandwidth ?? 1.06 * std * Math.pow(n, -0.2);

  const min = Math.min(...data) - 3 * h;
  const max = Math.max(...data) + 3 * h;
  const step = (max - min) / (nPoints - 1);

  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i < nPoints; i++) {
    const xi = min + i * step;
    let density = 0;
    for (const d of data) {
      const u = (xi - d) / h;
      density += Math.exp(-0.5 * u * u);
    }
    density /= n * h * Math.sqrt(2 * Math.PI);
    x.push(xi);
    y.push(density);
  }

  return { x, y };
}
