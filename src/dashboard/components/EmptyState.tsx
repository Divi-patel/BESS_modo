"use client";

import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  message: string;
  detail?: string;
  height?: string;
}

export function EmptyState({ message, detail, height = "h-64" }: EmptyStateProps) {
  return (
    <div className={`${height} flex flex-col items-center justify-center gap-2 text-center px-6`}>
      <AlertCircle size={20} className="text-[var(--color-text-muted)]" />
      <div className="text-sm font-medium text-[var(--color-text-secondary)]">
        {message}
      </div>
      {detail && (
        <div className="text-[10px] text-[var(--color-text-muted)] max-w-sm">
          {detail}
        </div>
      )}
    </div>
  );
}
