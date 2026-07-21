"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getTrending } from "@/lib/tmdb";
import MovieGrid from "@/components/movie/MovieGrid";
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, Flame } from "lucide-react";

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
      {/* Premium Page Header */}
      <div className="page-header">
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div className="space-y-1.5">
            <h1
              className="text-2xl md:text-3xl font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Trending Worldwide
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-lg">
              The hottest movies and series being talked about right now, updated in real-time
            </p>
          </div>
        </div>
        {/* Stats badges */}
        <div className="relative z-10 flex items-center gap-3 mt-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            {allMovies.length} titles
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-tertiary)]">
            Page {page} of {totalPages}
          </span>
        </div>
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

      {/* Premium Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-8">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="pagination-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => goToPage(num)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  num === page
                    ? "pagination-btn-active"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="pagination-btn"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
