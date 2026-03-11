# I/O Schemas

Input and output data schemas for the price pipeline.

---

## Overview

The script produces **four Parquet files** per location:
1. **Raw files** - As returned by GridStatus API
2. **Hourly files** - Standardized, transformed outputs

---

## Input: Asset Registry

### Source
```
gs://infrasure-model-gpr-data/asset_registry.duckdb
```

### Required Columns

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `iso` | string | Detect which ISO | `"ERCOT"` |
| `resource_node` | string | Generator pricing node | `"LZ_SOUTH_RN_WINDFARM1"` |
| `fallback_resource_node_1` | string | Backup node if primary missing | `"RESOURCE_ALT1"` |
| `fallback_resource_node_2` | string | Second backup | `"RESOURCE_ALT2"` |
| `hub_node` | string | Trading hub for hedging | `"HB_HOUSTON"` |
| `plant_id_eia` | string | EIA plant ID (for `--eia` mode) | `"60372"` |
| `start_month` | string | Month name (for earliest date) | `"jan"` |
| `start_year` | string | Year (for earliest date) | `"2020"` |
| `portfolio_name` | string | Portfolio filter | `"Wind Assets"` |

### Lookup Logic

**For a given location name:**
1. Search `resource_node` column
2. If not found, search `fallback_resource_node_1`
3. If not found, search `fallback_resource_node_2`
4. If not found, search `hub_node`
5. If not found, search `asset_slug`
6. Return ISO value from matching row

---

## Output: File Structure

### Per-Location Directory

```
gs://infrasure-model-gpr-data/lmp_prices/{location}/
├── da_raw.parquet          # Raw day-ahead data
├── rt_raw.parquet          # Raw real-time data
├── da_hourly.parquet       # Standardized DA hourly
└── rt_hourly.parquet       # Standardized RT hourly
```

**Location folder naming:**
- Forward slash (`/`) replaced with `∕` (division slash unicode)
- Preserves full location name without creating nested directories
- Example: `SOME/NODE/NAME` → `SOME∕NODE∕NAME/`

---

## Raw Parquet Schemas

### DA Raw (Day-Ahead)

**Schema varies by ISO** - exactly as returned by GridStatus API.

#### CAISO DA
```python
{
    "interval_start_utc": datetime64[ns, UTC],
    "interval_end_utc": datetime64[ns, UTC],
    "market": str,
    "location": str,
    "location_type": str,
    "lmp": float64,
    "energy": float64,
    "congestion": float64,
    "loss": float64
}
```

#### ERCOT DA
```python
{
    "interval_start_utc": datetime64[ns, UTC],
    "interval_end_utc": datetime64[ns, UTC],
    "location": str,
    "location_type": str,
    "market": str,
    "spp": float64  # Note: SPP not LMP!
}
```

#### MISO DA
```python
{
    "interval_start_utc": datetime64[ns, UTC],
    "interval_end_utc": datetime64[ns, UTC],
    "location": str,
    "location_type": str,
    "lmp": float64,
    "energy": float64,
    "congestion": float64,
    "loss": float64
}
```

#### PJM DA
```python
{
    "interval_start_utc": datetime64[ns, UTC],
    "interval_end_utc": datetime64[ns, UTC],
    "market": str,
    "location": str,
    "location_id": int64,
    "location_short_name": str,
    "location_type": str,
    "lmp": float64,
    "energy": float64,
    "congestion": float64,
    "loss": float64
}
```

### RT Raw (Real-Time)

**Schema varies by ISO and whether resampled.**

#### CAISO RT (5-min resampled to hourly)
```python
{
    "interval_start_utc": datetime64[ns, UTC],  # Hour-aligned (:00)
    "interval_end_utc": datetime64[ns, UTC],
    "market": str,
    "location": str,
    "location_type": str,
    "lmp": float64,  # Mean of 5-min intervals
    "energy": float64,
    "congestion": float64,
    "loss": float64,
    "ghg": float64  # CAISO only
}
```

#### ERCOT RT (15-min resampled to hourly)
```python
{
    "interval_start_utc": datetime64[ns, UTC],  # Hour-aligned
    "interval_end_utc": datetime64[ns, UTC],
    "location": str,
    "location_type": str,
    "market": str,
    "spp": float64  # Mean of 15-min intervals
}
```

#### MISO RT (native hourly)
```python
{
    "interval_start_utc": datetime64[ns, UTC],
    "interval_end_utc": datetime64[ns, UTC],
    "location": str,
    "location_type": str,
    "lmp": float64,
    "energy": float64,
    "congestion": float64,
    "loss": float64
}
```

#### PJM RT (hourly or 5-min resampled)
```python
{
    "interval_start_utc": datetime64[ns, UTC],
    "interval_end_utc": datetime64[ns, UTC],
    "market": str,
    "location": str,
    "location_id": int64,
    "location_short_name": str,
    "location_type": str,
    "lmp": float64,
    "energy": float64,
    "congestion": float64,
    "loss": float64
}
```

---

## Hourly Parquet Schemas (Standardized)

### Common Structure (All ISOs)

**Index:**
- `datetime`: DatetimeIndex, UTC, hour-ending
- Timezone-aware: `datetime64[ns, UTC]`
- Example: `2024-01-15 06:00:00+00:00` = hour ending 6 AM UTC

**Columns** (standardized across ISOs):

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `market` | string | ✓ | "DAY_AHEAD_HOURLY" or "REAL_TIME_HOURLY" |
| `location` | string | ✓ | Location name (node/hub/zone) |
| `location_type` | string | ✓ | Type: "Hub", "Zone", "Node", "Trading Hub", etc. |
| `datetime_local` | datetime64[ns, tz] | ✓ | Hour-ending in market-local time |
| `price` | float64 | ✓ | LMP or SPP ($/MWh) |
| `energy` | float64 | ○ | Energy component (if available) |
| `congestion` | float64 | ○ | Congestion component |
| `loss` | float64 | ○ | Loss component |
| `ghg` | float64 | ○ | GHG component (CAISO only) |

### DA Hourly Schema

```python
import pandas as pd

# Example structure
{
    "index": pd.DatetimeIndex(
        [...],
        dtype='datetime64[ns, UTC]',
        name='datetime'
    ),
    "columns": {
        "market": pd.Series(["DAY_AHEAD_HOURLY", ...], dtype=str),
        "location": pd.Series(["HB_NORTH", ...], dtype=str),
        "location_type": pd.Series(["Hub", ...], dtype=str),
        "datetime_local": pd.Series(
            [...],
            dtype='datetime64[ns, America/Chicago]'  # Varies by ISO
        ),
        "price": pd.Series([45.23, ...], dtype=float64),
        "energy": pd.Series([42.10, ...], dtype=float64),  # If available
        "congestion": pd.Series([2.13, ...], dtype=float64),
        "loss": pd.Series([1.00, ...], dtype=float64),
    }
}
```

### RT Hourly Schema

**Same as DA hourly**, except:
- `market` = `"REAL_TIME_HOURLY"`
- May have `ghg` column (CAISO)

---

## Timezone Details

### Index: UTC (Canonical)

**Always UTC**, hour-ending:
```python
datetime
2024-01-15 00:00:00+00:00   # Hour ending midnight UTC
2024-01-15 01:00:00+00:00   # Hour ending 1 AM UTC
...
```

**Properties:**
- Timezone-aware (`+00:00`)
- Consistent 24 hours per day (no DST artifacts)
- Sortable, comparable across ISOs
- Database-friendly

### Column: `datetime_local` (Market Time)

**Local to ISO**, hour-ending:
```python
# ERCOT (Central Time)
datetime_local
2024-01-15 00:00:00-06:00   # Hour ending midnight CST
2024-01-15 01:00:00-06:00   # Hour ending 1 AM CST
...

# CAISO (Pacific Time)
datetime_local
2024-01-15 00:00:00-08:00   # Hour ending midnight PST
2024-01-15 01:00:00-08:00   # Hour ending 1 AM PST
...
```

**Properties:**
- Timezone-aware (includes offset)
- Handles DST transitions (23/25 hour days)
- Matches settlement reports
- Use for display and revenue calculations

### DST Handling

**Spring forward example (Pacific Time):**

```python
# Index (UTC) - always 24 hours
datetime
2024-03-10 09:00:00+00:00  # = 1 AM PST
2024-03-10 10:00:00+00:00  # = 3 AM PDT (skipped 2 AM)
2024-03-10 11:00:00+00:00  # = 3 AM PDT

# datetime_local - 23 hours on this day
datetime_local
2024-03-10 01:00:00-08:00  # 1 AM PST
2024-03-10 03:00:00-07:00  # 3 AM PDT (no 2 AM!)
2024-03-10 04:00:00-07:00  # 4 AM PDT
```

**Fall back example (Pacific Time):**

```python
# Index (UTC) - always 24 hours
datetime
2024-11-03 08:00:00+00:00  # = 1 AM PDT
2024-11-03 09:00:00+00:00  # = 1 AM PST (repeated!)
2024-11-03 10:00:00+00:00  # = 2 AM PST

# datetime_local - 25 hours on this day
datetime_local
2024-11-03 01:00:00-07:00  # 1 AM PDT (first time)
2024-11-03 01:00:00-08:00  # 1 AM PST (repeated!)
2024-11-03 02:00:00-08:00  # 2 AM PST
```

---

## Price Column Mapping

### CAISO, MISO, PJM

**Input:**
```python
df["lmp"]       # From GridStatus
df["energy"]
df["congestion"]
df["loss"]
```

**Output:**
```python
df["price"]     # = lmp (renamed for consistency)
df["energy"]    # Preserved
df["congestion"]
df["loss"]
```

### ERCOT

**Input:**
```python
df["spp"]  # Settlement Point Price (not LMP!)
```

**Output:**
```python
df["price"]  # = spp (mapped to price)
# No components (SPP is bundled)
```

---

## Example: Reading Hourly Parquet

### Python

```python
import pandas as pd

# Read from GCS (with ADC)
df = pd.read_parquet(
    "gs://infrasure-model-gpr-data/lmp_prices/HB_NORTH/rt_hourly.parquet",
    storage_options={"token": "google_default"}
)

print(df.head())
```

**Output:**
```
                               market location location_type                    datetime_local  price
datetime                                                                                               
2020-01-01 00:00:00+00:00  REAL_TIME_HOURLY  HB_NORTH           Hub 2020-01-01 00:00:00-06:00  23.45
2020-01-01 01:00:00+00:00  REAL_TIME_HOURLY  HB_NORTH           Hub 2020-01-01 01:00:00-06:00  22.13
2020-01-01 02:00:00+00:00  REAL_TIME_HOURLY  HB_NORTH           Hub 2020-01-01 02:00:00-06:00  21.98
...
```

### Schema Inspection

```python
print(df.info())
```

**Output:**
```
<class 'pandas.core.frame.DataFrame'>
DatetimeIndex: 35064 entries, 2020-01-01 00:00:00+00:00 to 2023-12-31 23:00:00+00:00
Data columns (total 5 columns):
 #   Column          Non-Null Count  Dtype              
---  ------          --------------  -----              
 0   market          35064 non-null  object             
 1   location        35064 non-null  object             
 2   location_type   35064 non-null  object             
 3   datetime_local  35064 non-null  datetime64[ns, America/Chicago]
 4   price           35064 non-null  float64            
dtypes: datetime64[ns, America/Chicago](1), float64(1), object(3)
memory usage: 1.6+ MB
```

---

## Data Quality Checks

### Completeness

```python
# Check for missing hours
df_sorted = df.sort_index()
expected_hours = pd.date_range(
    start=df_sorted.index.min(),
    end=df_sorted.index.max(),
    freq='H',
    tz='UTC'
)
missing = expected_hours.difference(df_sorted.index)
print(f"Missing hours: {len(missing)}")
```

### Duplicate Check

```python
# Index should have no duplicates
duplicates = df.index.duplicated().sum()
print(f"Duplicate timestamps: {duplicates}")
# Should be 0
```

### Price Validation

```python
# Check for suspicious prices
print(f"Min price: {df['price'].min()}")  # Can be negative
print(f"Max price: {df['price'].max()}")  # Typically < $1000/MWh
print(f"Null prices: {df['price'].isna().sum()}")  # Should be 0
```

### Component Reconciliation (if available)

```python
# For LMP datasets with components
if all(c in df.columns for c in ['price', 'energy', 'congestion', 'loss']):
    df['reconstructed'] = df['energy'] + df['congestion'] + df['loss']
    df['diff'] = abs(df['price'] - df['reconstructed'])
    print(f"Max component difference: {df['diff'].max()}")
    # Should be < 0.01 (floating point tolerance)
```

---

## Storage Characteristics

### File Sizes (Typical, 4 Years)

| File | Rows | Size (MB) | Notes |
|------|------|-----------|-------|
| `da_raw.parquet` | ~35,000 | 3-5 | Hourly, compressed |
| `rt_raw.parquet` (hourly) | ~35,000 | 3-5 | If native hourly or resampled |
| `rt_raw.parquet` (5-min) | ~420,000 | 30-50 | If raw 5-min (no resample) |
| `rt_raw.parquet` (15-min) | ~140,000 | 10-20 | If raw 15-min (no resample) |
| `da_hourly.parquet` | ~35,000 | 3-5 | Standardized |
| `rt_hourly.parquet` | ~35,000 | 3-5 | Standardized |

**Parquet compression:** Automatic (snappy by default).

### Per-Location Total

**With server resampling (recommended):**
```
da_raw + rt_raw + da_hourly + rt_hourly
≈ 5 + 5 + 5 + 5 = 20 MB
```

**Without resampling (raw 5-min):**
```
da_raw + rt_raw + da_hourly + rt_hourly
≈ 5 + 50 + 5 + 5 = 65 MB
```

---

## Summary

### Input (Asset Registry)

- **Source:** `asset_registry.duckdb` on GCS
- **Key columns:** `iso`, `resource_node`, `hub_node`, `start_month`, `start_year`
- **Purpose:** ISO detection, location mapping, start date

### Output (4 files per location)

1. **da_raw.parquet** - Raw DA from GridStatus
2. **rt_raw.parquet** - Raw RT (hourly if resampled)
3. **da_hourly.parquet** - Standardized DA hourly
4. **rt_hourly.parquet** - Standardized RT hourly

### Standardized Schema

- **Index:** `datetime` (UTC, hour-ending)
- **Columns:** `market`, `location`, `location_type`, `datetime_local`, `price`, ...
- **Timezone:** UTC index + market-local `datetime_local` column
- **Price column:** Unified (`lmp` or `spp` → `price`)

**Next:** [API Comparison (Python Client vs Raw)](./05_api_comparison.md)

