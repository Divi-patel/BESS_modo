# EIA BESS Data Coverage, Co-Location Detection, and Modeling Data Inventory

**Purpose**: Document how battery energy storage (BESS) assets are represented across EIA-860 annual and EIA-860M, what BESS-specific fields exist, how to detect co-location with solar/wind, and — critically — what data is and isn't available for dispatch/revenue modeling.

**Status**: Updated February 2026 after `bess_enriched` table was built in `energy_assets.duckdb`. Sections 4 and 8 reflect current state.

**Files explored / built from**:
- `asset_sources/raw/eia860/eia8602024/3_4_Energy_Storage_Y2024.xlsx`
- `asset_sources/raw/eia860m/eia860m_generator_2025_08.xlsx`
- `asset_products/data/asset_master.parquet`
- `asset_products/data/energy_assets.duckdb` → `bess_enriched` table (1,331 rows, 93 cols)

---

## 1. How BESS Appears in the Main Generator File (860M / 3_1_Generator)

In both EIA-860M (`Operating` / `Planned` tabs) and EIA-860 annual (`3_1_Generator`), every generator — including BESS — is a single row. BESS rows are identified by:

| Column | Value | Meaning |
|--------|-------|---------|
| `Prime Mover Code` | `BA` | Battery (all chemistries) |
| `Energy Source Code` | `MWH` | Megawatt-hours (storage, not a fuel) |
| `Technology` | `Batteries` | Full text label |

**These are the only identifiers in the main generator file.** No chemistry, no coupling, no use-case flags.

### Scale in current data

| Source | Sheet | BESS rows |
|--------|-------|-----------|
| EIA-860M Aug 2025 | Operating | **883** |
| EIA-860M Aug 2025 | Planned | **449** |
| EIA-860 Annual 2024 | 3_1_Generator (Operable) | included in 3_4 crosswalk |
| asset_master.parquet | (both tabs combined) | **1,331** |

---

## 2. The Dedicated Storage Sheet: `3_4_Energy_Storage`

EIA-860 annual includes a **dedicated storage schedule** (`3_4_Energy_Storage_Y2024.xlsx`) that is **not in 860M** and is **not currently used in the asset_master build**. It is the richest source of BESS-specific data EIA publishes.

### Sheets

| Sheet | Rows (2024) | Notes |
|-------|-------------|-------|
| Operable | **786** | Commissioned/operating BESS |
| Proposed | **559** | In development pipeline |
| Retired and Canceled | **107** | Historical |

### Capacity snapshot (from 3_4, 2024)

| Status | MW | MWh |
|--------|----|-----|
| Operable | **27,820 MW** | **74,396 MWh** |
| Proposed | **74,638 MW** | **223,561 MWh** |

The proposed pipeline is nearly **3x** the installed base by MW — showing how front-loaded the BESS build-out still is.

### Additional columns in 3_4 vs main generator sheet

The storage schedule adds ~35 columns not present in 3_1_Generator or 860M:

#### Chemistry / Technology
| Column | Values seen (Operable) | Notes |
|--------|----------------------|-------|
| `Storage Technology 1` | LIB (754), OTH (8), NIB (8), FLB (3), PBB (2), NAB (1), MAB (1) | Lithium-ion dominates at 96% |
| `Storage Technology 2–4` | Rare; used for hybrid chemistry units | |
| `Storage Enclosure Type` | CS=Container (679), CT=Cabinet (59), BL=Building (36), OT=Other (9) | |

#### Coupling type (how BESS connects to paired generator)
| Column | Operable count (Y) | Meaning |
|--------|-------------------|---------|
| `AC Coupled` | 211 | BESS connects on AC side of inverter |
| `DC Coupled` | 94 | BESS shares DC bus with solar array |
| `DC Tightly Coupled` | 50 | BESS and solar share a single inverter (no independent AC path) |
| `Independent` | 9 | Standalone, not coupled to any generation asset |

353 of 786 operable BESS units have at least one coupling flag set (45%).

#### Use-case / application flags (Y/N columns)
| Application | Operable count |
|-------------|---------------|
| Frequency Regulation | 218 |
| Arbitrage | 194 |
| Excess Wind and Solar Generation | 188 |
| Ramping / Spinning Reserve | 184 |
| System Peak Shaving | 177 |
| Voltage or Reactive Power Support | 114 |
| Load Management | 75 |
| Load Following | 66 |
| Co-Located Renewable Firming | 58 |
| Backup Power | 46 |
| Transmission and Distribution Deferral | 38 |

Note: units can and do have multiple flags. These are self-reported by the owner.

#### Charge/discharge rates
| Column | Notes |
|--------|-------|
| `Maximum Charge Rate (MW)` | Often different from nameplate MW |
| `Maximum Discharge Rate (MW)` | Usually equals nameplate MW |

---

## 3. Co-Location Detection: How It Works

EIA uses two overlapping mechanisms to express that a BESS is co-located with a solar/wind generator. Understanding both is critical to avoid double-counting and to correctly label hybrid assets.

### Mechanism A: Same Plant ID (main generator file)

The simplest signal. If a `Plant ID` has both a `BA` row and a `PV` row (or `WT`), the BESS and the solar/wind are at the same registered plant site.

```
Plant ID 66774 → Ash Creek Solar (PV, 408.9 MW, OP)
Plant ID 66391 → Ash Creek BESS  (BA, 306.0 MW, PL)   ← different Plant ID!
```

**Caveat**: Co-located assets are sometimes registered under different Plant IDs when:
- The BESS is developed later (separate interconnection application)
- A different legal entity owns the BESS vs the solar plant
- EIA assigns them separately due to different COD years

This means **same Plant ID = definitely co-located**, but **different Plant ID ≠ definitely not co-located**. Geographic proximity check (lat/lon) is needed for the second case.

### Mechanism B: Direct Support columns (3_4 storage sheet only)

The `3_4_Energy_Storage` sheet has explicit linkage fields:

| Column | Meaning |
|--------|---------|
| `Direct Support Plant ID 1` | Plant ID of the generation asset this BESS directly supports |
| `Direct Support Gen ID 1` | Generator ID within that plant |
| `Direct Support Plant ID 2/3` | For BESS supporting multiple generators |
| `Direct Support Gen ID 2/3` | |

All 786 operable rows have a `Direct Support Plant ID 1` value — meaning **EIA always intends a BESS to be linked to a host unit**, even if that host is the same plant. This is the most authoritative co-location linkage EIA provides.

Example from DC Coupled sample:
```
RE Tranquillity BESS1 (37 MW) → Direct Support Plant 59939, Gen TQ  (its paired solar)
RE Garland BESS1 (45 MW)      → Direct Support Plant 60233, Gen PV2 (its paired solar)
```

### Mechanism C: Coupling flags

`DC Coupled` and `DC Tightly Coupled = Y` are strong indicators of solar+storage hybrids specifically (DC coupling only makes sense with a co-located solar inverter). `AC Coupled` could be co-located or standalone-behind-meter.

### Summary: Co-location detection logic

| Signal | Confidence | Source |
|--------|-----------|--------|
| Same Plant ID + BA + PV/WT rows | High | 860M / 3_1_Generator |
| `Direct Support Plant ID 1` pointing to a solar/wind plant | Authoritative | 3_4 storage sheet only |
| `DC Coupled = Y` or `DC Tightly Coupled = Y` | High (implies solar) | 3_4 storage sheet only |
| `AC Coupled = Y` | Medium | 3_4 storage sheet only |
| `Co-Located Renewable Firming = Y` | Medium | 3_4 storage sheet only |
| Lat/lon proximity within ~1 km | Medium (fuzzy) | 860M / 3_1_Generator |

---

## 4. ✅ RESOLVED: 3_4 Now Joined in `bess_enriched`

`asset_master.parquet` still does not join 3_4 (by design — master stays lean). But `energy_assets.duckdb` → `bess_enriched` now contains the full enriched BESS table:

- All 52 asset_master columns (location, capacity, ownership, BA, NERC, etc.) ✓
- All 3_4_Energy_Storage columns: chemistry, coupling, use-case flags, Direct Support linkage ✓
- Derived: `implied_duration_hr`, `duration_bucket`, `colocation_type`, `supported_tech`, `supported_mw` ✓

**Match rate**: 1,318 / 1,331 rows matched to 3_4 (99.0%). 13 rows are 2025 commissions not yet in 2024 annual — they retain all asset_master columns with null 3_4 enrichment.

See `asset_products/data/schema/energy_assets_duckdb_schema.md` for the full column reference and build flow diagram.

---

## 5. 860M vs 860 Annual for BESS

| Dimension | EIA-860M (Aug 2025) | EIA-860 Annual (2024) |
|-----------|--------------------|-----------------------|
| Freshness | ~8 months more recent | Annual, lags real-time |
| BESS operating count | 883 | 786 |
| BESS planned count | 449 | 559 |
| Storage-specific fields | None beyond basic | Full 3_4 schedule (~35 cols) |
| Co-location linkage | Same Plant ID only | Direct Support columns |
| Use-case flags | No | Yes |
| Coupling type | No | Yes |
| Chemistry | No | Yes (Storage Technology 1–4) |

**Practical approach**: Use 860M for current operating status and pipeline freshness; join 860 annual 3_4 for the rich storage attributes.

---

## 6. Status Codes in Proposed Sheet (3_4)

| Code | Count | Meaning |
|------|-------|---------|
| P | 157 | Planned for installation, regulatory approvals not initiated |
| L | 112 | Under construction, less than or equal to 50% complete |
| U | 103 | Under construction, more than 50% complete |
| V | 95 | Under construction, regulatory approvals received |
| T | 51 | Regulatory approvals pending |
| TS | 41 | Construction complete but not yet in commercial operation |

Same status codes as main generator file — see `eia860m_vs_annual_lifecycle_status_and_coverage.md` for full reference.

---

## 7. Top States

### Operable BESS (by unit count)
CA (227) > TX (136) > MA (117) > NY (48) > AZ (35) > NC (33)

### Proposed BESS (by unit count)
TX (191) > CA (137) > AZ (44) > NY (24) > MA (17) > NV (13) > NM (13)

Texas is already the #2 installed market and the #1 pipeline market — driven by ERCOT's energy-only market structure creating strong arbitrage revenue.

---

## 8. Status of Original Open Questions

| # | Question | Status |
|---|---|---|
| 1 | Join 3_4 into enriched dataset | ✅ Done — `bess_enriched` in `energy_assets.duckdb` |
| 2 | Resolve cross-Plant co-location | ✅ Done — `colocation_type` derived col; Direct Support resolved |
| 3 | Hybrid asset classification | ✅ Done — `colocation_type`: `solar_bess_same_plant` / `cross_plant` / `wind_bess` / `standalone` |
| 4 | Duration distribution | ✅ Done — `implied_duration_hr` + `duration_bucket` (1h/2h/4h/long) |
| 5 | 860M storage gap (97 2025 builds) | ✅ Handled — present in table with null 3_4 cols, not dropped |

---

## 9. BESS Modeling Data Inventory

What data exists in `bess_enriched` for modeling, what it enables, and what's still missing.

### What we have (from `bess_enriched`)

#### Location and physical

| Data | Column(s) | Modeling use |
|---|---|---|
| Lat/lon | `Latitude`, `Longitude` | Siting, transmission distance, climate zone |
| State / county | `Plant State`, `County` | Regulatory zone, incentives, rate tariff lookup |
| Street address | `street_address`, `city`, `zip_code` | Physical inspection, permit lookup |
| Grid voltage | `Grid Voltage (kV)` | Interconnection level (distribution vs transmission) |

#### Capacity and power

| Data | Column(s) | Modeling use |
|---|---|---|
| Power rating | `Nameplate Capacity (MW)` | Dispatch MW limit |
| Energy capacity | `Nameplate Energy Capacity (MWh)` | Dispatch MWh limit |
| Charge rate | `Maximum Charge Rate (MW)` | Charge ramp constraint. Avg = 93% of nameplate |
| Discharge rate | `Maximum Discharge Rate (MW)` | Discharge ramp constraint. Avg = 95% of nameplate |
| Implied duration | `implied_duration_hr` (derived) | Storage hours = MWh ÷ MW |
| Duration bucket | `duration_bucket` | 1h / 2h / 4h / long |

**Duration distribution (operating fleet, actual from data):**

| Bucket | Units | MW | MWh | Avg hours |
|---|---|---|---|---|
| 4h | 334 | 19,278 | 76,318 | 3.89h |
| 1h | 268 | 9,208 | 9,070 | 0.95h |
| 2h | 247 | 6,922 | 13,935 | 2.01h |
| long (>5h) | 32 | 368 | 2,259 | 6.71h |

#### Chemistry and technology

| Data | Column(s) | Modeling use |
|---|---|---|
| Chemistry | `Storage Technology 1–4` | Round-trip efficiency estimate (see derived below) |
| Enclosure type | `Storage Enclosure Type` | Thermal management context (container vs building) |

Chemistry breakdown (operating): LIB 96%, OTH/NIB ~1% each, FLB/PBB/NAB/MAB <1%.

#### Grid and market context

| Data | Column(s) | Modeling use |
|---|---|---|
| Balancing Authority | `Balancing Authority Code`, `Balancing Authority Name` | Market rules, ancillary services eligibility |
| NERC Region | `NERC Region` | Grid constraints, reserve requirements |
| LMP node | `RTO/ISO LMP Node Designation` | Price signal for dispatch optimization |
| LMP node coverage | 70 / 882 operating (8%) | **Major gap** — only 8% have a node populated |

**Top markets (operating BESS by MW):**
CISO 14.5 GW > ERCO 10.1 GW > AZPS 2.2 GW > SRP 1.1 GW > NEVP 1.0 GW

#### Revenue / application intent

| Data | Column(s) | Modeling use |
|---|---|---|
| 11 use-case flags | `Arbitrage`, `Frequency Regulation`, `System Peak Shaving`, etc. | Owner-stated revenue streams — seed for dispatch strategy assumptions |
| Ownership | `owner_names`, `percent_owned`, `Entity Type` | Counterparty, utility vs IPP structure |

Most common standalone BESS use-case: Frequency Regulation + Arbitrage. Most common solar+BESS: Co-Located Renewable Firming + Excess Wind/Solar.

#### Co-location and hybrid context

| Data | Column(s) | Modeling use |
|---|---|---|
| Colocation type | `colocation_type` | Whether BESS is modeled paired or independently |
| Supported asset | `supported_tech`, `supported_mw` | Paired generation capacity ratio (BESS MW / solar MW) |
| Coupling type | `AC Coupled`, `DC Coupled`, `DC Tightly Coupled` | Charge path efficiency; DC coupling = BESS charges direct from solar, no inverter loss |

**Coupling by colocation type (operating):**
- Standalone (449 units): 2 AC, 0 DC — expected, no paired generator
- Solar same plant (403 units): 216 AC, 92 DC, 52 DC tight — ~36% are DC coupled

---

### What can be derived / estimated (not in EIA)

These are not in `bess_enriched` but can be added as estimated fields based on what we have:

| Derived field | Estimation method | Reliability |
|---|---|---|
| `est_round_trip_efficiency` | By chemistry: LIB → 88%, FLB → 75%, NIB → 80%, default → 85% | Medium — LIB is homogeneous enough |
| `est_c_rate` | `Maximum Charge Rate (MW)` ÷ `Nameplate Energy Capacity (MWh)` | High — directly computable |
| `est_cycle_life` | By chemistry: LIB → ~3,000–5,000 cycles, FLB → ~10,000+ | Low — varies by vendor/chemistry subtype |
| `est_degradation_pct_per_year` | LIB → ~2–3%/yr capacity fade | Low — highly variable |
| `est_soc_min_pct` / `est_soc_max_pct` | Standard LIB operating window → 10% / 90% | Medium |

---

### What's genuinely missing (not in any EIA source)

These require non-EIA data sources or direct developer information:

| Missing data | Why it matters | Potential source |
|---|---|---|
| **LFP vs NMC chemistry within LIB** | Different RTE, degradation, temperature profiles | Developer disclosure, permit filings |
| **Actual LMP node** (92% null) | Required for dispatch revenue modeling | CAISO/ERCOT/MISO node mapping tables |
| **Interconnection export limits** | BESS may be curtailed by interconnection agreement | ISO interconnection queues, LGIA |
| **Contract structure** (PPA, merchant, capacity) | Determines dispatch objective | FERC EQR, regulatory filings |
| **Augmentation schedule** | LIB degrades — contracts often include battery augmentation | Developer/offtaker agreement |
| **State of charge at any time** | Operational state needed for real-time dispatch | SCADA / operational data |
| **Actual charge/discharge cycles** | Degradation tracking | Meter/SCADA data |

---

## 10. LMP Node Deep-Dive: Gap Analysis, Examples, and Fill Strategies

### What the column is and where it comes from

**Column**: `RTO/ISO LMP Node Designation`  
**Flow**: EIA-860 annual `3_1_Generator_Y2024.xlsx` col 14 → `asset_master.parquet` → `bess_enriched`  
**Also present**: `RTO/ISO Location Designation for Reporting Wholesale Sales Data to FERC` (companion FERC reporting column, similar fill rate)

EIA does not assign or validate node names. **Operators self-report** on Form 860 Schedule 3. This is why coverage is so sparse — many developers don't fill it in, or haven't been assigned a settlement point name by the ISO yet.

**Important**: EIA-860 has **only these two node-related columns**. There is no separate "hub node" or "load zone" column anywhere in the raw 860 data. The `RTO/ISO LMP Node Designation` field serves as both a resource node and hub node column depending on what the operator fills in.

---

### The gap: BESS vs all generators

| Scope | Filled | Total | Fill rate |
|---|---|---|---|
| All generators in 3_1_Generator (Operable) | 5,569 | 26,856 | **20.7%** |
| All generators in asset_master | similar | 29,172 | ~19% |
| Operating BESS in bess_enriched | **70** | **882** | **8%** |

BESS have significantly worse coverage than the overall fleet. Gas and coal plants (which actively trade at specific nodes and have had years of ISO reporting) have much higher fill rates. BESS is newer, and many operators simply haven't filled in the field.

**By BA — BESS with node populated vs missing:**

```
BA        With node   MW      Without node   MW (missing)
─────────────────────────────────────────────────────────
CISO      21          851 MW  240            13,634 MW   ← 96% of CAISO BESS MW has no node
ERCO      25        2,307 MW  131             7,801 MW   ← 77% of ERCOT BESS MW has no node
ISNE       9           47 MW  (most covered)
PJM        9           89 MW
MISO       4           14 MW  28                603 MW
AZPS       2           60 MW  20              2,177 MW
```

CAISO and ERCOT together account for ~28 GW of operating BESS — and the vast majority have no node.

---

### What populated nodes actually look like

The node naming format is **completely different per ISO** — no standardization across markets:

```
ISO     Example node values                     Type
────────────────────────────────────────────────────────────────
ERCOT   COSTAL, HOUSTON, NORTH, WEST            Load zone / hub names
        TRICRN1_5, ANEM_ES_RN, WAL_RN           Resource nodes (_RN suffix)
        GIGA_ESS_RN, CNLY_ESS_RN, STEAM_ENG123  Resource nodes (ESS = energy storage)
        CORALSLR_ALL                             Aggregate settlement point (_ALL)

CAISO   PHSP15                                  Pricing node (short code)
        REDBLUFF_2_B1                            Pricing node (node_unit format)
        CENTPD_2_BMSX2-APND                      Aggregate Pricing Node (-APND suffix)
        DR_1_RDROCKSLR-APND                      Aggregate PNode (includes plant name hint)

ISO-NE  (numeric IDs, zone names like CT, NEMA)
PJM     1123180710, 1123180711                   Numeric PNODE IDs
MISO    (zone-based, e.g. MISO.INDIANA.HUB)
```

**Real examples from the 70 BESS with nodes populated:**

| Plant | State | BA | Node | MW | Type |
|---|---|---|---|---|---|
| SMT Ironman Battery Storage | TX | ERCO | `COSTAL` | 304 | ERCOT load zone hub |
| Anole Energy Storage | TX | ERCO | `TRICRN1_5` | 240 | ERCOT resource node |
| Citadel Battery Storage | TX | ERCO | `HOUSTON` | 204 | ERCOT load zone hub |
| Anemoi Energy Storage | TX | ERCO | `ANEM_ES_RN` | 200 | ERCOT resource node |
| Sealy BESS | TX | ERCO | `WAL_RN` | 200 | ERCOT resource node |
| Edwards Sanborn E1A | CA | CISO | `PHSP15` | 144 | CAISO pricing node |
| Oberon Solar Project | CA | CISO | `REDBLUFF_2_B1` | 125 | CAISO pricing node |
| Wigeon Whistle BESS | TX | ERCO | `NORTH` | 120 | ERCOT load zone hub |
| Blythe Mesa Solar II | CA | CISO | `CENTPD_2_BMSX2-APND` | 112 | CAISO aggregate PNode |

Notice ERCOT reports a **mix of hub-level** (`COSTAL`, `HOUSTON`, `NORTH`, `WEST`) and **resource-node-level** (`TRICRN1_5`, `ANEM_ES_RN`) — this is because operators choose their own level of specificity. Hub-level nodes are sufficient for revenue estimation using published hub prices; resource nodes require individual settlement data.

---

### Why the existing hub-node autofill is not enough for BESS

The existing approach for solar/wind fills a hub node using the ISO load zone based on geographic location (e.g., ERCOT plant in North Texas → assign `NORTH`). This works reasonably well for solar and wind because:
- Generation revenue is primarily energy sales at or near hub prices
- Hub price is a good approximation for many plants

For BESS, hub-level is **less sufficient** because:
1. **Arbitrage revenue depends on nodal price spread**, not just hub price level. A BESS at `COSTAL` hub has very different arbitrage opportunity than one at `TRICRN1_5` (a constrained node with higher price spikes)
2. **Ancillary services (frequency regulation, spinning reserve)** clear at the BA/market level, not the node — so for those applications, hub is fine
3. **Congestion revenue** is entirely node-specific and invisible at the hub level
4. ERCOT specifically has large hub-to-resource-node price divergence during constraint events (e.g., winter storms)

For a **portfolio-level** view, hub assignment is acceptable. For **site-specific dispatch modeling**, resource node assignment is required.

---

### Fill strategies for the missing 92%

In order of accuracy and effort:

> **Prior work note**: A nodal/hub standardization script already exists in a separate project folder (to be shared). Review that before building from scratch — it may already cover the ISO mapping and hub assignment logic described below, and should be extended to handle BESS rather than rebuilt.

#### Strategy 1 — ISO settlement point mapping files (best accuracy)

Every ISO publishes a generator-to-settlement-point mapping. These are the authoritative sources:

| ISO | Source | What it provides | Update freq |
|---|---|---|---|
| **ERCOT** | ERCOT MIS "Settlement Point Mapping" | UNIT_CODE → settlement point name (hub or resource node) | Daily |
| **CAISO** | CAISO OASIS `pnode_map` API | Plant → PNode ID | Weekly |
| **MISO** | MISO Market Portal generator lookup | Unit → pricing node | Monthly |
| **PJM** | PJM Data Miner `gen_by_fuel` | Generator → PNODE ID | Monthly |
| **ISO-NE** | ISO-NE SMD Data Hub | Generator → zone/node | Monthly |
| **SPP** | SPP Market Portal | Generator → pricing node | Monthly |

Join key: typically EIA Plant ID or unit name cross-referenced to ISO unit ID. Match rate is high for operating commercial plants — most have ISO registration.

**Output**: Resource-node-level pricing node → highest accuracy for dispatch modeling.

#### Strategy 2 — Hub / load zone assignment (existing approach, extend to BESS)

Assign the ISO hub or load zone based on geographic location. Sufficient for portfolio-level revenue estimates and ancillary service revenue.

| ISO | Load zones / hubs | Assignment method |
|---|---|---|
| ERCOT | NORTH, SOUTH, HOUSTON, WEST, PANHANDLE | Geographic boundary shapefiles (ERCOT publishes) |
| CAISO | NP15, SP15, ZP26 | Geographic / utility service territory |
| MISO | ~10 local resource zones (LRZs) | Geographic lookup |
| PJM | ~20 load zones (AEP, BGE, COMED...) | Utility service territory |
| ISO-NE | CT, ME, NH, VT, NEMA, SEMA, RI, WMA | State/county |
| SPP | North, South | Geographic |

**Limitation for BESS**: Misses congestion component, underestimates arbitrage for constrained nodes. Still useful for frequency regulation and capacity revenue modeling.

#### Strategy 3 — Cross-reference with FERC EQR (partial)

FERC Electric Quarterly Reports (EQR) contain settlement point names for entities that report wholesale transactions. BESS participating in energy markets would appear here. Coverage is partial but skews toward the larger / more active units.

#### Strategy 4 — Name-based inference (low accuracy, last resort)

Some ERCOT resource nodes embed the plant name (e.g., `ANEM_ES_RN` → Anemoi, `CORALSLR_ALL` → Coral/Copperhead Solar). Fuzzy matching from plant name to ISO unit database. Unreliable and should only fill remaining gaps after strategies 1–3.

---

### Recommended approach

```
For each operating BESS:
  1. Try ISO settlement point mapping file (Strategy 1)
     → fills ~70-80% of CAISO/ERCOT/PJM/MISO BESS with resource node
  2. Fall back to hub/load zone assignment (Strategy 2)
     → fills remaining BESS with zone-level node
  3. Store result in two new columns:
     - pricing_node_id     (ISO settlement point ID — from Strategy 1 or null)
     - pricing_node_hub    (ISO load zone / hub — from Strategy 2, always filled)
     - pricing_node_source ('iso_mapping' / 'eia_self_reported' / 'hub_geo_assign')
```

This gives every BESS a hub-level node (always), and a resource node where achievable (70-80% of CAISO/ERCOT units), with clear provenance on which fill strategy was used.

---

## 11. Next Steps (as of Feb 2026)

1. **LMP node enrichment** — see Section 10 for full strategy. Priority order: ISO settlement point mapping files (Strategy 1) for CAISO/ERCOT/PJM/MISO → hub/zone assignment fallback (Strategy 2). Add `pricing_node_id`, `pricing_node_hub`, `pricing_node_source` to `bess_enriched`.
2. **Estimated RTE field** — add `est_round_trip_efficiency` to `bess_enriched` based on `Storage Technology 1` code. Small addition, big modeling impact.
3. **Derived C-rate** — add `est_c_rate = Maximum Charge Rate ÷ Nameplate Energy Capacity`. Useful for distinguishing power-focused (high C-rate) vs energy-focused (low C-rate) dispatch.
4. **Cross-plant solar pairing** — 7 `solar_bess_cross_plant` units identified. Pull solar specs (DC cap, tracking type) from `solar_enriched` via `Direct Support Plant ID 1` to model paired dispatch.
5. **Turbine curves analog for BESS** — similar to how we have turbine power curves for wind, a battery dispatch curve (power vs SOC vs temperature) would improve accuracy. No standard EIA source; would need to be built from chemistry assumptions.
