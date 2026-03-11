export function Panel({
  children,
  label,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  label?: string;
  title?: string;
  subtitle?: string;
}) {
  const heading = title ?? label;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {heading && (
        <div className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            {heading}
          </div>
          {subtitle && (
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-normal normal-case tracking-normal">
              {subtitle}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
