"use client";

import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { exportCsv } from "@/lib/export";
import type { BessUnit } from "@/types";

interface FleetTableProps {
  units: BessUnit[];
  statusFilter: string;
}

export function FleetTable({ units, statusFilter }: FleetTableProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("mw");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const filtered = useMemo(() => {
    let data = units;
    if (statusFilter !== "all") {
      data = data.filter((u) => u.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (u) =>
          u.plant_name?.toLowerCase().includes(q) ||
          u.state?.toLowerCase().includes(q) ||
          u.entity_name?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [units, statusFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const av = (a as any)[sortCol];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bv = (b as any)[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortAsc]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  const columns = [
    { key: "plant_name", label: "Plant", width: "25%" },
    { key: "state", label: "State", width: "8%" },
    { key: "mw", label: "MW", width: "10%" },
    { key: "mwh", label: "MWh", width: "10%" },
    { key: "duration_hours", label: "Dur (h)", width: "10%" },
    { key: "status", label: "Status", width: "12%" },
    { key: "operating_year", label: "Year", width: "10%" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          placeholder="Search plants..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="sidebar-select flex-1 max-w-xs"
        />
        <span className="text-[10px] text-[var(--color-text-muted)]">
          {filtered.length} units
        </span>
        <button
          onClick={() =>
            exportCsv(
              filtered.map((u) => ({
                plant_name: u.plant_name ?? "",
                state: u.state ?? "",
                mw: u.mw ?? "",
                mwh: u.mwh ?? "",
                duration_hours: u.duration_hours ?? "",
                status: u.status ?? "",
                operating_year: u.operating_year ?? "",
                entity_name: u.entity_name ?? "",
                lat: u.lat ?? "",
                lon: u.lon ?? "",
              })),
              "bess-fleet.csv"
            )
          }
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <Download size={10} />
          CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--color-border-subtle)]">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-[var(--color-surface-hover)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-1.5 text-left font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text)]"
                  style={{ width: col.width }}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortCol === col.key && (sortAsc ? " \u25B2" : " \u25BC")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((unit, i) => (
              <tr
                key={i}
                className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]"
              >
                <td className="px-2 py-1.5 text-[var(--color-text)] truncate max-w-[200px]">
                  {unit.plant_name ?? "—"}
                </td>
                <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">
                  {unit.state ?? "—"}
                </td>
                <td className="px-2 py-1.5 text-[var(--color-text)] font-mono">
                  {unit.mw?.toFixed(0) ?? "—"}
                </td>
                <td className="px-2 py-1.5 text-[var(--color-text)] font-mono">
                  {unit.mwh?.toFixed(0) ?? "—"}
                </td>
                <td className="px-2 py-1.5 text-[var(--color-text)] font-mono">
                  {unit.duration_hours?.toFixed(1) ?? "—"}
                </td>
                <td className="px-2 py-1.5">
                  <StatusBadge status={unit.status} />
                </td>
                <td className="px-2 py-1.5 text-[var(--color-text-secondary)] font-mono">
                  {unit.operating_year ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-2 py-1 text-[10px] rounded bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 text-[10px] rounded bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const color =
    status === "Operating"
      ? "var(--color-safe)"
      : status === "Under Construction"
      ? "var(--color-warning)"
      : "var(--color-text-muted)";

  return (
    <span
      className="text-[10px] font-medium"
      style={{ color }}
    >
      {status ?? "—"}
    </span>
  );
}
