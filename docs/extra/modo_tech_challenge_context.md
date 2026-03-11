# Context: Modo Energy Open Tech Challenge

## Who I Am

Divykumar Patel — Energy Data Scientist at InfraSure.ai (climate risk analytics startup). I build probabilistic generation forecasts, LMP price models, and parametric risk tools for 2,500+ US renewable energy assets across all seven ISOs. Background in physics, math, financial engineering (M.S. Stevens, 3.9 GPA). Also independently building RenewablesInfo, an energy data platform.

Core technical stack: Python, DuckDB, GCS, FastAPI, pvlib, PyWake, ERA5/ECMWF, pandas, scikit-learn, LightGBM.

Deep domain knowledge: ISO/RTOs (ERCOT, PJM, CAISO, NYISO, SPP, MISO, ISO-NE), LMP pricing (DA/RT), congestion, curtailment, BESS dispatch, asset-level performance benchmarking, parametric insurance, project finance (DSCR, IRR).

## What Modo Energy Is

Modo Energy is a ~30-person, London/Austin/NYC company building the global standard for benchmarking and valuing electrification assets — battery energy storage (BESS), solar, wind, data centers. They raised £25M in late 2025. Their core products are:

- **Benchmarking Pro** — revenue stream tracking and performance comparison across storage assets
- **Forecast Pro** — 2050 revenue projections for financing battery projects
- **ME BESS Indices** — standardized indices for BESS revenues across ERCOT, GB, CAISO, AUS NEM
- **AI Analyst** — LLM-powered analyst for energy transition decisions
- **Research & Media** — market updates, methodology docs, podcasts, newsletters

Their customers: BESS asset owners, traders, developers, utilities, structured finance teams, optimization & trading desks. Their primary markets: GB, ERCOT, CAISO, PJM, AUS NEM — expanding globally.

90% of their modeling is in Python.

## Why I'm Building This

I applied to Modo's **Open Tech Challenge** — an open invitation to build something and demonstrate capability. Within the application I indicated interest in the **Market Analyst** role (Power Market Forecasting & Modeling, US Markets). I also submitted a tailored resume and cover letter emphasizing my direct overlap with their product domain.

The Tech Challenge is my primary entry point — it lets me demonstrate what I can build rather than just claim it on a resume.

## The Task

**Brief:** Pick a problem that matters to participants in electricity markets (traders, asset owners, developers, utilities) and build something that helps them understand the markets better. App, dashboard, model, or tool — something tangible and demo-able.

**Time scope:** 2–4 hours of build time. Deadline: March 11, 2026 11:59 PM EST.

**Submission:** GitHub repo (public or private, grant access to `alexmarkdone`). Repo should contain everything needed to understand what was built, why, and how. Include resume.

**Suggested data sources:** ERCOT (grid info, SPP prices, generation, load, ancillary services) and NYISO MIS (load, capacity, pricing, ancillary services). Any public data is fair game.

**Evaluation criteria:**
- Clear point of view — why this problem, what were you trying to find out
- Sensible scoping — smart choices about what to build in limited time
- Quality of thinking — defensible analysis, clearly communicated
- Energy market awareness — reflects understanding of how these markets work
- AI usage is expected — show workflow, not just output

**What wins:** Something a Modo customer (BESS trader, asset owner, project finance analyst) would actually want to look at. Product sense > technical complexity.

## Key Strategic Notes

- Modo's bread and butter is BESS revenue analytics — anything related to battery storage economics, price spreads, dispatch optimization, or revenue benchmarking is directly in their wheelhouse
- They value builders who can scope, ship, and communicate — not academic perfection
- The README matters as much as the code — it should have a clear problem statement, approach, findings, and how-to-run
- Document AI tool usage somewhere in the repo (they explicitly want to see this)
- Include resume PDF in the repo
