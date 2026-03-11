"use client";

import { Lock } from "lucide-react";

interface PlaceholderPanelProps {
  title: string;
  description: string;
  gen: number;
  children?: React.ReactNode;
}

export function PlaceholderPanel({ title, description, gen, children }: PlaceholderPanelProps) {
  return (
    <div className="relative rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 overflow-hidden">
      {/* Content (grayed out) */}
      <div className="opacity-30 pointer-events-none select-none">
        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
          {title}
        </div>
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/60 backdrop-blur-[1px]">
        <div className="flex flex-col items-center gap-2 text-center px-6">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Gen {gen}
            </span>
          </div>
          <div className="text-sm font-medium text-[var(--color-text-secondary)]">
            {title}
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] max-w-xs">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
