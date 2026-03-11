"use client";

import { useState, useEffect } from "react";
import { Panel } from "@/components/Panel";
import { SensitivityChart } from "@/components/SensitivityChart";
import { SensitivityHeatmap } from "@/components/SensitivityHeatmap";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { getRteSensitivity, getDurationSensitivity } from "@/lib/data";
import { useDashboard } from "@/components/DashboardProvider";
import type { RteSensitivity, DurationSensitivity } from "@/types";

const LABEL_MAP: Record<string, string> = {
  HB_HOUSTON: "Houston Hub",
  HB_NORTH: "North Hub",
  HB_SOUTH: "South Hub",
  HB_WEST: "West Hub",
  LAMESASLR_G: "Lamesa Solar",
  LHORN_N_U1_2: "Longhorn Wind",
  MISAE_GEN_RN: "Misae Solar",
  PC_NORTH_1: "Panther Creek",
  SWEC_G1: "Stanton Wind",
};

export default function SensitivityPage() {
  const { config, currentScenario, matrix } = useDashboard();
  const [rteData, setRteData] = useState<RteSensitivity[] | null>(null);
  const [durationData, setDurationData] = useState<DurationSensitivity[] | null>(null);

  useEffect(() => {
    getRteSensitivity().then(setRteData);
    getDurationSensitivity().then(setDurationData);
  }, []);

  const locationLabel = LABEL_MAP[config.location] ?? config.location;
  const hasMatrix = matrix.length > 0;

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          Sensitivity Analysis
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          {locationLabel} &middot; {config.market} Market &middot; {config.year}
          {currentScenario && (
            <span className="ml-2 text-[var(--color-accent)]">
              Current: ${currentScenario.revenue_per_kw_yr.toFixed(1)}/kW/yr
            </span>
          )}
        </p>
      </div>

      {/* Insight cards */}
      <div className="flex gap-3 w-full">
        <div className="flex-1 min-w-0 rounded-lg border border-[var(--color-safe)]/40 bg-[var(--color-surface)] px-4 py-3">
          <div className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            RTE Impact
          </div>
          <div className="text-lg font-mono font-bold text-[var(--color-safe)] mt-1">
            +1% RTE ≈ +$0.6/kW/yr
          </div>
        </div>
        <div className="flex-1 min-w-0 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-surface)] px-4 py-3">
          <div className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Duration Insight
          </div>
          <div className="text-lg font-mono font-bold text-[var(--color-text)] mt-1">
            4h captures 81% of 8h revenue
          </div>
        </div>
      </div>

      {/* NEW: Sensitivity Heatmap */}
      {hasMatrix && (
        <Panel title="RTE × Duration Revenue Surface" subtitle="Circle marker shows your current configuration. Color = $/kW/yr revenue.">
          <SensitivityHeatmap />
        </Panel>
      )}

      {/* Existing line charts */}
      {rteData && durationData && (
        <CollapsiblePanel title="1D Sensitivity Curves" subtitle="RTE sweep at 4h, duration sweep at 87% RTE">
          <SensitivityChart rteData={rteData} durationData={durationData} />
        </CollapsiblePanel>
      )}

      {/* Gen 3 + Gen 4 Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlaceholderPanel
          title="P50/P90 Revenue Bands"
          description="Probabilistic revenue distributions using historical replay and Monte Carlo simulation. Shows median, conservative, and lender-floor revenue estimates."
          gen={3}
        >
          <div className="h-48 flex items-end gap-1 px-8 pb-4">
            {[28, 35, 42, 52, 48, 55, 62, 58, 45, 38, 32, 25].map((v, i) => (
              <div key={i} className="flex-1 bg-[var(--color-accent)] rounded-t" style={{ height: `${v}%` }} />
            ))}
          </div>
        </PlaceholderPanel>

        <PlaceholderPanel
          title="10-Year Lifecycle Projection"
          description="Battery capacity degradation modeling with LFP/NMC chemistry comparison, augmentation scheduling, and NPV analysis."
          gen={4}
        >
          <div className="h-48 flex items-center px-8">
            <svg viewBox="0 0 200 80" className="w-full h-full">
              <path d="M10,10 Q50,12 100,25 T190,60" stroke="var(--color-accent)" fill="none" strokeWidth="2" />
              <path d="M10,10 Q50,15 100,35 T190,70" stroke="var(--color-warning)" fill="none" strokeWidth="1.5" strokeDasharray="4,3" />
              <text x="10" y="8" fontSize="6" fill="var(--color-text-muted)">100%</text>
              <text x="170" y="58" fontSize="6" fill="var(--color-text-muted)">~82%</text>
            </svg>
          </div>
        </PlaceholderPanel>
      </div>
    </div>
  );
}
