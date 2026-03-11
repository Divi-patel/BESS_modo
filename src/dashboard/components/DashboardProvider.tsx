"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type {
  BessConfig,
  ScenarioResult,
  ScenarioMeta,
  PriceStat,
  PriceDurationCurve,
} from "@/types";
import {
  loadScenarioMatrix,
  loadScenarioMeta,
  getInterpolatedScenario,
} from "@/lib/scenario-matrix";

interface DashboardContextValue {
  config: BessConfig;
  setConfig: (update: Partial<BessConfig>) => void;
  matrix: ScenarioResult[];
  meta: ScenarioMeta | null;
  priceStats: PriceStat[];
  priceCurves: PriceDurationCurve[];
  currentScenario: ScenarioResult | null;
  loading: boolean;
}

const DEFAULT_CONFIG: BessConfig = {
  location: "HB_WEST",
  market: "RT",
  year: 2024,
  rte: 0.87,
  durationHours: 4,
  displayUnit: "kw_yr",
};

const DashboardContext = createContext<DashboardContextValue>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  matrix: [],
  meta: null,
  priceStats: [],
  priceCurves: [],
  currentScenario: null,
  loading: true,
});

export function useDashboard() {
  return useContext(DashboardContext);
}

function configFromParams(): Partial<BessConfig> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const partial: Partial<BessConfig> = {};
  if (p.get("location")) partial.location = p.get("location")!;
  if (p.get("market") === "DA" || p.get("market") === "RT") partial.market = p.get("market") as "DA" | "RT";
  if (p.get("year")) partial.year = Number(p.get("year"));
  if (p.get("rte")) partial.rte = Number(p.get("rte"));
  if (p.get("duration")) partial.durationHours = Number(p.get("duration"));
  return partial;
}

function syncParamsToUrl(config: BessConfig) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  p.set("location", config.location);
  p.set("market", config.market);
  p.set("year", String(config.year));
  p.set("rte", String(config.rte));
  p.set("duration", String(config.durationHours));
  const url = `${window.location.pathname}?${p.toString()}`;
  window.history.replaceState(null, "", url);
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<BessConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...configFromParams(),
  }));
  const [matrix, setMatrix] = useState<ScenarioResult[]>([]);
  const [meta, setMeta] = useState<ScenarioMeta | null>(null);
  const [priceStats, setPriceStats] = useState<PriceStat[]>([]);
  const [priceCurves, setPriceCurves] = useState<PriceDurationCurve[]>([]);
  const [loading, setLoading] = useState(true);

  const setConfig = (update: Partial<BessConfig>) => {
    setConfigState((prev) => ({ ...prev, ...update }));
  };

  // Sync config → URL params
  useEffect(() => {
    syncParamsToUrl(config);
  }, [config]);

  // Load all data on mount
  useEffect(() => {
    async function loadAll() {
      try {
        const [matrixData, metaData, statsRes, curvesRes] = await Promise.all([
          loadScenarioMatrix(),
          loadScenarioMeta(),
          fetch("/data/price-stats.json").then((r) => r.json()),
          fetch("/data/price-duration-curves.json").then((r) => r.json()),
        ]);
        setMatrix(matrixData);
        setMeta(metaData);
        setPriceStats(statsRes);
        setPriceCurves(curvesRes);
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
        // Still set loading false so the UI renders (with empty data)
      }
      setLoading(false);
    }
    loadAll();
  }, []);

  const currentScenario = useMemo(() => {
    if (matrix.length === 0) return null;
    return getInterpolatedScenario(matrix, config);
  }, [matrix, config]);

  const value = useMemo(
    () => ({
      config,
      setConfig,
      matrix,
      meta,
      priceStats,
      priceCurves,
      currentScenario,
      loading,
    }),
    [config, matrix, meta, priceStats, priceCurves, currentScenario, loading]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
