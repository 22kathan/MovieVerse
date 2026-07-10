import { Metadata } from "next";
import { getTrending } from "@/lib/tmdb";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TrendingPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Trending Today | MovieVerse",
  description: "Explore the most trending movies and TV shows watched worldwide today.",
};

export const dynamic = "force-static";

export default async function TrendingPage({ searchParams }: TrendingPageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || "1");

  let response;
  try {
    response = await getTrending("all", "day", page);
  } catch (error) {
    console.error("Error fetching trending data:", error);
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
    media_type: item.media_type || "movie",
  }));

  const buildPageUrl = (pageNumber: number) => {
    return `/trending?page=${pageNumber}`;
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="⚡ Trending Worldwide"
          subtitle="The hottest movies and series being talked about right now"
        />
      </div>

      {normalized.length > 0 ? (
        <MovieGrid movies={normalized} />
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
