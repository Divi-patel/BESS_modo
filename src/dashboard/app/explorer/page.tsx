"use client";

import { Panel } from "@/components/Panel";
import { PriceDurationCurve } from "@/components/PriceDurationCurve";
import { PriceMonthlyStats } from "@/components/PriceMonthlyStats";
import { PriceVolatilityChart } from "@/components/PriceVolatilityChart";
import { useDashboard } from "@/components/DashboardProvider";

const LABEL_MAP: Record<string, string> = {
  HB_HOUSTON: "Houston Hub",
  HB_NORTH: "North Hub",
  HB_SOUTH: "South Hub",
  HB_WEST: "West Hub",
  LAMESASLR_G: "Lamesa Solar Node",
  LHORN_N_U1_2: "Longhorn Wind Node",
  MISAE_GEN_RN: "Misae Solar Node",
  PC_NORTH_1: "Panther Creek Node",
  SWEC_G1: "Stanton Wind Node",
};

export default function ExplorerPage() {
  const { config } = useDashboard();

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          Price Explorer
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
          {LABEL_MAP[config.location] ?? config.location} &middot; {config.market} Market &middot; {config.year}
        </p>
      </div>

      <Panel title="Price Duration Curve" subtitle="Hourly prices sorted descending — wider spread = more arbitrage opportunity">
        <PriceDurationCurve />
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Monthly Price Statistics" subtitle="Percentile bands showing seasonal price patterns">
          <PriceMonthlyStats />
        </Panel>
        <Panel title="Price Volatility by Location" subtitle="Higher volatility locations offer more BESS arbitrage value">
          <PriceVolatilityChart />
        </Panel>
      </div>
    </div>
  );
}
