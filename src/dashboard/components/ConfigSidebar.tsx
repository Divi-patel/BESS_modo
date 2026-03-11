"use client";

import { useDashboard } from "./DashboardProvider";
import { Battery, MapPin, Calendar, Settings2, ChevronLeft, ChevronRight, Layers, BarChart2, TrendingDown, Globe } from "lucide-react";
import { useState } from "react";

const LOCATIONS = [
  { group: "Hubs", items: [
    { value: "HB_WEST", label: "HB West" },
    { value: "HB_NORTH", label: "HB North" },
    { value: "HB_SOUTH", label: "HB South" },
    { value: "HB_HOUSTON", label: "HB Houston" },
  ]},
  { group: "Resource Nodes", items: [
    { value: "LAMESASLR_G", label: "Lamesa Solar" },
    { value: "MISAE_GEN_RN", label: "Misae Solar" },
    { value: "LHORN_N_U1_2", label: "Longhorn Wind" },
    { value: "PC_NORTH_1", label: "Panther Creek" },
    { value: "SWEC_G1", label: "Stanton Wind" },
  ]},
];

const DURATION_OPTIONS = [
  { value: 1, label: "1h" },
  { value: 2, label: "2h" },
  { value: 4, label: "4h" },
  { value: 6, label: "6h" },
  { value: 8, label: "8h" },
];

export function ConfigSidebar() {
  const { config, setConfig, meta, currentScenario, loading } = useDashboard();
  const [collapsed, setCollapsed] = useState(false);

  const years = meta?.years ?? [2024];

  if (collapsed) {
    return (
      <aside className="
        hidden md:flex flex-col items-center
        w-10 border-r border-[var(--color-border)]
        bg-[var(--color-surface)] py-3
      ">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
          title="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
        <div className="mt-4 flex flex-col gap-3 items-center">
          <MapPin size={12} className="text-[var(--color-text-muted)]" />
          <Battery size={12} className="text-[var(--color-text-muted)]" />
          <Calendar size={12} className="text-[var(--color-text-muted)]" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="
      hidden md:flex flex-col
      w-64 border-r border-[var(--color-border)]
      bg-[var(--color-surface)]
      overflow-y-auto shrink-0
    ">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-1.5">
          <Settings2 size={13} className="text-[var(--color-text-muted)]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Configuration
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
          title="Collapse sidebar"
        >
          <ChevronLeft size={13} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-4">
        {/* Location Section */}
        <Section icon={<MapPin size={12} />} title="Location">
          <Field label="Node / Hub">
            <select
              value={config.location}
              onChange={(e) => setConfig({ location: e.target.value })}
              className="sidebar-select"
            >
              {LOCATIONS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.items.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>

          <Field label="Market">
            <TogglePair
              options={["DA", "RT"] as const}
              value={config.market}
              onChange={(v) => setConfig({ market: v as "DA" | "RT" })}
            />
          </Field>
        </Section>

        {/* BESS Parameters */}
        <Section icon={<Battery size={12} />} title="BESS Parameters">
          <Field label={`RTE: ${(config.rte * 100).toFixed(0)}%`}>
            <input
              type="range"
              min={78}
              max={95}
              step={1}
              value={config.rte * 100}
              onChange={(e) => setConfig({ rte: Number(e.target.value) / 100 })}
              className="sidebar-slider"
            />
            <div className="flex justify-between text-[9px] text-[var(--color-text-muted)] -mt-0.5">
              <span>78%</span>
              <span>95%</span>
            </div>
          </Field>

          <Field label="Duration">
            <div className="flex gap-1">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setConfig({ durationHours: opt.value })}
                  className={`
                    flex-1 py-1 text-[10px] font-medium rounded transition-colors
                    ${config.durationHours === opt.value
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="text-[9px] text-[var(--color-text-muted)] px-0.5">
            100 MW / {config.durationHours * 100} MWh &middot; SOC 5-95%
          </div>
        </Section>

        {/* Time Period */}
        <Section icon={<Calendar size={12} />} title="Time Period">
          <Field label="Year">
            <select
              value={config.year}
              onChange={(e) => setConfig({ year: Number(e.target.value) })}
              className="sidebar-select"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>
        </Section>

        {/* Current Scenario Summary */}
        {currentScenario && (
          <div className="mt-1 p-2.5 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Current Scenario
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="Revenue"
                value={`$${currentScenario.revenue_per_kw_yr.toFixed(1)}`}
                unit="/kW/yr"
              />
              <Metric
                label="Cycles"
                value={currentScenario.total_cycles.toFixed(0)}
                unit="/yr"
              />
            </div>
          </div>
        )}

        {loading && (
          <div className="text-[10px] text-[var(--color-text-muted)] text-center py-2">
            Loading scenario data...
          </div>
        )}

        {/* ── Future Vision Controls (disabled) ──────────────── */}
        <div className="border-t border-[var(--color-border-subtle)] pt-3 mt-1">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 px-0.5">
            Roadmap
          </div>

          {/* Gen 2: Revenue Streams */}
          <DisabledSection icon={<Layers size={12} />} title="Revenue Streams" gen={2}>
            <Field label="Sources">
              <div className="flex gap-1">
                <span className="flex-1 py-1 text-[10px] font-medium rounded text-center bg-[var(--color-accent)] text-white">Energy Arb</span>
                <span className="flex-1 py-1 text-[10px] font-medium rounded text-center bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">Ancillary</span>
                <span className="flex-1 py-1 text-[10px] font-medium rounded text-center bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">Capacity</span>
              </div>
            </Field>
          </DisabledSection>

          {/* Gen 3: Risk Model */}
          <DisabledSection icon={<BarChart2 size={12} />} title="Risk Model" gen={3}>
            <Field label="Method">
              <select className="sidebar-select" disabled>
                <option>Deterministic</option>
                <option>Historical Replay</option>
                <option>Monte Carlo</option>
              </select>
            </Field>
          </DisabledSection>

          {/* Gen 4: Degradation */}
          <DisabledSection icon={<TrendingDown size={12} />} title="Degradation" gen={4}>
            <Field label="Chemistry">
              <div className="flex gap-1">
                <span className="flex-1 py-1 text-[10px] font-medium rounded text-center bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">LFP</span>
                <span className="flex-1 py-1 text-[10px] font-medium rounded text-center bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">NMC</span>
              </div>
            </Field>
            <Field label="Rate">
              <input type="text" value="2.0%/yr" disabled className="sidebar-select" />
            </Field>
          </DisabledSection>

          {/* Gen 5: Multi-ISO */}
          <DisabledSection icon={<Globe size={12} />} title="ISO / Region" gen={5}>
            <Field label="Market">
              <div className="flex gap-1 flex-wrap">
                <span className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--color-accent)] text-white">ERCOT</span>
                <span className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">PJM</span>
                <span className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">CAISO</span>
                <span className="px-2 py-1 text-[10px] font-medium rounded bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">NYISO</span>
              </div>
            </Field>
          </DisabledSection>
        </div>
      </div>
    </aside>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[var(--color-text-muted)]">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-2.5 pl-0.5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-[var(--color-text-secondary)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function TogglePair<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md overflow-hidden border border-[var(--color-border-subtle)]">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`
            flex-1 py-1 text-[10px] font-medium transition-colors
            ${value === opt
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            }
          `}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function DisabledSection({
  icon,
  title,
  gen,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  gen: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 opacity-40 pointer-events-none select-none">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[var(--color-text-muted)]">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          {title}
        </span>
        <span className="ml-auto text-[8px] font-mono text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] px-1 py-0.5 rounded">
          Gen {gen}
        </span>
      </div>
      <div className="flex flex-col gap-2.5 pl-0.5">{children}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div>
      <div className="text-[9px] text-[var(--color-text-muted)]">{label}</div>
      <div className="text-sm font-semibold text-[var(--color-text)]">
        {value}
        <span className="text-[9px] font-normal text-[var(--color-text-muted)]">
          {unit}
        </span>
      </div>
    </div>
  );
}
