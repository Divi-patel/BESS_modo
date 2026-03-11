# Methodology: BESS Perfect-Foresight Dispatch Optimization

## 1. Problem Formulation

### Motivation
Energy arbitrage — buying electricity when cheap, selling when expensive — is the primary revenue stream for standalone BESS in ERCOT. The theoretical maximum revenue under **perfect price foresight** establishes an upper bound that real operators approach but never reach. Comparing this bound to actual realized revenue (Modo's BESS Index ~$17/kW/yr in 2025) quantifies the capture rate and decomposition of the gap.

### Research Questions
1. What is the perfect-foresight arbitrage revenue at each ERCOT hub?
2. How does nodal pricing (resource node vs hub) affect BESS revenue?
3. How do asset design parameters (RTE, duration) affect revenue?
4. What is the DA vs RT market revenue comparison?
5. How does BESS arbitrage revenue compare to co-located generation revenue?

## 2. Mathematical Formulation

### Linear Program (LP)

The dispatch optimization is formulated as a linear program, solved independently for each month to provide monthly revenue granularity and enforce cyclic SOC constraints.

```
    ┌─────────────────────────────────────────────────────────────┐
    │                    LP OPTIMIZATION FLOW                      │
    │                                                              │
    │   ERCOT LMP         Asset Params        Monthly Window       │
    │   prices(t)         P=100MW, E=400MWh   Jan, Feb, ... Dec    │
    │       │              η=0.933                  │               │
    │       ▼                  │                    ▼               │
    │   ┌──────────────────────┴──────────────────────┐            │
    │   │         CVXPY Linear Program                │            │
    │   │                                             │            │
    │   │  max Σ price(t) × [p_dis(t) - p_ch(t)]     │            │
    │   │                                             │            │
    │   │  s.t.  SOC dynamics (energy balance)        │            │
    │   │        Power limits (0 ≤ p ≤ 100 MW)       │            │
    │   │        SOC bounds (20 ≤ soc ≤ 380 MWh)     │            │
    │   │        Cyclic SOC (start = end = 200 MWh)   │            │
    │   └─────────────────┬───────────────────────────┘            │
    │                     ▼                                        │
    │   ┌─────────────────────────────────────┐                    │
    │   │  p_ch(t), p_dis(t), soc(t) for t∈T │                    │
    │   │  Monthly revenue = Σ price × net    │                    │
    │   └─────────────────────────────────────┘                    │
    │                     │                                        │
    │         Sum 12 months → Annual $/kW/yr                       │
    └─────────────────────────────────────────────────────────────┘
```

**Decision Variables:**
- `p_ch(t)` : Charging power at hour t [MW], non-negative
- `p_dis(t)` : Discharging power at hour t [MW], non-negative
- `soc(t)` : State of charge at hour t [MWh], non-negative

**Objective — Maximize Revenue:**

```
max  Σ_{t=1}^{T}  price(t) × Δt × [p_dis(t) - p_ch(t)]
```

where `price(t)` is the LMP at hour t ($/MWh) and `Δt = 1 hour`.

**Constraints:**

1. **SOC dynamics** (energy conservation with efficiency losses):
```
soc(t+1) = soc(t) + η_ch × p_ch(t) × Δt - (1/η_dis) × p_dis(t) × Δt
```

```
    SOC Dynamics — One Charge/Discharge Cycle (4-hour battery)

    SOC
    (MWh)
    380 ┤                    ╭────╮
        │                   ╱      ╲
    300 ┤                  ╱        ╲
        │                 ╱          ╲
    200 ┤────────────────╱            ╲────────────────
        │   idle        ↑ charge      ↑ discharge  idle
    100 ┤            η=0.933       1/η=1.072
        │          (grid→bat)     (bat→grid)
     20 ┤ ─ ─ ─ ─ SOC_min (5%) ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
        └──────┬──────┬──────┬──────┬──────┬──────┬───→ t
               0      4      8     12     16     20

    Energy in from grid:   ~193 MWh  (to go 200→380 MWh stored)
    Energy out to grid:    ~168 MWh  (from 380→200 MWh stored)
    Round-trip loss:        ~25 MWh  (13% of input)
```

2. **Power limits:**
```
0 ≤ p_ch(t) ≤ P_max
0 ≤ p_dis(t) ≤ P_max
```

3. **Energy bounds:**
```
SOC_min × E ≤ soc(t) ≤ SOC_max × E
```

4. **Initial and terminal SOC** (cyclic constraint):
```
soc(0) = SOC_init × E
soc(T) = SOC_final × E
```

**Efficiency Split:**

Round-trip efficiency (RTE) is split equally between charge and discharge:
```
η_ch = η_dis = √(RTE) = √(0.87) ≈ 0.933
```

This means 1 MWh of grid energy becomes 0.933 MWh stored, and 1 MWh stored delivers 0.933 MWh to the grid. Net round-trip: 0.933 × 0.933 = 0.87 (87%).

```
    EFFICIENCY SPLIT — Where Energy Goes in a Round Trip

    Grid                Battery               Grid
    ─────────────────►  Storage  ─────────────────►
         CHARGE          (MWh)        DISCHARGE

    1.000 MWh          0.933 MWh          0.870 MWh
    from grid    ×0.933  stored     ×0.933  to grid
    ━━━━━━━━━━━  ─────► ━━━━━━━━━  ─────► ━━━━━━━━━
    ██████████          ████████▒          ███████░░
    100%                93.3%              87.0%
                         │                   │
                    Loss: 6.7%          Loss: 6.3%
                   (charge side)     (discharge side)

    Total round-trip: 0.933 × 0.933 = 0.870 = 87% RTE
```

### Why LP (not MILP)?

The formulation is a pure LP because:
- Charge and discharge are separate non-negative variables (no binary needed for mutual exclusion — the optimizer naturally won't charge and discharge simultaneously when maximizing revenue)
- No minimum power thresholds or startup costs
- No integer cycling constraints

This makes the problem convex and solvable in seconds even for 8,760+ hourly periods.

### Solver

CVXPY with CLARABEL backend (interior-point method). Solve time: <2 seconds per month, <30 seconds per location-year.

## 3. Asset Assumptions

| Parameter | Value | Justification |
|-----------|-------|---------------|
| Power (P_max) | 100 MW | Standard utility-scale BESS |
| Energy (E) | 400 MWh | 4-hour duration (dominant ERCOT config) |
| Round-trip efficiency | 87% | LFP chemistry typical (range: 85-90%) |
| SOC minimum | 5% | Prevents deep discharge degradation |
| SOC maximum | 95% | Prevents overcharge degradation |
| Initial/final SOC | 50% | Cyclic monthly constraint |
| Time resolution | 1 hour | Matches GCS price data granularity |
| Backtest period | Calendar year 2024 | Most recent complete year |

### What These Assumptions Miss

- **Degradation**: No capacity fade over time. Real BESS loses ~2-3% capacity/year depending on cycling.
- **Ancillary services**: Energy arbitrage only. In ERCOT, frequency regulation and responsive reserves can add significant revenue.
- **Transaction costs**: No bid-ask spread, settlement fees, or scheduling penalties.
- **Ramp constraints**: No limit on power ramp rate between hours.
- **Auxiliary load**: No parasitic losses from cooling, BMS, or transformers (~2-5% of capacity).

## 4. Data Sources & Provenance

### LMP Prices
- **Source**: ERCOT Nodal Market, via custom cloud data pipeline
- **Original source**: ERCOT Settlement Point Prices (SPP), collected via gridstatus library
- **Processing**: 15-minute native → resampled to hourly (mean). Raw SPP preserved (not clipped/compressed).
- **Coverage**: 2010-2025, hourly UTC timestamps (tz-aware)
- **Locations**: 4 ERCOT hubs (HB_HOUSTON, HB_NORTH, HB_SOUTH, HB_WEST) + 5 resource nodes
- **Schema**: `datetime` (UTC index), `price` ($/MWh), `market` (DA/RT), `location`, `spp` (original SPP value)

### Why Raw Prices (Not Forecast Data)
The GCS pipeline also contains forecast-compressed prices with P15-P85 bounds. These are unsuitable for arbitrage analysis because:
- A $9,000/MWh RT spike (which occurred at HB_HOUSTON) would be clipped to ~$95
- BESS revenue is dominated by extreme prices — the top 1% of hours can deliver 20%+ of annual revenue
- Raw LMP preserves the full distribution critical for accurate dispatch optimization

### BESS Fleet Data
- **Source**: EIA Form 860, enriched with coordinates, pricing nodes, coupling status, chemistry
- **File**: `data/bess_enriched.parquet` (1,331 US BESS units)
- **ERCOT subset**: 155 operating units, 10,105 MW total capacity

### Pricing Nodes
- **Source**: ISO node registries, geocoded
- **File**: `data/extra/us_price_nodes_latlong_comprehensive.parquet` (55,408 nodes, 19,942 ERCOT)

## 5. Site Selection

### Hub Selection
All 4 ERCOT settlement hubs included for comprehensive coverage:
- **HB_HOUSTON**: Load center, lower volatility
- **HB_NORTH**: DFW metro, moderate volatility
- **HB_SOUTH**: San Antonio/Austin, moderate volatility
- **HB_WEST**: Wind-heavy, highest volatility and arbitrage potential

### Resource Node Selection
5 real ERCOT generation sites with LMP data in GCS, all in the HB_WEST zone:

| Site | Type | MW | Node | Why Selected |
|------|------|-----|------|-------------|
| Lamesa Solar | Solar | 102 | LAMESASLR_G | Solar co-location candidate |
| Misae Solar | Solar | 240 | MISAE_GEN_RN | Large solar, different congestion pattern |
| Longhorn Wind | Wind | 200 | LHORN_N_U1_2 | Wind co-location candidate |
| Panther Creek Wind | Wind | 142.5 | PC_NORTH_1 | Different wind zone within West TX |
| Stanton Wind | Wind | 120 | SWEC_G1 | Smaller wind, tests scale effects |

Selection criteria: Real operating assets with (a) known pricing nodes in EIA data, (b) LMP history available in GCS, (c) generation revenue data for co-location comparison.

## 6. Validation Methodology

### Optimizer Validation (5 Tests)

1. **Synthetic prices [10, 50, 10, 50]**: Verify charges at $10, discharges at $50. Expected revenue calculable by hand.
2. **Flat prices [$30, $30, $30, ...]**: Revenue should be ~$0 (no arbitrage opportunity).
3. **Random prices (1 week)**: Revenue ≥ $0 (optimizer should never lose money with perfect foresight).
4. **SOC bounds**: Verify `SOC_min × E ≤ soc(t) ≤ SOC_max × E` for all t.
5. **RTE monotonicity**: Higher RTE (95%) yields strictly more revenue than lower RTE (80%).

All 5 tests pass.

### Results Summary

```
    Hub Revenue (RT, 2024, 100MW/400MWh, 87% RTE)

    HB_HOUSTON  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  $76/kW/yr
    HB_NORTH    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  $79/kW/yr
    HB_SOUTH    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░  $79/kW/yr
    HB_WEST     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  $94/kW/yr  ★
                ├─────────┼─────────┼─────────┼─────────┤
                0        25        50        75       100
                                                    $/kW/yr

    Modo BESS Index (actual 2025):  ▒▒▒▒▒▒░  ~$17/kW/yr
    ──────────────────────────────
    Gap = capture rate ~18% — dominated by forecasting uncertainty
```

### Benchmark Comparison
- **Modo BESS Index (2025)**: ~$17/kW/yr actual realized ERCOT revenue
- **Our perfect-foresight result**: $76-$94/kW/yr at hubs
- **Implied capture rate**: ~18-22%
- **Reasonableness**: Academic literature reports 15-30% capture rates for day-ahead arbitrage with imperfect forecasting, consistent with our gap.

### Cross-Validation
- Revenue is positive for all locations (optimizer working correctly)
- HB_WEST yields highest hub revenue (consistent with its known price volatility)
- Summer months dominate revenue (consistent with ERCOT seasonal patterns)
- Higher RTE → higher revenue (monotonically, as expected)
- Longer duration → higher revenue (with diminishing returns, as expected)

## 7. Limitations & Known Biases

| Limitation | Direction of Bias | Magnitude |
|------------|------------------|-----------|
| Perfect foresight | Overstates revenue | Major (~5x vs actual) |
| No ancillary services | Understates total BESS revenue | Moderate ($5-20/kW/yr) |
| No degradation | Overstates long-run economics | Moderate (2-3%/yr capacity loss) |
| No transaction costs | Overstates net revenue | Minor (~1-2%) |
| Hourly resolution (not 15-min) | May miss sub-hourly spikes | Minor-Moderate |
| Single year (2024) | May not represent long-run avg | Moderate (ERCOT revenue varies 2-5x year-to-year) |
| Energy-only (no capacity/reserves) | Understates total value | Significant in some ISOs |

## 8. Comparison to Industry Approaches

| Approach | Used By | Pros | Cons |
|----------|---------|------|------|
| **Perfect foresight LP** (this work) | Academic benchmarking | Exact upper bound, fast, transparent | Unachievable in practice |
| **Clean-spark spread** | Quick valuation | Simple, no optimization needed | Ignores SOC dynamics, overestimates |
| **Rolling-window MPC** | Real-time trading | Realistic, uses forecasts | Depends on forecast quality |
| **Stochastic DP** | Risk-aware optimization | Captures uncertainty | Computationally expensive, curse of dimensionality |
| **Modo BESS Index** | Industry benchmark | Actual market outcomes | Reflects average operator, not theoretical max |

Our approach (perfect foresight LP) is deliberately chosen as the upper bound benchmark. The gap between this and Modo's actual index quantifies the aggregate cost of uncertainty, inefficiency, and real-world constraints.

## 9. Asset Design Sensitivity

```
    Revenue vs Duration (HB_WEST RT, 87% RTE)

    $/kW/yr
    120 ┤                                          ╭──── 8h: $117
        │                                    ╭─────╯
    100 ┤                              ╭─────╯
        │                        ╭─────╯             ← 4h: $94
     80 ┤                  ╭─────╯                     (sweet spot)
        │            ╭─────╯
     60 ┤      ╭─────╯
        │ ╭────╯
     40 ┤─╯                                           ← 1h: $39
        │
     20 ┤     81% of 8h revenue
        │     at half the capex
      0 ┤─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────►
              1     2     3     4     5     6     7     8
                              Duration (hours)

    Key: 1h→4h adds $55/kW/yr (+141%)
         4h→8h adds $23/kW/yr (+24%)  ← diminishing returns
```

```
    Revenue vs RTE (HB_WEST RT, 4h duration)

    $/kW/yr
    100 ┤                                          ● 95%: $99
        │                                ●──────────
     96 ┤                       ●────────  90%: $96
        │               ●──────  87%: $94
     92 ┤        ●──────  85%: $93
        │ ●──────  80%: $90
     88 ┤
        └──────┬──────┬──────┬──────┬──────►
              80     85     87     90     95
                        RTE (%)

    Each +1% RTE ≈ +$0.6/kW/yr
    Chemistry choice (LFP 87% vs advanced 95%) = $9/kW/yr spread
```

## 10. Gen 2-5 Roadmap

| Generation | Capability | Key Addition |
|------------|-----------|-------------|
| **Gen 1** (this work) | Perfect-foresight energy arbitrage | LP dispatch, hub/node comparison |
| **Gen 2** | Hybrid systems (solar+storage) | Export constraints, DC coupling, shared inverter |
| **Gen 3** | Stochastic modeling | Price scenarios, representative days, P50/P90 bands |
| **Gen 4** | Degradation modeling | Cycle counting, capacity fade in objective function |
| **Gen 5** | Portfolio optimization | Multi-asset, multi-node batch, cross-correlation |
