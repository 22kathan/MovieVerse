import { Metadata } from "next";
import { getUpcomingMovies } from "@/lib/tmdb";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface UpcomingPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Upcoming Movies | MovieVerse",
  description: "Discover new movies scheduled to release in theatres and digital streaming soon.",
};

export default async function UpcomingPage({ searchParams }: UpcomingPageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");

  let response;
  try {
    response = await getUpcomingMovies(page);
  } catch (error) {
    console.error("Error fetching upcoming movies:", error);
  }

  const results = response?.results || [];
  const totalPages = response?.total_pages || 1;

  const normalized = results.map((item) => ({
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

  const buildPageUrl = (pageNumber: number) => {
    return `/upcoming?page=${pageNumber}`;
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="📅 Upcoming Movies"
          subtitle="Be the first to see trailers and details of movies coming soon"
        />
      </div>

      {normalized.length > 0 ? (
        <MovieGrid movies={normalized} />
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
      {totalPages > 1 && (
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
