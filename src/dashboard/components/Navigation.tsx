"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import {
  BarChart3,
  TrendingUp,
  Sliders,
  Zap,
  GitBranch,
  Database,
} from "lucide-react";

const TABS = [
  { label: "Overview", href: "/", icon: BarChart3 },
  { label: "Explorer", href: "/explorer", icon: TrendingUp },
  { label: "Sensitivity", href: "/sensitivity", icon: Sliders },
  { label: "Dispatch", href: "/dispatch", icon: Zap },
  { label: "Colocation", href: "/colocation", icon: GitBranch },
  { label: "Registry", href: "/registry", icon: Database },
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="
        sticky top-0 z-50
        flex items-center justify-between
        border-b border-[var(--color-border)]
        bg-[var(--color-surface)] backdrop-blur
        px-4 h-11
      "
    >
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
            BESS Arbitrage
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[var(--color-safe-subtle)] text-[var(--color-safe)] border border-[var(--color-safe)]/30">
            GEN 1
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {TABS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-1.5
                  px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors
                  ${
                    isActive
                      ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                  }
                `}
              >
                <Icon size={12} />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <ThemeToggle />
    </nav>
  );
}
