"""Prepare price statistics and duration curves for the dashboard.

Generates:
- price-stats.json: Monthly percentiles per location/year/market
- price-duration-curves.json: Sorted hourly prices for duration curve visualization
"""

import sys, json
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[3]
PRICES_DIR = PROJECT_ROOT / "data" / "prices"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"

LOCATIONS = [
    "HB_HOUSTON", "HB_NORTH", "HB_SOUTH", "HB_WEST",
    "LAMESASLR_G", "LHORN_N_U1_2", "MISAE_GEN_RN", "PC_NORTH_1", "SWEC_G1",
]
MARKETS = ["da", "rt"]


def load_prices(location: str, market: str) -> pd.DataFrame:
    fname = f"{location}_{market}_hourly.parquet"
    fpath = PRICES_DIR / fname
    if not fpath.exists():
        return pd.DataFrame()
    df = pd.read_parquet(fpath)
    df["datetime_local"] = pd.to_datetime(df["datetime_local"])
    return df


def compute_price_stats():
    """Monthly price percentiles per location/year/market."""
    all_stats = []

    for location in LOCATIONS:
        for market in MARKETS:
            df = load_prices(location, market)
            if df.empty:
                continue

            df["year"] = df["datetime_local"].dt.year
            df["month"] = df["datetime_local"].dt.month

            for (year, month), group in df.groupby(["year", "month"]):
                prices = group["price"].dropna().values
                if len(prices) < 100:
                    continue
                all_stats.append({
                    "location": location,
                    "market": market.upper(),
                    "year": int(year),
                    "month": int(month),
                    "count": len(prices),
                    "mean": round(float(np.mean(prices)), 2),
                    "std": round(float(np.std(prices)), 2),
                    "min": round(float(np.min(prices)), 2),
                    "p10": round(float(np.percentile(prices, 10)), 2),
                    "p25": round(float(np.percentile(prices, 25)), 2),
                    "p50": round(float(np.percentile(prices, 50)), 2),
                    "p75": round(float(np.percentile(prices, 75)), 2),
                    "p90": round(float(np.percentile(prices, 90)), 2),
                    "max": round(float(np.max(prices)), 2),
                })

    return all_stats


def compute_duration_curves():
    """Sorted hourly prices (descending) for duration curve plots.

    Only stores 2024 data + one sample year (2020) per location to keep size manageable.
    Downsampled to 500 points per curve for smooth plotting without bloat.
    """
    curves = []
    target_years = [2020, 2024]

    for location in LOCATIONS:
        for market in MARKETS:
            df = load_prices(location, market)
            if df.empty:
                continue

            df["year"] = df["datetime_local"].dt.year

            for year in target_years:
                year_df = df[df["year"] == year]
                if len(year_df) < 1000:
                    continue

                prices = year_df["price"].dropna().sort_values(ascending=False).values

                # Downsample to 500 points for smooth curves
                n = len(prices)
                if n > 500:
                    indices = np.linspace(0, n - 1, 500, dtype=int)
                    sampled = prices[indices]
                else:
                    sampled = prices

                curves.append({
                    "location": location,
                    "market": market.upper(),
                    "year": int(year),
                    "hours": len(prices),
                    "prices": [round(float(p), 2) for p in sampled],
                })

    return curves


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Computing monthly price statistics...")
    stats = compute_price_stats()
    stats_path = OUTPUT_DIR / "price-stats.json"
    with open(stats_path, "w") as f:
        json.dump(stats, f, separators=(",", ":"))
    print(f"  {len(stats)} monthly records → {stats_path} ({stats_path.stat().st_size / 1024:.1f} KB)")

    print("Computing price duration curves...")
    curves = compute_duration_curves()
    curves_path = OUTPUT_DIR / "price-duration-curves.json"
    with open(curves_path, "w") as f:
        json.dump(curves, f, separators=(",", ":"))
    print(f"  {len(curves)} curves → {curves_path} ({curves_path.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
