"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUpcomingMovies } from "@/lib/tmdb";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const PAGE_SIZE = 12;

export default function UpcomingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)]" />
      </div>
    }>
      <UpcomingContent />
    </Suspense>
  );
}

function UpcomingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") || "1");

  const [allMovies, setAllMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Upcoming Movies | MovieVerse";
  }, []);

  // Fetch ALL data once, then paginate client-side
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await getUpcomingMovies(1, "IN");
        const results = response?.results || [];

        const now = new Date();
        const normalized = results.map((item: any) => {
          let countdownText = "";
          if (item.release_date) {
            const relDate = new Date(item.release_date);
            if (relDate > now) {
              const diff = relDate.getTime() - now.getTime();
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              if (days > 3) {
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const m = months[relDate.getMonth()];
                const d = relDate.getDate();
                const y = relDate.getFullYear();
                countdownText = `${m} ${d}, ${y}`;
              }
            }
          }

          return {
            id: item.id,
            title: item.title || item.name || "Untitled",
            poster_path: item.poster_path || null,
            backdrop_path: item.backdrop_path || null,
            vote_average: item.vote_average || 0,
            release_date: item.release_date || item.first_air_date || "",
            genre_ids: item.genre_ids || [],
            overview: item.overview || "",
            media_type: "movie",
            countdownText,
          };
        });
        setAllMovies(normalized);
      } catch (error) {
        console.error("Error fetching upcoming movies:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Live countdown timer
  useEffect(() => {
    if (allMovies.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const updatedMovies = allMovies.map((movie) => {
        if (!movie.release_date) return movie;
        const relDate = new Date(movie.release_date);
        const releaseTime = relDate.getTime();
        const diff = releaseTime - now;

        let countdownText = "";
        if (diff <= 0) {
          countdownText = "";
        } else {
          const seconds = Math.floor(diff / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          if (days > 3) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const m = months[relDate.getMonth()];
            const d = relDate.getDate();
            const y = relDate.getFullYear();
            countdownText = `${m} ${d}, ${y}`;
          } else if (days > 0) {
            countdownText = `${days}d ${hours % 24}h`;
          } else if (hours > 0) {
            countdownText = `${hours}h ${minutes % 60}m`;
          } else if (minutes > 0) {
            countdownText = `${minutes}m ${seconds % 60}s`;
          } else {
            countdownText = `${seconds}s`;
          }
        }

        if (movie.countdownText !== countdownText) {
          changed = true;
          return { ...movie, countdownText };
        }
        return movie;
      });

      if (changed) {
        setAllMovies(updatedMovies);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [allMovies]);

  const totalPages = Math.max(1, Math.ceil(allMovies.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedMovies = allMovies.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (pageNumber: number) => {
    router.push(`/upcoming?page=${pageNumber}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="📅 Upcoming Movies"
          subtitle="Be the first to see trailers and details of movies coming soon"
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
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Upcoming Movies</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            We couldn't retrieve the upcoming list. Please check back in a moment.
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
