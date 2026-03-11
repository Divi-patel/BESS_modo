# Schema: `bess_enriched.parquet`

**File**: `data/dimensions/engineering/bess_enriched.parquet`
**Built by**: `riorg-build-engineering --tech bess` (`cli/build_engineering.py` → `riorg/dimensions/engineering/build.py`)
**Grain**: One row per **(Plant ID, Generator ID)** — same as `asset_master`
**Rows**: 1,331 battery storage generators — 883 operating + 448 planned
**Columns**: 101
**Sources**: `asset_master.parquet` · EIA-860 3_4_Energy_Storage_Y2024.xlsx (Operable + Proposed sheets)

---

## What this file is

`bess_enriched` covers all battery storage generators in `asset_master` (filter: `Prime Mover Code == 'BA'`). It inherits all 52 base columns and adds:
- ~47 EIA 3_4_Energy_Storage columns (chemistry, coupling type, application flags, direct support plant links)
- 1 derived column (`duration_hours`)

Zero rows are dropped from the 860M BESS base — unmatched rows are kept with nulls.

---

## Build flow

```
asset_master.parquet  (29,172 rows)
  │
  │  filter: Prime Mover Code == 'BA'
  ▼
BESS base  (1,331 rows)
  │    883 operating (status_note='OP') + 448 planned (status_note='PL')

  ├── COMBINE ─── EIA-860 3_4_Energy_Storage_Y2024.xlsx
  │               ├─ Operable sheet   (~786 rows)   ← commissioned BESS
  │               └─ Proposed sheet   (~559 rows)   ← planned/under-construction
  │
  │   Combine rule: dedupe on (Plant Code, Generator ID)
  │                 Operable wins if same key appears in both sheets
  │                 (handles EIA status-transition edge cases)
  │
  ├── LEFT JOIN ── combined 3_4 storage rows
  │   key: (Plant ID, Generator ID) ↔ (Plant Code, Generator ID)  — normalized
  │
  │   ~1,318 matched  ✅  Storage Technology, chemistry, coupling flags populated
  │      ~13 unmatched ○   very recent 2025 commissions not yet in 2024 annual
  │
  └── DERIVE
      duration_hours = Nameplate Energy Capacity (MWh) ÷ Nameplate Capacity (MW)
      (null when either capacity is null or zero)

  ▼
data/dimensions/engineering/bess_enriched.parquet  (1,331 rows, 101 cols)
```

---

## Column reference

### Inherited from asset_master (52 columns)

All 52 columns from `asset_master.parquet` are inherited. See [base__asset_master.md](base__asset_master.md). Key inherited columns in BESS context:

| Column | Relevant because |
|--------|-----------------|
| `Nameplate Capacity (MW)` | Power capacity (MW) — numerator for duration calculation |
| `Nameplate Energy Capacity (MWh)` | Energy capacity (MWh) — denominator for duration calculation |
| `Prime Mover Code` | Always `'BA'` for rows in this file |
| `Energy Source Code` | Always `'MWH'` for rows in this file |
| `status_note` | `'OP'`/`'PL'` for operating/planned filter |
| `Plant ID` | JOIN key to look up co-located generation assets |

### Added from EIA-860 3_4_Energy_Storage (suffixed on duplicate col names)

The following columns come from the combined Operable + Proposed 3_4 sheet. Duplicate column names from asset_master are suffixed with `_storage`.

**Internal/identity columns from the 3_4 sheet:**

| Column | Type | Description |
|--------|------|-------------|
| `Utility ID` | float64 | EIA utility ID (3_4 internal) |
| `Utility Name` | str | Utility name (3_4 internal) |
| `Plant Code` | float64 | EIA plant code (= Plant ID, float) |
| `Plant Name_storage` | str | Plant name from 3_4 (suffix to avoid clash) |
| `State` | str | State from 3_4 |
| `County_storage` | str | County from 3_4 |
| `Status_storage` | str | Status from 3_4 |
| `Technology_storage` | str | Technology from 3_4 |
| `Prime Mover` | str | Prime mover from 3_4 |
| `Sector Name` | str | Sector name string |
| `Sector_storage` | float64 | Sector code from 3_4 |
| `Nameplate Capacity (MW)_storage` | float64 | Nameplate MW from 3_4 (cross-check vs base) |
| `Summer Capacity (MW)` | float64 | Net summer capacity |
| `Winter Capacity (MW)` | float64 | Net winter capacity |
| `Operating Month_storage` | float64 | Operating month from 3_4 |
| `Operating Year_storage` | float64 | Operating year from 3_4 |

**BESS-specific columns:**

| Column | Type | Description |
|--------|------|-------------|
| `Nameplate Energy Capacity (MWh)_storage` | object | Energy capacity from 3_4 (cross-check vs base `Nameplate Energy Capacity (MWh)`) |
| `Maximum Charge Rate (MW)` | object | Max power absorption rate (often < nameplate MW) |
| `Maximum Discharge Rate (MW)` | object | Max power output rate (usually = nameplate MW) |
| `Nameplate Reactive Power Rating` | object | MVAr rating for grid reactive power support |
| `Storage Enclosure Type` | str | Physical housing type — see Storage Enclosure Type table |
| `Storage Technology 1` | str | **Primary chemistry** — see Storage Technology table |
| `Storage Technology 2` | str | Secondary chemistry (rare) |
| `Storage Technology 3` | float64 | Tertiary chemistry (very rare) |
| `Storage Technology 4` | float64 | Quaternary chemistry (extremely rare) |

**Coupling flags (how BESS connects to the grid/generation):**

| Column | Type | Description |
|--------|------|-------------|
| `AC Coupled` | str | `Y`/`N` — BESS connects on AC side; can operate independently of paired solar |
| `DC Coupled` | str | `Y`/`N` — BESS shares DC bus with co-located solar; implies solar co-location |
| `DC Tightly Coupled` | str | `Y`/`N` — BESS and solar share single inverter; cannot operate independently |
| `Independent` | str | `Y`/`N` — Standalone BESS, not coupled to any generation asset |
| `Direct Support of Another Unit` | str | `Y`/`N` — BESS explicitly supports another generation unit |

**Application flags (Y/N — what the BESS is used for):**

| Column | Description |
|--------|-------------|
| `Arbitrage` | Charge during low-price periods, discharge during high-price periods |
| `Frequency Regulation` | Fast frequency response for grid stability |
| `Load Following` | Match output to load changes |
| `Ramping / Spinning Reserve` | Rapid ramp to cover generation shortfalls |
| `Co-Located Renewable Firming` | Smooth output from paired solar or wind |
| `Transmission and Distribution Deferral` | Avoid T&D infrastructure upgrades |
| `System Peak Shaving` | Reduce system peak demand |
| `Load Management` | End-use demand management |
| `Voltage or Reactive Power Support` | Grid voltage stability |
| `Backup Power` | Emergency or standby backup |
| `Excess Wind and Solar Generation` | Absorb curtailed renewable generation |

**Direct support plant links (co-location linkage):**

| Column | Type | Description |
|--------|------|-------------|
| `Direct Support Plant ID 1` | object | **EIA Plant ID of primary paired generation asset** — authoritative co-location link |
| `Direct Support Gen ID 1` | str | Generator ID of primary paired asset |
| `Direct Support Plant ID 2` | object | Secondary support plant (if BESS supports multiple) |
| `Direct Support Gen ID 2` | str | Generator ID of secondary asset |
| `Direct Support Plant ID 3` | object | Tertiary support plant |
| `Direct Support Gen ID 3` | str | Generator ID of tertiary asset |
| `Support T&D Asset` | str | `Y`/`N` — BESS supports T&D infrastructure (not a generation asset) |

### Derived columns

| Column | Type | Description |
|--------|------|-------------|
| `duration_hours` | float64 | `Nameplate Energy Capacity (MWh)` ÷ `Nameplate Capacity (MW)` — null when either is null/zero. Stats: mean=2.57h, median=2.03h, range=0.03–20.7h |

---

## Enum tables

### `Storage Technology 1` values (battery chemistry)

| Code | Meaning | Count (operating + planned) |
|------|---------|---------------------------|
| `LIB` | Lithium-Ion Battery | 752 (~96%) |
| `OTH` | Other | 8 |
| `NIB` | Sodium-Ion Battery | 8 |
| `FLB` | Flow Battery | 3 |
| `PBB` | Lead-Acid Battery | 2 |
| `NAB` | Sodium-Sulfur Battery | 1 |
| `MAB` | Metal-Air Battery | 1 |
| (null) | Not matched to 3_4 Annual or not reported | ~13 |

### `Storage Enclosure Type` values

| Code | Meaning |
|------|---------|
| `CS` | Container/Shipping container |
| `CT` | Cabinet |
| `BL` | Building |
| `OT` | Other |

### `duration_hours` buckets (derived — compute from column)

The lab defines duration buckets as:

| Bucket | Range | Description |
|--------|-------|-------------|
| `1h` | < 1.5 hours | Short-duration (frequency regulation, arbitrage) |
| `2h` | 1.5 – 2.5 hours | Standard 2-hour duration |
| `4h` | 2.5 – 5.0 hours | 4-hour duration (dominant IRA incentive tier) |
| `long` | > 5.0 hours | Long-duration storage |

To add as a derived column:
```python
bins = [0, 1.5, 2.5, 5.0, float('inf')]
labels = ['1h', '2h', '4h', 'long']
bess['duration_bucket'] = pd.cut(bess['duration_hours'], bins=bins, labels=labels)
```

### Coupling type (derive from flags)

The `AC Coupled`, `DC Coupled`, `DC Tightly Coupled`, and `Independent` flags can be combined to classify co-location type. The lab's derived `colocation_type` column is **not present** in the riorg parquet — compute it with:

```python
def classify_colocation(row):
    am = pd.read_parquet('data/base/asset_master.parquet')
    plant_has_solar = am[
        (am['Plant ID'] == row['Plant ID']) & (am['Energy Source Code'] == 'SUN')
    ].shape[0] > 0
    plant_has_wind = am[
        (am['Plant ID'] == row['Plant ID']) & (am['Energy Source Code'] == 'WND')
    ].shape[0] > 0
    
    if row['Independent'] == 'Y':
        return 'standalone'
    elif plant_has_solar:
        return 'solar_bess_same_plant'
    elif plant_has_wind:
        return 'wind_bess'
    # ... etc.
```

---

## Key nuances

### `colocation_type` and `duration_bucket` are NOT in the parquet
The riorg `schema.py` defines these derived columns but the current `bess_enriched.parquet` only contains `duration_hours`. Both must be computed in analysis code if needed.

### `Nameplate Energy Capacity (MWh)` can be null
~450 of 1,331 BESS rows have null `Nameplate Energy Capacity (MWh)`. These are mostly planned units where the energy capacity hasn't been filed. `duration_hours` will be null for these rows.

### Operable wins over Proposed in deduplication
When the same `(Plant Code, Generator ID)` appears in both 3_4 Operable and Proposed sheets, the Operable row wins. This handles plants that were in "Proposed" in a prior filing but transitioned to "Operable" in the current year.

### `Direct Support Plant ID 1` links to solar/wind plants at a different Plant ID
For cross-plant hybrids, the BESS and its supported generation may be at different EIA Plant IDs. Always check `Direct Support Plant ID 1` to find the linked generation plant, not just the BESS's own `Plant ID`.

---

## Example queries

```python
import pandas as pd

bess = pd.read_parquet('data/dimensions/engineering/bess_enriched.parquet')
am = pd.read_parquet('data/base/asset_master.parquet')

# Operating BESS by chemistry and duration
op_bess = bess[bess['status_note'] == 'OP'].copy()
op_bess['duration_bucket'] = pd.cut(
    op_bess['duration_hours'],
    bins=[0, 1.5, 2.5, 5.0, float('inf')],
    labels=['1h', '2h', '4h', 'long']
)
summary = op_bess.groupby(['Storage Technology 1', 'duration_bucket']).agg(
    n=('Plant ID', 'count'),
    total_mw=('Nameplate Capacity (MW)', 'sum'),
    total_mwh=('Nameplate Energy Capacity (MWh)', lambda x: pd.to_numeric(x, errors='coerce').sum())
)

# BESS at same plant as solar (same-plant co-location)
solar_plant_ids = set(am[am['Energy Source Code'] == 'SUN']['Plant ID'])
solar_bess = bess[bess['Plant ID'].isin(solar_plant_ids)][
    ['Plant Name', 'Plant State', 'Nameplate Capacity (MW)', 'Nameplate Energy Capacity (MWh)', 'AC Coupled', 'DC Coupled']
]

# Cross-plant BESS (Direct Support Plant ID points to a different plant)
cross_plant = bess[
    bess['Direct Support Plant ID 1'].notna() &
    (bess['Direct Support Plant ID 1'] != bess['Plant ID'].astype(str))
][['Plant Name', 'Plant State', 'Nameplate Capacity (MW)', 'Direct Support Plant ID 1']]

# Frequency regulation providers
freq_reg = bess[bess['Frequency Regulation'] == 'Y'][
    ['Plant Name', 'Plant State', 'Nameplate Capacity (MW)', 'duration_hours', 'Storage Technology 1']
].sort_values('Nameplate Capacity (MW)', ascending=False)

# Planned pipeline: capacity and MWh by state
planned = bess[bess['status_note'] == 'PL'].groupby('Plant State').agg(
    n_projects=('Plant ID', 'nunique'),
    total_mw=('Nameplate Capacity (MW)', 'sum'),
    total_mwh=('Nameplate Energy Capacity (MWh)', lambda x: pd.to_numeric(x, errors='coerce').sum())
).sort_values('total_mw', ascending=False)
```
