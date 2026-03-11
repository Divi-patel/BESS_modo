# AI Usage Documentation

## Tools Used

- **Claude Code (Anthropic CLI)** — Primary development assistant for code generation, debugging, and iteration
- **Claude Opus 4** — Underlying model for planning, implementation, and analysis

## How AI Was Used

### Planning
- Generated the multi-phase implementation plan ([gen1_implementation.md](plan/gen1_implementation.md))
- Identified optimal data sources (raw LMP vs forecast prices) and methodology (CVXPY LP formulation)
- Designed the notebook-first workflow with validation at each step

### Code Generation
- Wrote all 4 Jupyter notebooks (data download, price exploration, dispatch optimizer, backtest analysis)
- CVXPY linear program formulation for perfect-foresight dispatch optimization
- Data pipeline code for GCS bucket access and parquet file handling
- Visualization code (matplotlib, seaborn) for all charts

### Debugging
- Diagnosed and fixed data type issues (string vs numeric columns in EIA data)
- Fixed timezone-aware DatetimeIndex slicing incompatibilities
- Resolved GCS authentication patterns (google.cloud.storage vs gcsfs SSL issues)

### Analysis
- Interpreted backtest results and generated key findings
- Compared results against Modo BESS Index benchmarks

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
| Documentation | 80% | 20% (review, accuracy) |
