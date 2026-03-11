"use client";

interface BasisRow {
  site: string;
  type: string;
  mw: number;
  node: string;
  hub_rev: number;
  node_rev: number;
  basis_pct: number;
}

interface BasisTableProps {
  data: BasisRow[];
}

export function BasisTable({ data }: BasisTableProps) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-surface-hover)]">
            <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">
              Site
            </th>
            <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">
              Type
            </th>
            <th className="text-right px-4 py-2 font-medium text-[var(--color-text-secondary)]">
              MW
            </th>
            <th className="text-left px-4 py-2 font-medium text-[var(--color-text-secondary)]">
              Node
            </th>
            <th className="text-right px-4 py-2 font-medium text-[var(--color-text-secondary)]">
              Hub Rev
            </th>
            <th className="text-right px-4 py-2 font-medium text-[var(--color-text-secondary)]">
              Node Rev
            </th>
            <th className="text-right px-4 py-2 font-medium text-[var(--color-text-secondary)]">
              Basis Impact
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.site}
              className={
                i % 2 === 0
                  ? "bg-[var(--color-surface)]"
                  : "bg-[var(--color-surface-hover)]"
              }
            >
              <td className="px-4 py-2 text-[var(--color-text)]">
                {row.site}
              </td>
              <td className="px-4 py-2 text-[var(--color-text-secondary)]">
                {row.type}
              </td>
              <td className="px-4 py-2 text-right font-mono text-[var(--color-text)]">
                {row.mw.toFixed(0)}
              </td>
              <td className="px-4 py-2 text-[var(--color-text-secondary)] font-mono text-xs">
                {row.node}
              </td>
              <td className="px-4 py-2 text-right font-mono text-[var(--color-text)]">
                ${row.hub_rev.toFixed(1)}
              </td>
              <td className="px-4 py-2 text-right font-mono text-[var(--color-text)]">
                ${row.node_rev.toFixed(1)}
              </td>
              <td
                className={`px-4 py-2 text-right font-mono font-medium ${
                  row.basis_pct >= 0
                    ? "text-[var(--color-safe)]"
                    : "text-[var(--color-breach)]"
                }`}
              >
                {row.basis_pct > 0 ? "+" : ""}
                {row.basis_pct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
