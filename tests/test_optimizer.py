"""Tests for BESS dispatch optimizer.

Converted from the 5 inline sanity checks in notebooks/03_dispatch_optimizer.ipynb.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import numpy as np
import pytest
from bess.optimizer import optimize_dispatch


def test_synthetic_charge_low_discharge_high():
    """Optimizer charges at low prices and discharges at high prices."""
    result = optimize_dispatch(
        [10, 50, 10, 50],
        power_mw=100, energy_mwh=400, rte=0.87,
    )
    assert result['status'] == 'optimal'
    assert result['revenue'] > 0
    # Should charge at t=0,2 (low prices) and discharge at t=1,3 (high prices)
    assert result['p_charge'][0] > result['p_charge'][1]
    assert result['p_discharge'][1] > result['p_discharge'][0]


def test_flat_prices_no_arbitrage():
    """Flat prices yield ~$0 revenue (no arbitrage opportunity)."""
    result = optimize_dispatch([30, 30, 30, 30])
    assert abs(result['revenue']) < 1.0


def test_random_prices_nonnegative_revenue():
    """Optimizer never loses money — revenue is always >= 0."""
    np.random.seed(42)
    prices = np.random.uniform(10, 100, 168)  # 1 week
    result = optimize_dispatch(prices)
    assert result['revenue'] >= -0.01


def test_soc_stays_in_bounds():
    """SOC respects min/max constraints at all timesteps."""
    np.random.seed(42)
    prices = np.random.uniform(10, 100, 168)
    result = optimize_dispatch(
        prices, soc_min=0.05, soc_max=0.95, energy_mwh=400,
    )
    soc = result['soc']
    assert soc.min() >= 0.05 * 400 - 0.1  # small tolerance for solver
    assert soc.max() <= 0.95 * 400 + 0.1


def test_higher_rte_weakly_more_revenue():
    """Higher RTE yields weakly higher revenue (monotonicity)."""
    np.random.seed(42)
    prices = np.random.uniform(10, 100, 168)
    rev_low = optimize_dispatch(prices, rte=0.80)['revenue']
    rev_high = optimize_dispatch(prices, rte=0.95)['revenue']
    assert rev_high >= rev_low - 0.01
