"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getTopRatedMovies } from "@/lib/tmdb";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function TopRatedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
      </div>
    }>
      <TopRatedContent />
    </Suspense>
  );
}

function TopRatedContent() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");

  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    document.title = "Top Rated Movies | MovieVerse";
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

        let results: any[] = [];
        let totalResults = 0;

        if (tmdbPageStart === tmdbPageEnd) {
          const response = await getTopRatedMovies(tmdbPageStart);
          const tmdbResults = response?.results || [];
          totalResults = response?.total_results || 0;
          
          const sliceStart = startIndex % 20;
          results = tmdbResults.slice(sliceStart, sliceStart + pageSize);
        } else {
          const [response1, response2] = await Promise.all([
            getTopRatedMovies(tmdbPageStart),
            getTopRatedMovies(tmdbPageEnd),
          ]);
          const tmdbResults1 = response1?.results || [];
          const tmdbResults2 = response2?.results || [];
          totalResults = response1?.total_results || 0;

          const combined = [...tmdbResults1, ...tmdbResults2];
          const sliceStart = startIndex % 20;
          results = combined.slice(sliceStart, sliceStart + pageSize);
        }

        setTotalPages(Math.ceil(totalResults / pageSize));

        const normalized = results.map((item: any) => ({
          id: item.id,
          title: item.title || item.name || "Untitled",
          poster_path: item.poster_path || null,
          backdrop_path: item.backdrop_path || null,
          vote_average: item.vote_average || 0,
          release_date: item.release_date || item.first_air_date || "",
          genre_ids: item.genre_ids || [],
          overview: item.overview || "",
          media_type: "movie",
        }));
        setMovies(normalized);
      } catch (error) {
        console.error("Error fetching top rated movies:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [page]);

  const buildPageUrl = (pageNumber: number) => {
    return `/top-rated?page=${pageNumber}`;
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="⭐ Top Rated Movies"
          subtitle="The highest critically-acclaimed movies of all time"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : movies.length > 0 ? (
        <MovieGrid movies={movies} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-5xl">🤷‍♂️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Movies Found</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            We couldn't retrieve the top rated movie list. Please check back in a moment.
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          {page > 1 ? (
            <Link
              href={buildPageUrl(page - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-primary)]/50 text-[var(--text-muted)] cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          )}

          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Page {page} of {Math.min(totalPages, 500)}
          </span>

          {page < totalPages && page < 500 ? (
            <Link
              href={buildPageUrl(page + 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-primary)]/50 text-[var(--text-muted)] cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
