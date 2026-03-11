# Gen 1 BESS Dispatch MVP — Revised Implementation Plan

## Context

**Why:** Modo Energy Open Tech Challenge submission. Deadline: March 11, 2026.

**What changed:** GCS bucket exploration revealed 17 ERCOT assets with complete data — LMP prices at both hub AND node level, generation data, revenue history, and asset metadata. This transforms the project from a generic hub-level analysis into a site-specific co-location study using real infrastructure data.

**Core question this answers:** "If I co-located a 100MW/400MWh battery at an existing ERCOT solar or wind site, what would perfect-foresight arbitrage revenue be at the node vs. the hub, and how does that compare to the generation revenue the asset already earns?"

---

## Current State

| Item | Status |
|------|--------|
| .venv + requirements | DONE |
| NB 01 (hub price download) | DONE — 8 hub parquets in data/prices/ |
| NB 02 (hub price exploration) | DONE — executed with charts |
| NB 03 (dispatch optimizer) | WRITTEN, NOT RUN — needs execution |
| NB 04 (backtest) | NOT STARTED |
| Node prices, generation, revenue data | NOT DOWNLOADED |
| docs/plan/gen1_implementation.md | NOT CREATED |
| README, ai_usage.md | NOT CREATED |
| Git repo | NOT INITIALIZED |

---

## Key Data Discovery

### 6 ERCOT Sites with Complete Nodal Data in GCS

| Site | Type | MW | Resource Node | Hub | GCS Price Data |
|------|------|----|---------------|-----|----------------|
| Lamesa Solar | solar | 102 | LAMESASLR_G | HB_WEST | Yes (DA+RT) |
| Misae Solar | solar | 240 | MISAE_GEN_RN | HB_WEST | Yes (DA+RT) |
| Longhorn Wind | wind | 200 | LHORN_N_U1_2 | HB_WEST | Yes (DA+RT) |
| Panther Creek Wind I | wind | 142.5 | PC_NORTH_1 | HB_WEST | Yes (DA+RT) |
| Spinning Spur Wind III | wind | 194 | SSPURT_WIND1 | HB_WEST | Yes (DA+RT) |
| Stanton Wind Energy | wind | 120 | SWEC_G1 | HB_WEST | Yes (DA+RT) |

All 6 are in HB_WEST (West Texas) — the most volatile hub, where most BESS development is happening.

### Per-Site GCS Data Available
- `lmp_prices/{node}/{da,rt}_hourly.parquet` — Nodal LMP history
- `generation_data/{type}_gen_data/{slug}_generation.parquet` — Generation history
- `revenue_data/{slug}/hub/{da,rt}_historical.parquet` — Pre-computed revenue
- `asset_registry.duckdb` — Full asset metadata + pricing config

---

## Execution Plan

### Step 0: Write Plan Doc (~5 min)
- Create `docs/plan/gen1_implementation.md` capturing this plan

### Step 1: Extend NB 01 — Download Node + Site Data (~15 min)
**File:** `notebooks/01_data_download.ipynb`

Add cells to existing notebook:
1. Download 6 resource node LMP prices (RT + DA) → `data/prices/{NODE}_{rt,da}_hourly.parquet`
2. Download generation data for 6 sites → `data/generation/{slug}_generation.parquet`
3. Download revenue data for 6 sites → `data/revenue/{slug}/hub/{da,rt}_historical.parquet`
4. Download `asset_registry.duckdb` → `data/asset_registry.duckdb`
5. Define master SITES config dict (reused by all notebooks)
6. Validate all downloads with DuckDB

**GCS paths:**
- Node prices: `lmp_prices/{NODE}/rt_hourly.parquet`
- Generation: `generation_data/solar_gen_data/{slug}_generation.parquet` (or wind_gen_data)
- Revenue: `revenue_data/{slug}/hub/rt_historical.parquet`
- Registry: `asset_registry.duckdb`

**SITES config dict:**
```python
SITES = {
    'lamesa_solar':           {'type': 'solar', 'mw': 102,   'node': 'LAMESASLR_G',   'hub': 'HB_WEST'},
    'misae_solar':            {'type': 'solar', 'mw': 240,   'node': 'MISAE_GEN_RN',  'hub': 'HB_WEST'},
    'longhorn_wind':          {'type': 'wind',  'mw': 200,   'node': 'LHORN_N_U1_2',  'hub': 'HB_WEST'},
    'panther_creek_wind_i':   {'type': 'wind',  'mw': 142.5, 'node': 'PC_NORTH_1',    'hub': 'HB_WEST'},
    'spinning_spur_wind_iii': {'type': 'wind',  'mw': 194,   'node': 'SSPURT_WIND1',  'hub': 'HB_WEST'},
    'stanton_wind_energy':    {'type': 'wind',  'mw': 120,   'node': 'SWEC_G1',       'hub': 'HB_WEST'},
}
```

### Step 2: Run NB 03 — Validate Optimizer (~5 min)
**File:** `notebooks/03_dispatch_optimizer.ipynb`

Already fully written. Just execute — verify:
- All 5 sanity tests pass
- 1-week real ERCOT dispatch looks sensible
- No code changes needed

### Step 3: Extend NB 02 — Add Nodal Price Analysis (~20 min)
**File:** `notebooks/02_price_exploration.ipynb`

Add new section at the end: **"Nodal Price Analysis & Basis Risk"**

1. Load 6 node RT prices alongside HB_WEST
2. Basis differential: `basis = node_price - hub_price` per hour
3. Basis time series (daily average, all 6 nodes)
4. Basis distribution (histogram/violin)
5. Monthly average basis (bar chart)
6. Summary table: mean basis, std, % hours node < hub
7. Key narrative: negative basis at wind/solar-heavy nodes due to transmission congestion

### Step 4: Build NB 04 — Full Backtest + Co-Location Analysis (~60 min)
**File:** `notebooks/04_backtest_colocation.ipynb` (NEW)

This is the flagship notebook. Sections:

#### 4a: Setup
- Define `optimize_dispatch()` inline (copy from NB 03 for standalone execution)
- Load all price data, define SITES dict, BESS params (100MW/400MWh/87% RTE)

#### 4b: Monthly Rolling Backtest Function
- `backtest_year(prices_series)` — run optimizer month-by-month, return monthly revenue DataFrame
- Month-by-month is more realistic than full-year perfect foresight and gives monthly granularity

#### 4c: Run Backtest for All Locations
- 4 hubs (RT prices) + 6 nodes (RT prices) = 10 locations
- Focus year: 2024 (or 2025 if complete)
- Output: location, type, month, revenue, cycles, $/kW/yr

#### 4d: Hub Revenue Summary
- Bar chart: annual $/kW/yr by hub
- Monthly revenue heatmap (hub x month)
- Compare to Modo's ~$17/kW actual 2025 ERCOT BESS revenue

#### 4e: Node vs Hub Basis Impact (KEY DIFFERENTIATOR)
- For each of 6 sites: hub_revenue vs node_revenue
- Basis impact = node_rev - hub_rev (usually negative = congestion penalty)
- Bar chart comparing hub vs node per site
- Table: site, type, MW, hub_rev, node_rev, basis_impact_pct

#### 4f: Co-Location Analysis (FLAGSHIP)
- Load generation revenue from `data/revenue/{slug}/hub/rt_historical.parquet`
- Compare solar/wind merchant $/kW/yr to BESS arbitrage $/kW/yr
- Comparison table: solar/wind rev, BESS hub rev, BESS node rev, combined value
- Stacked bar chart showing combined revenue potential

#### 4g: Key Findings
- 3-5 bullet points with specific numbers
- "Hub-based BESS analysis overstates revenue by X% at West Texas nodes"
- "Perfect foresight BESS arbitrage at HB_WEST: $X/kW/yr vs Modo's $17/kW actual"
- Summer concentration analysis

### Step 5: README + Docs (~15 min)

**`README.md`:**
- Title, problem, approach, key findings (with numbers)
- Data sources, how to run, notebook guide
- Scope note about production infra in other projects

**`docs/ai_usage.md`:**
- Required by Modo challenge rules
- Claude Code used for architecture planning, code generation, data exploration

**`docs/plan/gen1_implementation.md`:**
- Copy of this plan (already created in Step 0)

### Step 6: Git Init + Push (~5 min)
- `git init`, `.gitignore` already exists
- Stage notebooks, src (if any), docs, README, requirements.txt, config files
- Do NOT stage `data/` (large parquets), `.venv/`
- Commit + push to GitHub

---

## Data Directory Structure (After Step 1)

```
data/
├── prices/                          # Hub + Node LMP
│   ├── HB_HOUSTON_{rt,da}_hourly.parquet    (existing)
│   ├── HB_NORTH_{rt,da}_hourly.parquet      (existing)
│   ├── HB_SOUTH_{rt,da}_hourly.parquet      (existing)
│   ├── HB_WEST_{rt,da}_hourly.parquet       (existing)
│   ├── LAMESASLR_G_{rt,da}_hourly.parquet   (new)
│   ├── MISAE_GEN_RN_{rt,da}_hourly.parquet  (new)
│   ├── LHORN_N_U1_2_{rt,da}_hourly.parquet  (new)
│   ├── PC_NORTH_1_{rt,da}_hourly.parquet    (new)
│   ├── SSPURT_WIND1_{rt,da}_hourly.parquet  (new)
│   └── SWEC_G1_{rt,da}_hourly.parquet       (new)
├── generation/                      # Site generation history (new)
│   ├── lamesa_solar_generation.parquet
│   ├── misae_solar_generation.parquet
│   ├── longhorn_wind_generation.parquet
│   ├── panther_creek_wind_i_generation.parquet
│   ├── spinning_spur_wind_iii_generation.parquet
│   └── stanton_wind_energy_generation.parquet
├── revenue/                         # Site revenue history (new)
│   └── {slug}/hub/{da,rt}_historical.parquet
├── asset_registry.duckdb            (new)
├── bess_enriched.parquet            (existing)
└── extra/                           (existing)
```

---

## BESS Configuration

```
Power:    100 MW
Energy:   400 MWh (4-hour duration)
RTE:      87% (LFP typical)
SOC:      5%–95% bounds
η_ch:     √0.87 ≈ 0.933
η_dis:    √0.87 ≈ 0.933
Interval: 1 hour (matches GCS data)
```

---

## What Differentiates This Submission

1. **Real infrastructure sites** — not hypothetical; uses actual ERCOT solar/wind assets from a production pipeline
2. **Nodal pricing** — 6 resource nodes with full LMP history, not just hub-level analysis
3. **Basis risk quantification** — shows how nodal congestion reduces BESS revenue vs hub assumptions
4. **Co-location economics** — compares BESS arbitrage to existing solar/wind generation revenue
5. **Production data provenance** — GCS pipeline, asset registry, 55k pricing nodes with coordinates
6. **$/kW/yr metric** — matches Modo's own BESS Index exactly

---

## Verification

- NB 01: All node price files download successfully, DuckDB validates schema
- NB 03: All 5 sanity tests pass, real-data dispatch plot is sensible
- NB 04: Results produce $/kW/yr in reasonable range ($50–150 perfect foresight vs ~$17 actual)
- NB 04: Node revenue < hub revenue for congested nodes (expected)
- All notebooks run end-to-end without errors
