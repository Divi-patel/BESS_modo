# Data — Extra (Schema Documentation & Reference Data)

This directory contains schema documentation and reference datasets for the data pipeline. Files are excluded from version control due to proprietary infrastructure details.

## Contents

| File | Description |
|------|-------------|
| `asset_registry.md` | DuckDB schema for US power plant asset registry — tables, relationships, pricing node mappings, design decisions |
| `price_04_io_schemas.md` | Parquet IO schema for day-ahead and real-time LMP prices — columns, dtypes, date ranges, resampling methodology |
| `forecast_data_04_io_schemas.md` | Parquet schema for solar/wind generation forecast outputs — probabilistic bands, temporal resolution |
| `weather_03_io_schemas.md` | ERA5 hourly weather data format — variables, grid resolution, temporal coverage |
| `gcs_bucket_structure.md` | Organization of the cloud data pipeline — directory layout, file naming, update cadence |
| `us_price_nodes_latlong_comprehensive.parquet` | 55,408 US ISO pricing nodes with lat/long coordinates (all 7 ISOs, 19,942 ERCOT) |

## Data Pipeline Overview

The underlying data pipeline collects, processes, and stores:
- **LMP prices** from all major US ISOs (ERCOT, PJM, CAISO, NYISO, MISO, SPP, ISONE)
- **Generation data** for solar and wind assets (historical + forecast)
- **Weather data** from ERA5 reanalysis (hourly, global)
- **Asset registry** linking 2,500+ US renewable energy assets to their pricing nodes

Price data is collected at native resolution (15-min for ERCOT SPP) and resampled to hourly for analysis. Raw prices are preserved (not forecast-compressed) to maintain the full distribution critical for BESS arbitrage valuation.
