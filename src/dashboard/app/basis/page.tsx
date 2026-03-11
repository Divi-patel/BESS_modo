"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Panel } from "@/components/Panel";
import { BasisChart } from "@/components/BasisChart";
import { BasisTable } from "@/components/BasisTable";
import { getBacktestSummary, getNodeRows } from "@/lib/data";
import { SITE_META } from "@/lib/constants";
import type { BacktestRow } from "@/types";

export default function BasisPage() {
  const [rows, setRows] = useState<BacktestRow[] | null>(null);

  useEffect(() => {
    getBacktestSummary().then(setRows);
  }, []);

  if (!rows) {
    return (
      <>
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div className="h-[420px] animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
            <div className="h-[300px] animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
          </div>
        </div>
      </>
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
    <>
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20 px-4 py-3">
            <p className="text-sm text-[var(--color-accent)] font-medium">
              Nodes with higher price volatility earn more from arbitrage — same region, dramatically different economics.
            </p>
          </div>

          <Panel label="Hub vs Node Revenue — 5 ERCOT Sites">
            <BasisChart hubRevenue={hubWestRev} nodes={chartNodes} />
          </Panel>

          <Panel label="Site Metrics">
            <BasisTable data={tableData} />
          </Panel>
        </div>
      </main>
    </>
  );
}
