# 03 — I/O Schemas

This doc captures the practical “contract” for inputs and outputs used by `scripts/hydronos_weather_api_code.py`.

---

## Inputs

### Asset registry (DuckDB on GCS)

- **Location**: `gs://infrasure-model-gpr-data/asset_registry.duckdb`
- **How it’s read**: `asset_registry_db.query_interface.load_asset_registry(...)`

### Required columns (used by the script)

At minimum, the script expects each record/site to have:

- `asset_slug` (string): canonical site key used in file naming
- `latitude` (float): site latitude
- `longitude` (float): site longitude

---

## Hydronos API request shape (logical)

The script calls the Hydronos Labs hourly historical endpoint and requests:

- `var=all` (all available variables)
- `createFile=True` (server generates a Parquet file)
- `siteName={asset_slug}` (used by the API; local canonical key is still `asset_slug`)
- `start`, `end` (YYYY-MM-DD)
- `lat`, `lon`

See [Data Sources & Lineage](../reference/03_data_sources_and_lineage.md) for endpoint notes.

---

## Outputs

### Primary Parquet output

- **Format**: Parquet
- **Location**: `gs://infrasure-model-gpr-data/weather_data/`
- **Naming**: `{asset_slug}_weather_hourly.parquet`
- **Temporal resolution**: hourly
- **Timezone**: UTC (see variable reference doc)

### Columns (high level)

The file contains:

- a timestamp/time column (exact column name is defined by the Hydronos output)
- one column per requested variable (see [Variable Catalog](../reference/01_variable_catalog.md))

If you need a strict schema contract for downstream consumption, add a “schema snapshot” here (example Parquet schema pulled from one representative file) and update it when the vendor changes output columns.

