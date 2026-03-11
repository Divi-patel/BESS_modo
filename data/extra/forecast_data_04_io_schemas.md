# I/O Schemas

Complete specification of input data formats, output file structures, and configuration schemas.

---

## Input Data Schemas

### Generation Parquet

**Location:** `gs://infrasure-model-gpr-data/generation_data/{type}_gen_data/{asset_slug}_generation.parquet`

The pipeline uses a priority-ordered column search (`GENERATION_COLUMN_CANDIDATES`) to handle both current and legacy schema:

| Priority | Column | Asset Type | Schema |
|---|---|---|---|
| 1 | `power_ac_mw` | Solar | Current schema (new column names with explicit units) |
| 2 | `power_mw` | Wind | Current schema |
| 3 | `generation_mw` | Both | Legacy schema (older files) |

**Required columns:**

| Column | Type | Required | Description |
|---|---|---|---|
| (index) | datetime64[ns, UTC] | ✓ | Hourly timestamp in UTC |
| `power_ac_mw` / `power_mw` / `generation_mw` | float64 | ✓ | Hourly generation power (MW). Pipeline picks whichever is present using the priority above. |
| `datetime_local` | datetime64[ns, tz] | ✓ | Site-local timezone timestamp. Used for calendar month grouping (DST-aware — groups by local month, not UTC month). |

**Note:** `datetime_local` is critical for correctness. Grouping by UTC month can misassign up to 64 hours at timezone-offset month boundaries.

**Example (solar current schema, confirmed from GCS):**
```
                              power_ac_mw  datetime_local
datetime
2020-01-01 12:00:00+00:00         45.234   2020-01-01 06:00:00-06:00
2020-01-01 13:00:00+00:00         47.891   2020-01-01 07:00:00-06:00
```
---

### LMP Price Parquet

**Location:** `gs://infrasure-model-gpr-data/lmp_prices/{location}/{market}_hourly.parquet`

**Schema:**

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| (index) | datetime64[ns, UTC] | ✓ | Hourly timestamp |
| `price` | float64 | ✓ | LMP price ($/MWh) |
| `market` | string | | "da" or "rt" |
| `location` | string | | Pricing node name |

**Additional columns** (optional, varies by ISO):
- `energy`, `congestion`, `loss`: LMP components
- `lmp`: Alternative price column name
- `interval_start_local`, `interval_end_local`: Local timestamps

**Example:**
```
                              price    market    location
datetime                                                 
2020-01-01 00:00:00+00:00    25.42      da      WEST_HUB
2020-01-01 01:00:00+00:00    23.18      da      WEST_HUB
```

---

### Asset Registry (DuckDB)

**Location:** `gs://infrasure-model-gpr-data/asset_registry.duckdb`

**Schema:**

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `asset_id` | int | ✓ | Unique ID (primary key) |
| `asset_slug` | string | ✓ | Unique identifier |
| `latitude` | float | ✓ | Site latitude |
| `longitude` | float | ✓ | Site longitude |
| `resource_node` | string | | Primary pricing node |
| `fallback_resource_node_1` | string | | First fallback node |
| `fallback_resource_node_2` | string | | Second fallback node |
| `hub_node` | string | | Hub pricing location |
| `iso` | string | | ISO/RTO market |
| `portfolio_name` | string | | Portfolio grouping |
| `asset_type` | string | | "wind" or "solar" |

---

## Output Data Schemas

### Forecast Parquet

**Location:** `{output}/forecast_data/{site}/{kind}/{market}/{site}_{kind}_{market}_forecast.parquet`

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| (index) | datetime64[ns, UTC] | Hourly timestamp |
| `datetime_local` | datetime64[ns, tz] | Local timestamp |
| `segment` | string | "historical" or "simulated" |
| `path_id` | int | Year (historical) or 10001+ (simulated) |
| `generation_mw` | float64 | Generation (MW) |
| `price_per_mwh` | float64 | Compressed price ($/MWh) |
| `revenue_usd` | float64 | Generation × Price ($) |

**Example:**
```
                              datetime_local       segment  path_id  generation_mw  price_per_mwh  revenue_usd
datetime                                                                                                       
2025-01-01 05:00:00+00:00 2025-01-01 00:00:00  historical     2020         45.234         28.50      1289.17
2025-01-01 05:00:00+00:00 2025-01-01 00:00:00   simulated    10001         52.891         31.20      1650.20
```

**Typical size:**
- Single site, 100 paths: ~50-100 MB
- Hourly data, 12 months: ~105,000 rows per path
- ~10-15 million rows total

---

### Historical Revenue Parquet

**Location:** `{output}/revenue_data/{site}/{kind}/{market}_historical.parquet`

**Schema:**

| Column | Type | Description |
|--------|------|-------------|
| (index) | datetime64[ns, UTC] | Hourly timestamp |
| `generation_mw` | float64 | Generation (MW) |
| `price_per_mwh` | float64 | Compressed price ($/MWh) |
| `revenue_usd` | float64 | Generation × Price ($) |
| `datetime_local` | datetime64[ns, tz] | Local timestamp |
| `is_ffilled` | bool | True if price was forward-filled |

---

### Bootstrap JSON

**Location:** `{output}/forecast_data/{site}/{kind}/{market}/bootstrap.json`

**Schema:**
```json
{
  "n_paths": 100,
  "strategy": "uniform",
  "seed": 42,
  "selections": {
    "path_1": {
      "Jan": 2019,
      "Feb": 2022,
      "Mar": 2017,
      "Apr": 2020,
      "May": 2016,
      "Jun": 2023,
      "Jul": 2018,
      "Aug": 2021,
      "Sep": 2015,
      "Oct": 2019,
      "Nov": 2022,
      "Dec": 2020
    },
    "path_2": {
      "Jan": 2021,
      ...
    },
    ...
  }
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `n_paths` | int | Number of simulated paths |
| `strategy` | string | Bootstrap strategy used |
| `seed` | int | Random seed used |
| `selections` | object | Year selections per path per month |

---

### Manifest JSON

**Location:** `{output}/forecast_data/{site}/{kind}/{market}/manifest.json`

**Schema:**
```json
{
  "price_kind": "node",
  "market": "da",
  "random_seed": 42,
  "compression_percentiles": {
    "lower": 15,
    "upper": 85
  },
  "min_monthly_coverage": 0.8,
  "ffill_policy": {
    "enabled": true,
    "window_hours": null
  },
  "bootstrap_strategy": "uniform",
  "data_validation": {
    "generation_duplicates": {
      "had_duplicates": false,
      "duplicate_count": 0,
      "duplicate_pct": 0.0,
      "action_taken": null
    },
    "price_duplicates": {
      "had_duplicates": false,
      "duplicate_count": 0,
      "duplicate_pct": 0.0,
      "action_taken": null
    },
    "date_overlap": {
      "generation_range": {"start": "1979-01-01", "end": "2025-08-01", "years": 46.6},
      "price_range": {"start": "2010-01-01", "end": "2025-10-13", "years": 15.8},
      "overlap_range": {"start": "2010-01-01", "end": "2025-08-01", "years": 15.6},
      "warnings": ["Generation starts 31.0 years before price data"]
    },
    "path_validation": {
      "total_paths": 100,
      "valid_paths": 100,
      "invalid_path_ids": [],
      "avg_completeness_pct": 100.0
    }
  }
}
```

**Data Validation Fields:**

| Field | Description |
|-------|-------------|
| `generation_duplicates` | Duplicate check results for generation data |
| `price_duplicates` | Duplicate check results for price data |
| `date_overlap` | Generation/price date range overlap info |
| `path_validation` | Bootstrap path completeness validation |

---

### Compression Thresholds JSON

**Location:** `{output}/revenue_data/{site}/{kind}/{market}_compression_thresholds.json`

**Schema:**
```json
{
  "01-00": {"lower": 12.5, "upper": 45.2},
  "01-01": {"lower": 11.8, "upper": 42.1},
  "01-02": {"lower": 10.5, "upper": 38.9},
  ...
  "07-14": {"lower": 28.0, "upper": 95.0},
  ...
  "12-23": {"lower": 15.3, "upper": 58.7}
}
```

**Key format:** `"MM-HH"` (month-hour, zero-padded)

**Value:** `{"lower": P15, "upper": P85}` thresholds

---

### Coverage By Month JSON

**Location:** `{output}/revenue_data/{site}/{kind}/{market}_coverage_by_month.json`

**Schema:**
```json
{
  "2015-01": 0.98,
  "2015-02": 0.95,
  "2015-03": 0.99,
  ...
  "2024-12": 0.87
}
```

**Key format:** `"YYYY-MM"` (year-month)

**Value:** Coverage ratio (0.0-1.0)

---

### Fill Stats JSON

**Location:** `{output}/revenue_data/{site}/{kind}/{market}_fill_stats.json`

**Schema:**
```json
{
  "original_points": 125000,
  "ffilled_points": 3500
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `original_points` | int | Hours with original price data |
| `ffilled_points` | int | Hours with forward-filled prices |

---

## Configuration Schema

### config.json

**Location:** `scripts/forecast_simulation/config.json`

**Schema:**
```json
{
  "n_paths": 100,
  "compression_percentiles": {
    "lower": 15,
    "upper": 85
  },
  "min_monthly_coverage": 0.8,
  "random_seed": 42,
  "bootstrap_method": "uniform",
  "logging": {
    "level": "INFO"
  },
  "weather_conditional": {
    "cb_features": ["shortwave_radiation_net"],
    "cb_tau": 0.8,
    "cb_p_min": 0.05,
    "cb_same_year_bias": 0.05,
    "forecast_model": "ECMWF_IFS",
    "cb_min_forecast_fraction": 0.8
  }
}
```

**Field Descriptions:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `n_paths` | int | 100 | Number of bootstrap paths |
| `compression_percentiles.lower` | int | 15 | Lower percentile for compression |
| `compression_percentiles.upper` | int | 85 | Upper percentile for compression |
| `min_monthly_coverage` | float | 0.8 | Minimum coverage requirement |
| `random_seed` | int | 42 | Random seed for reproducibility |
| `bootstrap_method` | string | "uniform" | Default strategy |
| `weather_conditional.cb_features` | array | [...] | Weather variables for similarity |
| `weather_conditional.cb_tau` | float | 0.8 | Softmax temperature |
| `weather_conditional.cb_p_min` | float | 0.05 | Probability floor |
| `weather_conditional.cb_same_year_bias` | float | 0.05 | Current year boost |
| `weather_conditional.forecast_model` | string | "ECMWF_IFS" | Forecast source |

---

## Working with Outputs

### Loading Forecast Data

```python
import pandas as pd

# Load forecast
df = pd.read_parquet("local_data/forecast_data/my_site/node/da/my_site_node_da_forecast.parquet")

# Separate historical vs simulated
historical = df[df["segment"] == "historical"]
simulated = df[df["segment"] == "simulated"]

# Get unique paths
paths = df["path_id"].unique()
print(f"Historical paths: {sorted([p for p in paths if p < 10000])}")
print(f"Simulated paths: {sorted([p for p in paths if p >= 10000])[:5]}...")
```

### Computing Annual Revenue

```python
# Total annual revenue by path
annual = df.groupby("path_id")["revenue_usd"].sum()

# P-values
print(f"P50 (median): ${annual.median()/1e6:.1f}M")
print(f"P75: ${annual.quantile(0.25)/1e6:.1f}M")  # 75% exceed this
print(f"P90: ${annual.quantile(0.10)/1e6:.1f}M")  # 90% exceed this
print(f"P99: ${annual.quantile(0.01)/1e6:.1f}M")  # 99% exceed this
```

### Monthly Analysis

```python
# Extract month
df["month"] = df["datetime_local"].dt.month

# Monthly revenue by path
monthly = df.groupby(["path_id", "month"])["revenue_usd"].sum().unstack()

# P50 by month
monthly_p50 = monthly.median()
monthly_p50.plot(kind="bar", title="P50 Revenue by Month")
```

### Loading Bootstrap Selections

```python
import json

with open("local_data/forecast_data/my_site/node/da/bootstrap.json") as f:
    bootstrap = json.load(f)

print(f"Strategy: {bootstrap['strategy']}")
print(f"Seed: {bootstrap['seed']}")
print(f"N paths: {bootstrap['n_paths']}")

# Check which years were selected most often for January
jan_years = [s["Jan"] for s in bootstrap["selections"].values() if s["Jan"]]
from collections import Counter
print(f"January year frequency: {Counter(jan_years).most_common()}")
```

### Validating Coverage

```python
import json

with open("local_data/revenue_data/my_site/node/da_coverage_by_month.json") as f:
    coverage = json.load(f)

# Find months below threshold
low_coverage = {k: v for k, v in coverage.items() if v < 0.8}
if low_coverage:
    print(f"Warning: Low coverage months: {low_coverage}")
else:
    print("All months meet 80% coverage requirement")
```

---

## File Size Estimates

| Output | Typical Size | Notes |
|--------|--------------|-------|
| Forecast parquet | 50-100 MB | Per site/kind/market |
| Historical revenue parquet | 10-20 MB | Per site/kind/market |
| Bootstrap JSON | 50-200 KB | Depends on n_paths |
| Manifest JSON | < 1 KB | |
| Compression thresholds JSON | 10-20 KB | 288 slots |
| Coverage JSON | 5-10 KB | Depends on history length |
| Fill stats JSON | < 1 KB | |
| Log file | 5-50 KB | Depends on verbosity |

**Total per site:** ~200-400 MB (all combinations)

---

## Data Validation Checklist

### Input Validation (Automated)

These checks are performed automatically by the pipeline:

- [x] Generation parquet has UTC datetime index (`_ensure_utc_datetime_index`)
- [x] Generation has no duplicate timestamps (`check_and_handle_duplicates`)
- [x] Generation parquet has `generation_mw` column (or `generation`)
- [x] Price parquet has `price` column
- [x] Price has no duplicate timestamps (`check_and_handle_duplicates`)
- [x] Date overlap validation (`validate_date_overlap`) - informational
- [x] Asset registry has valid lat/lon
- [x] Asset registry has at least one pricing location

### Output Validation (Automated)

- [x] Path completeness ≥ 95% (`validate_all_simulated_paths`)
- [x] Invalid paths excluded from output
- [x] Validation info included in manifest.json

### Output Validation (Manual)

- [ ] Forecast parquet has expected columns
- [ ] Both "historical" and "simulated" segments present
- [ ] Path IDs: historical < 10000, simulated >= 10001
- [ ] Bootstrap JSON matches n_paths
- [ ] Coverage meets minimum threshold

---

## Troubleshooting

### Empty or Missing Outputs

**Check:**
1. Input data exists
2. Coverage meets threshold
3. At least one pricing location available
4. No errors in log file

### Unexpected Path Counts

**Check:**
1. `n_paths` in config
2. Bootstrap JSON `n_paths` field
3. Eligible years per month (may limit paths)

### Large File Sizes

**Mitigation:**
1. Use parquet compression (default: snappy)
2. Reduce n_paths for testing
3. Filter to specific markets (da or rt only)

