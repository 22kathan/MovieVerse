import { Metadata } from "next";
import { discoverMovies, getMovieGenres } from "@/lib/tmdb";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import FilterToolbar from "@/components/movie/FilterToolbar";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MoviesPageProps {
  searchParams: Promise<{
    genre?: string;
    sortBy?: string;
    year?: string;
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Explore Movies | MovieVerse",
  description: "Browse and filter through thousands of movies by genre, rating, release date, and streaming availability.",
};

export default async function MoviesExplorePage({ searchParams }: MoviesPageProps) {
  const resolvedParams = await searchParams;
  const genre = resolvedParams.genre || "";
  const sortBy = resolvedParams.sortBy || "popularity.desc";
  const year = resolvedParams.year || "";
  const page = parseInt(resolvedParams.page || "1");

  // Fetch genres and discover movies
  const [{ genres }, response] = await Promise.all([
    getMovieGenres(),
    discoverMovies({
      page,
      sortBy,
      withGenres: genre,
      primaryReleaseDateGte: year ? `${year}-01-01` : undefined,
      primaryReleaseDateLte: year ? `${year}-12-31` : undefined,
    }),
  ]);

  const results = response?.results || [];
  const totalPages = response?.total_pages || 1;

  // Normalize results for the UI
  const normalizedMovies = results.map((m) => ({
    id: m.id,
    title: m.title || m.name || "Untitled",
    poster_path: m.poster_path || null,
    backdrop_path: m.backdrop_path || null,
    vote_average: m.vote_average || 0,
    release_date: m.release_date || m.first_air_date || "",
    genre_ids: m.genre_ids || [],
    overview: m.overview || "",
    media_type: "movie",
  }));

  // Build Pagination Links
  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (genre) params.set("genre", genre);
    if (sortBy) params.set("sortBy", sortBy);
    if (year) params.set("year", year);
    params.set("page", pageNumber.toString());
    return `/movies?${params.toString()}`;
  };

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="🎬 Explore Movies"
          subtitle="Discover your next favorite movie using filters"
        />
      </div>

      {/* Filter Toolbar */}
      <FilterToolbar
        genres={genres}
        selectedGenre={genre}
        selectedSort={sortBy}
        selectedYear={year}
        baseUrl="/movies"
      />

      {/* Movie Grid */}
      {normalizedMovies.length > 0 ? (
        <MovieGrid movies={normalizedMovies} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-5xl">🤷‍♂️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Movies Found</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            No movies match the selected filters. Try changing your genre, sorting method, or year options.
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
            Page {page} of {Math.min(totalPages, 500)} {/* TMDB limits page queries to 500 */}
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
