"use client";

import { useState } from "react";
import { AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";

const ASSUMPTIONS = [
  { id: "A1", text: "Perfect foresight — overstates achievable arbitrage revenue", warn: true },
  { id: "A2", text: "Energy arbitrage only — no ancillary services, capacity payments, or value stacking", warn: true },
  { id: "A3", text: "No degradation — overstates long-term revenue by ignoring capacity fade", warn: false },
  { id: "A4", text: "Independent monthly optimization — no cross-month SOC strategy", warn: false },
  { id: "A5", text: "Hourly resolution — 15-min data would capture additional sub-hourly volatility", warn: false },
];

export function AssumptionBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={11} className="text-[var(--color-warning)] shrink-0" />
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {expanded ? "Model Assumptions" : (
              <>
                <span className="text-[var(--color-warning)]">A1 Perfect foresight</span>
                {" · "}
                <span className="text-[var(--color-warning)]">A2 Energy-only</span>
                {" · A3 No degradation · A4 Monthly reset · A5 Hourly"}
              </>
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronDown size={11} className="text-[var(--color-text-muted)]" />
        ) : (
          <ChevronUp size={11} className="text-[var(--color-text-muted)]" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-2.5 space-y-1">
          {ASSUMPTIONS.map((a) => (
            <div key={a.id} className="flex items-start gap-2 text-[10px]">
              <span className={`font-mono font-semibold shrink-0 ${
                a.warn ? "text-[var(--color-warning)]" : "text-[var(--color-text-muted)]"
              }`}>
                {a.id}
              </span>
              <span className={a.warn ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}>
                {a.text}
              </span>
            </div>
          ))}
          <div className="text-[9px] text-[var(--color-text-muted)] pt-1">
            Revenue figures represent theoretical upper bounds. See way_ahead.md for Gen 2–5 roadmap addressing these limitations.
          </div>
        </div>
      )}
    </div>
  );
}
