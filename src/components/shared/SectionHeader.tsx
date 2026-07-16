"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({
  title,
  subtitle,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[var(--brand-primary)] to-[var(--brand-secondary)]" />
          <h2
            className="text-xl md:text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="ml-[1.15rem] text-sm" style={{ color: "var(--text-tertiary)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all duration-200 group"
          style={{
            color: "var(--brand-primary-light)",
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.15)",
          }}
        >
          View All
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
