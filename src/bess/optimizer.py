"""Perfect-foresight BESS dispatch optimization using CVXPY.

Solves a linear program to maximize energy arbitrage revenue given
hourly LMP prices, battery parameters, and SOC constraints.
"""

import numpy as np
import cvxpy as cp
import pandas as pd


def optimize_dispatch(prices, dt=1.0, power_mw=100, energy_mwh=400,
                      rte=0.87, soc_min=0.05, soc_max=0.95,
                      soc_init=0.50, soc_final=0.50):
    """Solve perfect-foresight energy arbitrage LP for a BESS asset.

    Args:
        prices: Array-like of hourly LMP prices ($/MWh), length T.
        dt: Timestep duration in hours.
        power_mw: Maximum charge/discharge power (MW).
        energy_mwh: Battery energy capacity (MWh).
        rte: Round-trip efficiency (0-1). Split symmetrically as sqrt(rte)
            for charge and discharge efficiency.
        soc_min: Minimum SOC as fraction of energy_mwh.
        soc_max: Maximum SOC as fraction of energy_mwh.
        soc_init: Initial SOC as fraction of energy_mwh.
        soc_final: Terminal SOC as fraction of energy_mwh.

    Returns:
        dict with keys:
            p_charge: Charge power array (MW), shape (T,).
            p_discharge: Discharge power array (MW), shape (T,).
            soc: State of charge array (MWh), shape (T+1,).
            revenue: Total arbitrage revenue ($).
            status: Solver status string.
    """
    prices = np.asarray(prices, dtype=float)
    T = len(prices)

    eta_ch = np.sqrt(rte)
    eta_dis = np.sqrt(rte)
    soc_min_mwh = soc_min * energy_mwh
    soc_max_mwh = soc_max * energy_mwh
    soc_init_mwh = soc_init * energy_mwh
    soc_final_mwh = soc_final * energy_mwh

    # Decision variables
    p_ch = cp.Variable(T, nonneg=True)    # Charge power (MW)
    p_dis = cp.Variable(T, nonneg=True)   # Discharge power (MW)
    soc = cp.Variable(T + 1, nonneg=True) # State of charge (MWh)

    # Objective: maximize revenue
    revenue = prices @ (p_dis - p_ch) * dt
    objective = cp.Maximize(revenue)

    # Constraints
    constraints = [
        # Power limits
        p_ch <= power_mw,
        p_dis <= power_mw,
        # SOC dynamics: soc[t+1] = soc[t] + eta_ch * charge - (1/eta_dis) * discharge
        soc[1:] == soc[:-1] + eta_ch * p_ch * dt - (1.0 / eta_dis) * p_dis * dt,
        # SOC bounds
        soc >= soc_min_mwh,
        soc <= soc_max_mwh,
        # Boundary conditions
        soc[0] == soc_init_mwh,
        soc[T] == soc_final_mwh,
    ]

    # Solve
    prob = cp.Problem(objective, constraints)
    prob.solve(solver=cp.CLARABEL, verbose=False)

    if prob.status not in ['optimal', 'optimal_inaccurate']:
        return {'status': prob.status, 'revenue': 0, 'p_discharge': np.zeros(T)}

    return {
        'p_charge': p_ch.value,
        'p_discharge': p_dis.value,
        'soc': soc.value,
        'revenue': prob.value,
        'status': prob.status,
    }


def backtest_year(prices_series, year='2024', **bess_kwargs):
    """Run month-by-month dispatch optimization for a given year.

    Splits the year into monthly chunks, runs optimize_dispatch on each,
    and returns a DataFrame of monthly results. SOC boundary conditions
    reset each month (cyclic: soc_init == soc_final).

    Args:
        prices_series: pd.Series with DatetimeIndex and $/MWh prices.
        year: Year string to filter (e.g., '2024').
        **bess_kwargs: Passed through to optimize_dispatch().

    Returns:
        pd.DataFrame with columns: month, revenue_usd, hours, cycles, avg_spread.
        Empty DataFrame if insufficient data.
    """
    year_prices = prices_series[year].dropna()
    if len(year_prices) < 100:
        return pd.DataFrame()

    # Default energy_mwh for cycle calculation
    energy_mwh = bess_kwargs.get('energy_mwh', 400)
    dt = bess_kwargs.get('dt', 1.0)

    monthly_results = []
    for month_label, month_data in year_prices.groupby(pd.Grouper(freq='ME')):
        if len(month_data) < 24:
            continue
        result = optimize_dispatch(month_data.values, **bess_kwargs)
        if result['revenue'] == 0 and result.get('status') != 'optimal':
            continue
        monthly_results.append({
            'month': month_label,
            'revenue_usd': result['revenue'],
            'hours': len(month_data),
            'cycles': result['p_discharge'].sum() * dt / energy_mwh,
            'avg_spread': month_data.max() - month_data.min(),
        })

    return pd.DataFrame(monthly_results)
