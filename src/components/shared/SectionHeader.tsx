"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  imdbStyle = true,
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  imdbStyle?: boolean;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div
            className={`w-1.5 h-7 rounded-full transition-all ${
              imdbStyle
                ? "bg-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]"
                : "bg-gradient-to-b from-[var(--brand-primary)] to-[var(--brand-secondary)] shadow-[0_0_12px_rgba(99,102,241,0.4)]"
            }`}
          />
          {viewAllHref ? (
            <Link href={viewAllHref} className="group flex items-center gap-1.5">
              <h2
                className="text-xl md:text-2xl font-extrabold tracking-tight group-hover:text-amber-400 transition-colors"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
              >
                {title}
              </h2>
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <h2
              className="text-xl md:text-2xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}
            >
              {title}
            </h2>
          )}
        </div>
        {subtitle && (
          <p className="ml-[1.15rem] text-xs md:text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98]"
          style={{
            color: "#f59e0b",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.1)",
          }}
        >
          View All
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      )}
    </div>
  );
}
