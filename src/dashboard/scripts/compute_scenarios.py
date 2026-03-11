"""Pre-compute BESS dispatch scenario matrix for the interactive dashboard.

Generates a grid of (location, market, year, rte, duration) combinations,
runs backtest_year() on each, and saves results as JSON for the frontend.

Usage:
    python compute_scenarios.py [--workers 8]
"""

import sys, os, json, time, argparse
from pathlib import Path
from multiprocessing import Pool, cpu_count
import pandas as pd
import numpy as np

# Add project root to path so we can import src.bess
PROJECT_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from bess.optimizer import backtest_year

# ── Configuration ────────────────────────────────────────────────────────────

PRICES_DIR = PROJECT_ROOT / "data" / "prices"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"

LOCATIONS = [
    "HB_HOUSTON", "HB_NORTH", "HB_SOUTH", "HB_WEST",
    "LAMESASLR_G", "LHORN_N_U1_2", "MISAE_GEN_RN", "PC_NORTH_1", "SWEC_G1",
]

MARKETS = ["da", "rt"]

RTE_VALUES = [0.78, 0.80, 0.83, 0.85, 0.87, 0.90, 0.95]

DURATION_HOURS = [1, 2, 4, 6, 8]

POWER_MW = 100  # Fixed — results normalized to $/kW/yr


def load_price_series(location: str, market: str) -> pd.Series:
    """Load hourly price parquet and return a Series with DatetimeIndex."""
    fname = f"{location}_{market}_hourly.parquet"
    fpath = PRICES_DIR / fname
    if not fpath.exists():
        return pd.Series(dtype=float)
    df = pd.read_parquet(fpath)
    df["datetime_local"] = pd.to_datetime(df["datetime_local"])
    series = df.set_index("datetime_local")["price"].sort_index()
    return series


def get_available_years(series: pd.Series) -> list[int]:
    """Return list of complete years (at least 8000 hours) in the series."""
    if series.empty:
        return []
    years = []
    for year in sorted(series.index.year.unique()):
        year_data = series[str(year)]
        if len(year_data) >= 8000:  # ~91% of 8760 hours
            years.append(int(year))
    return years


def compute_single_scenario(args: tuple) -> dict | None:
    """Compute one scenario. Designed for multiprocessing.Pool.map()."""
    location, market, year, rte, duration_hours, prices_cache_key = args

    # Load prices (each worker loads its own copy)
    series = load_price_series(location, market)
    if series.empty:
        return None

    energy_mwh = POWER_MW * duration_hours

    try:
        result_df = backtest_year(
            series,
            year=str(year),
            power_mw=POWER_MW,
            energy_mwh=energy_mwh,
            rte=rte,
        )
    except Exception as e:
        print(f"  ERROR {location}|{market}|{year}|RTE={rte}|{duration_hours}h: {e}")
        return None

    if result_df.empty:
        return None

    annual_revenue = float(result_df["revenue_usd"].sum())
    total_cycles = float(result_df["cycles"].sum())
    revenue_per_kw_yr = annual_revenue / POWER_MW

    monthly = []
    for _, row in result_df.iterrows():
        monthly.append({
            "month": int(row["month"].month),
            "revenue": round(float(row["revenue_usd"]), 2),
            "cycles": round(float(row["cycles"]), 2),
        })

    return {
        "location": location,
        "market": market.upper(),
        "year": year,
        "rte": rte,
        "duration_hours": duration_hours,
        "annual_revenue": round(annual_revenue, 2),
        "revenue_per_kw_yr": round(revenue_per_kw_yr, 2),
        "total_cycles": round(total_cycles, 2),
        "monthly": monthly,
    }


def build_task_list() -> list[tuple]:
    """Build the full list of scenario tasks, skipping unavailable data."""
    tasks = []
    for location in LOCATIONS:
        for market in MARKETS:
            series = load_price_series(location, market)
            years = get_available_years(series)
            for year in years:
                for rte in RTE_VALUES:
                    for dur in DURATION_HOURS:
                        tasks.append((location, market, year, rte, dur, f"{location}_{market}"))
    return tasks


def main():
    parser = argparse.ArgumentParser(description="Compute BESS scenario matrix")
    parser.add_argument("--workers", type=int, default=max(1, cpu_count() - 2),
                        help="Number of parallel workers")
    args = parser.parse_args()

    print("Building task list...")
    tasks = build_task_list()
    print(f"Total scenarios to compute: {len(tasks)}")
    print(f"Using {args.workers} workers")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    start = time.time()

    # Use multiprocessing for parallelism
    with Pool(args.workers) as pool:
        results = []
        for i, result in enumerate(pool.imap_unordered(compute_single_scenario, tasks, chunksize=10)):
            if result is not None:
                results.append(result)
            if (i + 1) % 100 == 0:
                elapsed = time.time() - start
                rate = (i + 1) / elapsed
                remaining = (len(tasks) - i - 1) / rate
                print(f"  [{i+1}/{len(tasks)}] {len(results)} valid, "
                      f"{elapsed:.0f}s elapsed, ~{remaining:.0f}s remaining")

    elapsed = time.time() - start
    print(f"\nCompleted {len(results)} scenarios in {elapsed:.1f}s")

    # Save as JSON
    output_path = OUTPUT_DIR / "scenario-matrix.json"
    with open(output_path, "w") as f:
        json.dump(results, f, separators=(",", ":"))

    size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"Saved to {output_path} ({size_mb:.2f} MB)")

    # Also save a metadata file with available dimensions
    meta = {
        "locations": sorted(set(r["location"] for r in results)),
        "markets": sorted(set(r["market"] for r in results)),
        "years": sorted(set(r["year"] for r in results)),
        "rte_values": RTE_VALUES,
        "duration_hours": DURATION_HOURS,
        "total_scenarios": len(results),
        "power_mw": POWER_MW,
    }
    meta_path = OUTPUT_DIR / "scenario-meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Metadata saved to {meta_path}")


if __name__ == "__main__":
    main()
