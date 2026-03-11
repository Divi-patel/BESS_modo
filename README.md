# BESS Energy Arbitrage: ERCOT Hub & Node Analysis

**Modo Energy Open Tech Challenge Submission** | Divy Patel | March 2026

## Point of View

Hub-level BESS revenue analysis systematically misprices battery value. By comparing dispatch optimization at ERCOT hubs versus real generation site nodes, we quantify how much nodal basis, market selection, and asset design actually matter — producing the exact $/kW/yr metric that Modo's customers use to make investment decisions.

## Key Findings (2024 Backtest, 100MW/400MWh LFP)

### Hub Revenue (RT Prices)

| Hub | $/kW/yr | Cycles/yr |
|-----|---------|-----------|
| HB_HOUSTON | $76 | 520 |
| HB_NORTH | $79 | 540 |
| HB_SOUTH | $79 | 518 |
| **HB_WEST** | **$94** | **609** |

### Node Revenue (RT Prices, vs HB_WEST)

| Site | Type | Node $/kW/yr | Basis Impact |
|------|------|-------------|--------------|
| Lamesa Solar | Solar | $136 | **+44%** |
| Stanton Wind | Wind | $133 | **+41%** |
| Panther Creek | Wind | $120 | **+27%** |
| Longhorn Wind | Wind | $92 | -3% |
| Misae Solar | Solar | $90 | -5% |

### DA vs RT Market Comparison

| Hub | RT $/kW/yr | DA $/kW/yr | DA Premium |
|-----|-----------|-----------|------------|
| HOUSTON | $76 | $73 | -3% |
| NORTH | $79 | $76 | -4% |
| SOUTH | $79 | $73 | -7% |
| WEST | $94 | $87 | -8% |

RT consistently outperforms DA under perfect foresight (wider real-time spreads).

### Headline Insights

![Hub Revenue Comparison](data/results/hub_revenue_comparison.png)

1. **Capture rate gap:** Perfect foresight yields $76–$136/kW/yr. Modo BESS Index shows ~$17/kW actual (2025) — operators capture only **~18% of theoretical maximum**. The gap is dominated by forecasting uncertainty, not market structure.

2. **Nodal basis matters:** Resource nodes average **+21% vs hub** revenue. Same region (West TX), dramatically different economics. A developer siting at Lamesa Solar's node earns $136/kW; at Misae Solar's node, only $90/kW. Hub-only analysis masks this $46/kW spread.

![Hub vs Node Revenue](data/results/hub_vs_node_revenue.png)

3. **4-hour duration is the sweet spot:** 4h captures **81% of 8h revenue** at half the capex. Going from 1h→4h nearly doubles revenue ($39→$94/kW/yr), but 4h→8h adds only $23/kW/yr.

![Sensitivity Analysis](data/results/sensitivity_analysis.png)

4. **RT > DA for arbitrage:** RT prices yield 3–8% more than DA across all hubs — wider real-time spreads create more arbitrage opportunity under perfect foresight.

5. **Revenue is seasonal:** Top 3 months (May, Aug, Apr) deliver **37%** of annual revenue at HB_WEST. Cash flow planning must account for this concentration.

![Dispatch Profile](data/results/dispatch_profile.png)

### What a Modo Customer Learns From This

- **BESS traders:** The 18% capture rate means massive upside from better price forecasting. Each 1% improvement in capture is worth ~$1/kW/yr across a fleet.
- **Asset owners:** Node selection matters as much as hub selection. Due diligence on nodal congestion patterns is essential.
- **Developers:** 4h duration is well-justified by the diminishing returns curve. RTE improvements (80%→95%) add ~$9/kW/yr — chemistry selection has real revenue impact.
- **Project finance:** Single-year revenue varies significantly. A bankable model needs multi-year stochastic analysis (Gen 3 roadmap).

## Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Notebooks are pre-executed with all outputs saved
jupyter lab notebooks/
```

To re-run from scratch, you'll need GCS access to `gs://infrasure-model-gpr-data` for price data.

## Project Structure

```
BESS_modo/
├── notebooks/
│   ├── 01_data_download.ipynb          # Download ERCOT LMP prices from GCS
│   ├── 02_price_exploration.ipynb      # Price stats, volatility, basis risk analysis
│   ├── 03_dispatch_optimizer.ipynb     # CVXPY LP optimizer + 5 sanity tests
│   └── 04_backtest_colocation.ipynb    # Full backtest + DA/RT + sensitivity + findings
├── data/
│   ├── bess_enriched.parquet           # 1,331 US BESS units (EIA-860 enriched)
│   ├── prices/                         # ERCOT LMP parquets (4 hubs + 5 nodes, RT+DA)
│   ├── results/                        # Backtest outputs, sensitivity CSVs, charts
│   ├── revenue/                        # Historical generation revenue by site
│   └── extra/                          # 55k pricing nodes, schemas, GCS docs
├── docs/
│   ├── methodology.md                  # Detailed LP formulation, assumptions, validation
│   ├── ai_usage.md                     # AI usage documentation (required)
│   ├── BESS_Hybrid_Storage_Problem_Statement.md
│   └── plan/gen1_implementation.md
├── resume/Divy_Patel_Resume_Modo.pdf
└── requirements.txt
```

## Methodology

**Full details:** [docs/methodology.md](docs/methodology.md)

### Dispatch Optimization
Linear program (CVXPY/CLARABEL) with perfect price foresight:
- **Asset:** 100 MW / 400 MWh (4-hour), 87% RTE (LFP), SOC bounds 5–95%
- **Objective:** Maximize `Σ price[t] × Δt × (discharge[t] - charge[t])`
- **Efficiency:** √RTE split (η_ch = η_dis = 0.933)
- **Backtest:** Monthly rolling optimization (cyclic SOC per month), hourly resolution

### Data Sources
- **LMP Prices:** ERCOT hub + resource node prices from production GCS pipeline. Raw SPP (not forecast-compressed) — preserves $9k spikes critical for arbitrage valuation.
- **BESS Fleet:** EIA-860 enriched (1,331 US units, 155 ERCOT operating, 10,105 MW)
- **Pricing Nodes:** 55,408 US ISO nodes with lat/long (19,942 ERCOT)

### Validation
5 sanity tests on optimizer (synthetic prices, flat prices, revenue ≥ 0, SOC bounds, RTE monotonicity). Results benchmarked against Modo BESS Index.

## What Differentiates This

| Aspect | This Submission | Typical Analysis |
|--------|----------------|-----------------|
| Pricing | Hub + 5 resource nodes | Hub only |
| Basis quantification | Node-level $/kW/yr + % impact | Not analyzed |
| Markets | DA + RT comparison | Usually RT only |
| Sensitivity | RTE + duration sweeps | Fixed parameters |
| Data infrastructure | Production GCS pipeline, 55k nodes | CSV downloads |
| Metric | $/kW/yr (Modo's BESS Index) | Total $ or $/MWh |
| Co-location | Real solar/wind sites with gen revenue | Hypothetical |

## Limitations
- Perfect foresight = theoretical upper bound (not achievable)
- No ancillary services, degradation, or transaction costs
- Single-year (2024); multi-year needed for regime sensitivity
- No behind-the-meter or shared interconnection constraints
- No DA+RT co-optimization (each market analyzed independently)

## Roadmap (Gen 2–5)
- **Gen 2:** Hybrid systems — solar+storage coupling, export constraints
- **Gen 3:** Stochastic modeling — price scenarios, P50/P90 revenue bands
- **Gen 4:** Degradation — cycle counting, capacity fade in objective
- **Gen 5:** Portfolio — multi-asset, multi-node batch optimization

## Production Infrastructure Note
This submission focuses on **analytical depth and market insight**. Production infrastructure (FastAPI, Vercel, Supabase, automated data pipelines) is demonstrated in other projects — this prioritizes modeling rigor and clear communication of findings relevant to Modo's customers.
