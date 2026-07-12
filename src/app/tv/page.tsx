"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { discoverTVShows, getTVGenres } from "@/lib/tmdb";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import FilterToolbar from "@/components/movie/FilterToolbar";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function TVExplorePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
      </div>
    }>
      <TVExploreContent />
    </Suspense>
  );
}

function TVExploreContent() {
  const searchParams = useSearchParams();

  const genre = searchParams.get("genre") || "";
  const sortBy = searchParams.get("sortBy") || "popularity.desc";
  const year = searchParams.get("year") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [genres, setGenres] = useState<any[]>([]);
  const [shows, setShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    document.title = "Explore TV Shows | MovieVerse";
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const pageSize = 12;
        const startIndex = (page - 1) * pageSize;
        const endIndex = page * pageSize;

        const tmdbPageStart = Math.floor(startIndex / 20) + 1;
        const tmdbPageEnd = Math.floor((endIndex - 1) / 20) + 1;

        let genresRes;
        let results: any[] = [];
        let totalResults = 0;

        if (tmdbPageStart === tmdbPageEnd) {
          const [gRes, tvRes] = await Promise.all([
            getTVGenres(),
            discoverTVShows({
              page: tmdbPageStart,
              sortBy,
              withGenres: genre,
            }),
          ]);
          genresRes = gRes;
          const tmdbResults = tvRes?.results || [];
          totalResults = tvRes?.total_results || 0;
          
          const sliceStart = startIndex % 20;
          results = tmdbResults.slice(sliceStart, sliceStart + pageSize);
        } else {
          const [gRes, tvRes1, tvRes2] = await Promise.all([
            getTVGenres(),
            discoverTVShows({
              page: tmdbPageStart,
              sortBy,
              withGenres: genre,
            }),
            discoverTVShows({
              page: tmdbPageEnd,
              sortBy,
              withGenres: genre,
            }),
          ]);
          genresRes = gRes;
          const tmdbResults1 = tvRes1?.results || [];
          const tmdbResults2 = tvRes2?.results || [];
          totalResults = tvRes1?.total_results || 0;

          const combined = [...tmdbResults1, ...tmdbResults2];
          const sliceStart = startIndex % 20;
          results = combined.slice(sliceStart, sliceStart + pageSize);
        }

        setGenres(genresRes?.genres || []);
        setTotalPages(Math.ceil(totalResults / pageSize));

        const normalizedShows = results.map((m) => ({
          id: m.id,
          title: m.name || m.title || "Untitled",
          poster_path: m.poster_path || null,
          backdrop_path: m.backdrop_path || null,
          vote_average: m.vote_average || 0,
          release_date: m.first_air_date || m.release_date || "",
          genre_ids: m.genre_ids || [],
          overview: m.overview || "",
          media_type: "tv",
        }));
        setShows(normalizedShows);
      } catch (error) {
        console.error("Failed to load TV shows:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [genre, sortBy, year, page]);

  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (genre) params.set("genre", genre);
    if (sortBy) params.set("sortBy", sortBy);
    if (year) params.set("year", year);
    params.set("page", pageNumber.toString());
    return `/tv?${params.toString()}`;
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="📺 Explore TV Shows"
          subtitle="Discover your next favorite series using filters"
        />
      </div>

      <FilterToolbar
        genres={genres}
        selectedGenre={genre}
        selectedSort={sortBy}
        selectedYear={year}
        baseUrl="/tv"
      />

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : shows.length > 0 ? (
        <MovieGrid movies={shows} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-5xl">🤷‍♂️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No TV Shows Found</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            No TV shows match the selected filters. Try changing your genre or sorting method.
          </p>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 pt-10 border-t border-[var(--border-primary)]/40 mt-10">
          <div className="flex items-center justify-center gap-4">
            {page > 1 ? (
              <Link
                href={buildPageUrl(page - 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 hover:bg-[var(--bg-elevated)] transition-all duration-300"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Page
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[var(--bg-surface)]/30 border border-[var(--border-primary)]/30 text-[var(--text-muted)] cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Page
              </button>
            )}

            <div className="flex flex-col items-center text-center px-4">
              <span className="text-xs font-bold text-white">
                Page {page} of {Math.min(totalPages, 1250)}
              </span>
              {page < totalPages && page < 1250 && (
                <span className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5 uppercase tracking-wide">
                  Next: Page {page + 1}
                </span>
              )}
            </div>

            {page < totalPages && page < 1250 ? (
              <Link
                href={buildPageUrl(page + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]/50 hover:bg-[var(--bg-elevated)] transition-all duration-300"
              >
                Next Page
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[var(--bg-surface)]/30 border border-[var(--border-primary)]/30 text-[var(--text-muted)] cursor-not-allowed"
              >
                Next Page
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          

        </div>
      )}
    </div>
  );
}
