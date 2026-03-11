# BESS Energy Arbitrage: ERCOT Hub & Node Analysis

**Modo Energy Open Tech Challenge Submission**

What is the theoretical maximum energy arbitrage revenue for a 100MW/400MWh battery across ERCOT hubs and real generation sites? This project answers that question using perfect-foresight optimization on historical LMP prices, computing Modo's $/kW/yr BESS Index metric directly.

## Key Findings (2024 Backtest)

| Location | Type | $/kW/yr | Cycles |
|----------|------|---------|--------|
| HB_HOUSTON | Hub | $76 | 520 |
| HB_NORTH | Hub | $79 | 540 |
| HB_SOUTH | Hub | $79 | 518 |
| **HB_WEST** | **Hub** | **$94** | **609** |
| Lamesa Solar | Node | $136 | 649 |
| Panther Creek Wind | Node | $120 | 660 |
| Stanton Wind | Node | $133 | 618 |
| Misae Solar | Node | $90 | 724 |
| Longhorn Wind | Node | $92 | 741 |

**Headline insights:**
1. **Perfect-foresight revenue: $76–$136/kW/yr** across hubs and nodes
2. **Capture rate gap:** Modo BESS Index shows ~$17/kW actual → operators capture ~18% of theoretical maximum
3. **Nodal basis matters:** Resource nodes average +21% vs hub revenue — hub-only analysis systematically misprices BESS value
4. **Revenue concentration:** Top 3 months (May, Aug, Apr) deliver 37% of annual revenue at HB_WEST
5. **West Texas dominance:** HB_WEST leads hubs at $94/kW/yr driven by wind curtailment-induced price volatility

## Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run notebooks in order
jupyter lab notebooks/
```

Notebooks are pre-executed with all outputs saved. To re-run, you'll need GCS access to `gs://infrasure-model-gpr-data` for price data.

## Project Structure

```
BESS_modo/
├── notebooks/
│   ├── 01_data_download.ipynb          # Download ERCOT LMP prices from GCS
│   ├── 02_price_exploration.ipynb      # Price stats, volatility, duration curves
│   ├── 03_dispatch_optimizer.ipynb     # CVXPY LP optimizer + sanity tests
│   └── 04_backtest_colocation.ipynb    # Full backtest + hub vs node + co-location
├── data/
│   ├── bess_enriched.parquet           # 1,331 US BESS units (EIA-860 enriched)
│   ├── prices/                         # ERCOT LMP parquets (4 hubs + 5 nodes, RT+DA)
│   ├── results/                        # Backtest outputs + charts
│   ├── revenue/                        # Historical generation revenue by site
│   └── extra/                          # 55k pricing nodes, schemas, GCS docs
├── docs/
│   ├── ai_usage.md                     # AI usage documentation
│   ├── BESS_Hybrid_Storage_Problem_Statement.md
│   └── plan/gen1_implementation.md
├── resume/Divy_Patel_Resume.pdf
└── requirements.txt
```

## Methodology

### Dispatch Optimization
Linear program (CVXPY) with perfect price foresight:
- **Asset:** 100 MW / 400 MWh (4-hour duration), 87% round-trip efficiency
- **Variables:** charge power, discharge power, state of charge per hour
- **Objective:** Maximize `Σ price[t] × (discharge[t] - charge[t])`
- **Constraints:** SOC dynamics with √RTE split, power limits, 5-95% SOC bounds, cyclic monthly SOC
- **Granularity:** Monthly rolling optimization on hourly prices (8,784 periods/year)

### Data Sources
- **LMP Prices:** ERCOT hub and resource node prices from a production GCS pipeline (`gs://infrasure-model-gpr-data`). Raw SPP prices (not forecast-compressed) to preserve spike/trough distribution critical for arbitrage valuation.
- **BESS Fleet:** EIA-860 enriched dataset (1,331 US BESS units, 155 operating in ERCOT, 10,105 MW total)
- **Pricing Nodes:** 55,408 US ISO nodes with lat/long coordinates (19,942 ERCOT)

### What Differentiates This
- **Hub vs node comparison** — Most analyses use hub prices only; we show nodal basis adds +21% revenue on average
- **Real site co-location** — 6 actual ERCOT solar/wind sites with resource node pricing
- **Production data pipeline** — Not CSV downloads; pulling from a curated GCS bucket with 55k nodes
- **$/kW/yr metric** — Directly comparable to Modo's BESS Index

## Limitations
- Perfect foresight = theoretical upper bound (not achievable in practice)
- No ancillary services (frequency regulation, reserves), degradation, or transaction costs
- Single-year analysis (2024); multi-year would show weather/market regime sensitivity
- Co-location analysis doesn't model behind-the-meter constraints or shared interconnection

## Production Infrastructure Note
This submission deliberately focuses on **analytical depth and market insight**. Production infrastructure experience (FastAPI, Vercel, Supabase, automated data pipelines) is demonstrated in other projects — this prioritizes modeling rigor and clear communication of findings.
