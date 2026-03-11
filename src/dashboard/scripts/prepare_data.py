"""Prepare JSON data files for the BESS dashboard.

Reads CSV/Parquet results from the analysis pipeline and converts them
to JSON files consumed by the Next.js frontend.
"""

import json
import sys
import os

import numpy as np
import pandas as pd

# Add project root to path for optimizer import
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(PROJECT_ROOT, 'src'))

from bess.optimizer import optimize_dispatch

DATA_DIR = os.path.join(PROJECT_ROOT, 'data')
RESULTS_DIR = os.path.join(DATA_DIR, 'results')
PRICES_DIR = os.path.join(DATA_DIR, 'prices')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
os.makedirs(OUTPUT_DIR, exist_ok=True)


def prepare_backtest_summary():
    """Convert backtest summary CSV to JSON."""
    df = pd.read_csv(os.path.join(RESULTS_DIR, 'bess_backtest_summary_2024.csv'))
    records = df.to_dict(orient='records')
    # Clean NaN values for JSON
    for r in records:
        for k, v in r.items():
            if isinstance(v, float) and np.isnan(v):
                r[k] = None
    with open(os.path.join(OUTPUT_DIR, 'backtest-summary.json'), 'w') as f:
        json.dump(records, f, indent=2)
    print(f'  backtest-summary.json: {len(records)} rows')


def prepare_sensitivity():
    """Convert sensitivity CSVs to JSON."""
    for name in ['sensitivity_rte', 'sensitivity_duration']:
        df = pd.read_csv(os.path.join(RESULTS_DIR, f'{name}.csv'))
        records = df.to_dict(orient='records')
        out_name = name.replace('_', '-') + '.json'
        with open(os.path.join(OUTPUT_DIR, out_name), 'w') as f:
            json.dump(records, f, indent=2)
        print(f'  {out_name}: {len(records)} rows')


def prepare_dispatch_weeks():
    """Run optimizer on 4 representative weeks and save results."""
    prices_path = os.path.join(PRICES_DIR, 'HB_WEST_rt_hourly.parquet')
    if not os.path.exists(prices_path):
        print('  SKIP dispatch-weeks.json: no price data available')
        return

    prices_series = pd.read_parquet(prices_path)['price']

    # Pick 4 representative weeks (Mon-Sun)
    weeks = [
        ('Winter (Jan 15-21)', '2024-01-15', '2024-01-21'),
        ('Spring (Apr 15-21)', '2024-04-15', '2024-04-21'),
        ('Summer (Jul 15-21)', '2024-07-15', '2024-07-21'),
        ('Fall (Oct 14-20)',   '2024-10-14', '2024-10-20'),
    ]

    dispatch_data = []
    for label, start, end in weeks:
        week_prices = prices_series[start:end].dropna()
        if len(week_prices) < 48:
            print(f'  SKIP {label}: only {len(week_prices)} hours')
            continue

        result = optimize_dispatch(
            week_prices.values,
            power_mw=100, energy_mwh=400, rte=0.87,
            soc_min=0.05, soc_max=0.95, soc_init=0.50, soc_final=0.50,
        )

        cycles = result['p_discharge'].sum() / 400.0
        avg_spread = float(week_prices.max() - week_prices.min())

        dispatch_data.append({
            'label': label,
            'location': 'HB_WEST',
            'timestamps': [t.isoformat() for t in week_prices.index],
            'prices': [round(float(p), 2) for p in week_prices.values],
            'p_charge': [round(float(p), 2) for p in result['p_charge']],
            'p_discharge': [round(float(p), 2) for p in result['p_discharge']],
            'soc': [round(float(s), 2) for s in result['soc']],
            'revenue': round(float(result['revenue']), 0),
            'cycles': round(float(cycles), 2),
            'avg_spread': round(avg_spread, 2),
        })
        print(f'  {label}: ${result["revenue"]:,.0f} revenue, {cycles:.1f} cycles')

    with open(os.path.join(OUTPUT_DIR, 'dispatch-weeks.json'), 'w') as f:
        json.dump(dispatch_data, f)
    print(f'  dispatch-weeks.json: {len(dispatch_data)} weeks')


def prepare_monthly_revenue():
    """Extract monthly revenue per hub for heatmap."""
    monthly_data = {}
    for hub in ['HB_HOUSTON', 'HB_NORTH', 'HB_SOUTH', 'HB_WEST']:
        prices_path = os.path.join(PRICES_DIR, f'{hub}_rt_hourly.parquet')
        if not os.path.exists(prices_path):
            continue
        prices = pd.read_parquet(prices_path)['price']
        year_prices = prices['2024'].dropna()

        monthly_rev = []
        for month_label, month_data in year_prices.groupby(pd.Grouper(freq='ME')):
            if len(month_data) < 24:
                continue
            result = optimize_dispatch(
                month_data.values,
                power_mw=100, energy_mwh=400, rte=0.87,
                soc_min=0.05, soc_max=0.95, soc_init=0.50, soc_final=0.50,
            )
            monthly_rev.append({
                'month': month_label.strftime('%b'),
                'revenue_k': round(result['revenue'] / 1000, 1),
            })

        monthly_data[hub.replace('HB_', '')] = monthly_rev
        print(f'  {hub}: {len(monthly_rev)} months')

    with open(os.path.join(OUTPUT_DIR, 'monthly-revenue.json'), 'w') as f:
        json.dump(monthly_data, f, indent=2)
    print(f'  monthly-revenue.json: {len(monthly_data)} hubs')


if __name__ == '__main__':
    print('Preparing dashboard data...\n')

    print('1. Backtest summary:')
    prepare_backtest_summary()

    print('\n2. Sensitivity data:')
    prepare_sensitivity()

    print('\n3. Dispatch weeks:')
    prepare_dispatch_weeks()

    print('\n4. Monthly revenue:')
    prepare_monthly_revenue()

    print('\nDone! JSON files saved to:', OUTPUT_DIR)
