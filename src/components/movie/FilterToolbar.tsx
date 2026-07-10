"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

interface Genre {
  id: number;
  name: string;
}

interface FilterToolbarProps {
  genres: Genre[];
  selectedGenre?: string;
  selectedSort?: string;
  selectedYear?: string;
  baseUrl: string;
}

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Most Popular" },
  { value: "vote_average.desc", label: "Top Rated" },
  { value: "primary_release_date.desc", label: "Release Date" },
  { value: "vote_count.desc", label: "Most Reviewed" },
];

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

export default function FilterToolbar({
  genres,
  selectedGenre = "",
  selectedSort = "popularity.desc",
  selectedYear = "",
  baseUrl,
}: FilterToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.push(`${baseUrl}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-primary)] shadow-sm">
      <div className="flex items-center gap-2 text-[var(--text-primary)] shrink-0 font-semibold text-sm">
        <SlidersHorizontal className="w-4 h-4 text-[var(--brand-primary-light)]" />
        <span>Filters</span>
      </div>

      {/* Genre Filter */}
      <div className="flex-1 min-w-[140px]">
        <select
          value={selectedGenre}
          onChange={(e) => handleFilterChange("genre", e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[var(--brand-primary)] transition-all cursor-pointer"
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id.toString()}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>

      {/* Year Filter */}
      <div className="w-full sm:w-36">
        <select
          value={selectedYear}
          onChange={(e) => handleFilterChange("year", e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[var(--brand-primary)] transition-all cursor-pointer"
        >
          <option value="">Any Year</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By Filter */}
      <div className="w-full sm:w-44">
        <select
          value={selectedSort}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs rounded-xl px-3 py-2.5 outline-none focus:border-[var(--brand-primary)] transition-all cursor-pointer font-medium"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      {(selectedGenre || selectedYear || selectedSort !== "popularity.desc") && (
        <button
          onClick={() => router.push(baseUrl)}
          className="px-4 py-2 text-xs font-semibold text-[var(--brand-primary-light)] hover:text-white transition-colors text-center"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
