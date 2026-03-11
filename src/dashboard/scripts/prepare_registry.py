"""Extract key BESS registry columns to JSON for the dashboard map/table.

Reads data/bess_enriched.parquet and outputs a trimmed JSON with essential
columns for the fleet map and registry table.
"""

import json
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[3]
INPUT_PATH = PROJECT_ROOT / "data" / "bess_enriched.parquet"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "data"

# Columns to extract (map from parquet name → JSON name)
COLUMN_MAP = {
    "Plant Name": "plant_name",
    "Entity Name": "entity_name",
    "State": "state",
    "County": "county",
    "Latitude": "lat",
    "Longitude": "lon",
    "Nameplate Capacity (MW)": "mw",
    "Nameplate Energy Capacity (MWh)": "mwh",
    "Status": "status",
    "Operating Year": "operating_year",
    "Technology": "technology",
    "duration_hours": "duration_hours",
}

# Capability columns (boolean flags)
CAPABILITY_COLS = [
    "Arbitrage", "Frequency Regulation", "Load Following",
    "Spinning Reserves", "Voltage Support", "Black Start",
]


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Reading {INPUT_PATH}...")
    df = pd.read_parquet(INPUT_PATH)
    print(f"  {len(df)} rows, {len(df.columns)} columns")

    # Extract main columns
    result = pd.DataFrame()
    for parquet_col, json_col in COLUMN_MAP.items():
        if parquet_col in df.columns:
            result[json_col] = df[parquet_col]
        else:
            print(f"  WARNING: column '{parquet_col}' not found")

    # Extract capability flags
    capabilities = []
    for _, row in df.iterrows():
        caps = []
        for col in CAPABILITY_COLS:
            if col in df.columns and row.get(col) == True:
                caps.append(col)
        capabilities.append(caps)
    result["capabilities"] = capabilities

    # Clean up
    result = result.replace({np.nan: None})

    # Convert to list of dicts
    records = result.to_dict(orient="records")

    # Round numeric values
    for r in records:
        for key in ["lat", "lon", "mw", "mwh", "duration_hours"]:
            val = r.get(key)
            if val is not None:
                try:
                    r[key] = round(float(val), 2)
                except (ValueError, TypeError):
                    r[key] = None

    output_path = OUTPUT_DIR / "bess-registry.json"
    with open(output_path, "w") as f:
        json.dump(records, f, separators=(",", ":"))

    size_kb = output_path.stat().st_size / 1024
    print(f"  {len(records)} BESS units → {output_path} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
