"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsiblePanelProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsiblePanel({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        {open ? (
          <ChevronDown size={13} className="text-[var(--color-text-muted)] shrink-0" />
        ) : (
          <ChevronRight size={13} className="text-[var(--color-text-muted)] shrink-0" />
        )}
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            {title}
          </span>
          {subtitle && !open && (
            <span className="ml-2 text-[10px] text-[var(--color-text-muted)] font-normal normal-case tracking-normal">
              {subtitle}
            </span>
          )}
        </div>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
