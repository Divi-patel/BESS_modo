"use client";

import { useState, useEffect } from "react";
import { Panel } from "@/components/Panel";
import { BasisChart } from "@/components/BasisChart";
import { BasisTable } from "@/components/BasisTable";
import { getBacktestSummary, getNodeRows } from "@/lib/data";
import { SITE_META } from "@/lib/constants";
import type { BacktestRow } from "@/types";

export default function ColocationPage() {
  const [rows, setRows] = useState<BacktestRow[] | null>(null);

  useEffect(() => {
    getBacktestSummary().then(setRows);
  }, []);

  if (!rows) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="h-[420px] animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
        <div className="h-[300px] animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
      </div>
    );
  }

  const hubWestRow = rows.find(r => r.location === "HB_WEST" && r.market === "RT");
  const hubWestRev = hubWestRow?.revenue_per_kw_yr ?? 0;
  const nodeRows = getNodeRows(rows);

  const chartNodes = nodeRows.map(n => ({
    site: n.site ?? n.location,
    revenue_per_kw_yr: n.revenue_per_kw_yr,
    basis_pct: ((n.revenue_per_kw_yr - hubWestRev) / hubWestRev) * 100,
  }));

  const siteKeys = Object.keys(SITE_META);
  const tableData = nodeRows.map(n => {
    const key = siteKeys.find(k => SITE_META[k].label === n.site) ?? "";
    const meta = key ? SITE_META[key] : null;
    return {
      site: n.site ?? n.location,
      type: meta?.type ?? n.site_type ?? "",
      mw: meta?.mw ?? n.site_mw ?? 0,
      node: meta?.node ?? n.location,
      hub_rev: hubWestRev,
      node_rev: n.revenue_per_kw_yr,
      basis_pct: ((n.revenue_per_kw_yr - hubWestRev) / hubWestRev) * 100,
    };
  });

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          Colocation Analysis
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          BESS revenue at renewable resource nodes vs hub pricing
        </p>
      </div>

      <div className="rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20 px-4 py-3">
        <p className="text-sm text-[var(--color-accent)] font-medium">
          Nodes with higher price volatility earn more from arbitrage — same region, dramatically different economics.
        </p>
      </div>

      <Panel title="Hub vs Node Revenue" subtitle="5 ERCOT co-location sites compared to West Hub baseline">
        <BasisChart hubRevenue={hubWestRev} nodes={chartNodes} />
      </Panel>

      <Panel title="Site Metrics">
        <BasisTable data={tableData} />
      </Panel>
    </div>
  );
}
