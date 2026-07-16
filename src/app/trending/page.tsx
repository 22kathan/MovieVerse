"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getTrending } from "@/lib/tmdb";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const PAGE_SIZE = 12;

export default function TrendingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
      </div>
    }>
      <TrendingContent />
    </Suspense>
  );
}

function TrendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") || "1");

  const [allMovies, setAllMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Trending Today | MovieVerse";
  }, []);

  // Fetch ALL data once, then paginate client-side
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await getTrending("all", "day", 1);
        const results = response?.results || [];

        const normalized = results.map((item: any) => ({
          id: item.id,
          title: item.title || item.name || "Untitled",
          poster_path: item.poster_path || null,
          backdrop_path: item.backdrop_path || null,
          vote_average: item.vote_average || 0,
          release_date: item.release_date || item.first_air_date || "",
          genre_ids: item.genre_ids || [],
          overview: item.overview || "",
          media_type: item.media_type || "movie",
        }));
        setAllMovies(normalized);
      } catch (error) {
        console.error("Error fetching trending data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalPages = Math.max(1, Math.ceil(allMovies.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedMovies = allMovies.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (pageNumber: number) => {
    router.push(`/trending?page=${pageNumber}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="⚡ Trending Worldwide"
          subtitle="The hottest movies and series being talked about right now"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : paginatedMovies.length > 0 ? (
        <MovieGrid movies={paginatedMovies} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-5xl">🤷‍♂️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Trending Content</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            We couldn't retrieve the trending list. Please check back in a moment.
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          {page > 1 ? (
            <button
              onClick={() => goToPage(page - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
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
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <button
              onClick={() => goToPage(page + 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
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
