export function Footer() {
  return (
    <footer className="px-4 py-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
      <div className="text-[9px] text-[var(--color-text-muted)] flex items-center justify-between gap-4 flex-wrap">
        <span>
          Data: ERCOT Settlement Point Prices 2010–2025 &middot; EIA Form 860 BESS Registry (1,331 units)
          &middot; 7,630 pre-computed dispatch scenarios
        </span>
        <span>
          Modo Energy Open Tech Challenge &middot; Divy Patel &middot; 2026
        </span>
      </div>
    </footer>
  );
}
