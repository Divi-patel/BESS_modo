# AI Usage Documentation

## Tools Used

- **Claude Code (Anthropic CLI)** — Primary development assistant for code generation, debugging, and iteration
- **Claude Opus 4** — Underlying model for planning, implementation, and analysis

## How AI Was Used

### Planning
- Generated the multi-phase implementation plan ([gen1_implementation.md](plan/gen1_implementation.md))
- Identified optimal data sources (raw LMP vs forecast prices) and methodology (CVXPY LP formulation)
- Designed the notebook-first workflow with validation at each step
- Audited the submission against Modo's evaluation criteria to identify gaps (DA vs RT, sensitivity analysis, methodology doc)

### Code Generation
- Wrote all 4 Jupyter notebooks (data download, price exploration, dispatch optimizer, backtest analysis)
- CVXPY linear program formulation for perfect-foresight dispatch optimization
- Data pipeline code for GCS bucket access and parquet file handling
- Visualization code (matplotlib, seaborn) for all charts
- Sensitivity analysis sweeps (RTE, duration)

### Debugging (Concrete Examples)

**1. Balancing Authority Code Mismatch**
- EIA data uses `ERCO` for ERCOT, not `ERCT` as initially assumed
- First attempt filtered 0 rows; diagnosed by inspecting `df['Balancing Authority Code'].unique()`
- Fix: Changed filter from `'ERCT'` to `'ERCO'`

**2. Timezone-Aware DatetimeIndex Slicing**
- Pandas DataFrames with tz-aware UTC indices don't support string year slicing (e.g., `df['2024']` raises KeyError)
- But Series with the same index DO support it (`series['2024']` works)
- Fix: Used `df.index.year == 2024` for DataFrames, kept string slicing for Series

**3. String vs Numeric Column Types**
- `Nameplate Energy Capacity (MWh)` column in bess_enriched.parquet is stored as string, not float
- `f"Total Energy: {col.sum():,.0f}"` raised `ValueError: Unknown format code 'f' for object of type 'str'`
- Fix: Added `pd.to_numeric(col, errors='coerce')` before aggregation

**4. GCS Authentication on macOS Python 3.13**
- `gcsfs` library had SSL certificate issues on macOS with Python 3.13
- Fix: Switched to `google.cloud.storage.Client` which uses system certificates correctly

**5. Negative Price Frequency Cell Bug**
- `(rt_recent < 0).sum()` returned Series keyed by column names, but index was set to stripped names
- Also `rt_recent.min()` returned NaN due to mixed-type comparison
- Fix: Rewrote as explicit per-hub loop with proper masking

### Analysis
- Interpreted backtest results and generated key findings
- Compared results against Modo BESS Index benchmarks
- Identified capture rate gap decomposition (forecasting, ancillary, degradation, transaction costs)
- Designed narrative framing for Modo audience

## Iteration Workflow

The development followed a tight loop:
1. **Plan** — Claude generated implementation plan, human reviewed and scoped
2. **Build** — Claude wrote notebook cells, human guided data source choices
3. **Execute** — Notebooks run via `jupyter nbconvert --execute`
4. **Debug** — When execution failed, Claude diagnosed from tracebacks and fixed
5. **Review** — Human reviewed outputs for market reasonableness
6. **Audit** — Claude audited submission against Modo criteria, identified 10 gaps
7. **Enhance** — Added DA backtest, sensitivity analysis, methodology doc, findings narrative

Total: ~50+ Claude Code interactions across 2 sessions. The second session was recovery after a crash mid-build.

## What Worked Well with AI
- **CVXPY formulation**: Claude generated correct LP constraints on first attempt
- **Visualization**: Charts required minimal iteration
- **Debugging**: Tracebacks → diagnosis → fix was fast and reliable
- **Documentation**: methodology.md and README produced high-quality output

## What Required Human Correction
- **Column names**: AI assumed snake_case; actual EIA data uses title case with parentheses
- **BA codes**: AI guessed `ERCT`; actual code is `ERCO`
- **Market framing**: Initial findings were "numbers only"; human pushed for Modo-specific narrative
- **Scope decisions**: AI would have over-engineered (e.g., adding Streamlit dashboard); human kept focus on analytical depth

## What Was NOT AI-Generated

- **Data infrastructure** — The GCS data pipeline (55k pricing nodes, BESS fleet enrichment, LMP price collection) was built prior to this project
- **Domain knowledge** — BESS dispatch modeling approach, ERCOT market structure understanding, and Modo metric alignment came from prior research and the problem statement document
- **Site selection** — Choice of co-location sites and hub vs node comparison strategy was a deliberate analytical decision
- **Project scope** — The decision to focus on analytical depth over UI/dashboard was a human judgment call

## Approximate AI vs Human Contribution

| Component | AI | Human |
|-----------|----|----|
| Implementation plan | 70% | 30% (direction, scope, priorities) |
| Notebook code | 85% | 15% (review, corrections, domain guidance) |
| Data infrastructure | 0% | 100% (pre-existing pipeline) |
| Analysis & findings | 50% | 50% (interpretation, market context) |
| Methodology doc | 75% | 25% (technical review, market comparisons) |
| Documentation | 80% | 20% (review, accuracy) |
