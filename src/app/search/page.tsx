import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import { searchMulti, getImageUrl } from "@/lib/tmdb";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  return {
    title: query ? `Search results for "${query}" | MovieVerse` : "Search | MovieVerse",
    description: `Browse movies, TV shows, and actors matching "${query}" on MovieVerse.`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  let results: any[] = [];
  let errorMsg = "";

  if (query.trim()) {
    try {
      const response = await searchMulti(query.trim());
      results = response?.results || [];
    } catch (e: any) {
      errorMsg = e.message || "An error occurred while fetching search results.";
    }
  }

  // Normalize results for the UI
  const movieAndTvResults = results
    .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
    .map((item: any) => ({
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

  const celebrityResults = results
    .filter((item: any) => item.media_type === "person")
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      profile_path: item.profile_path || null,
      known_for_department: item.known_for_department || "Acting",
    }));

  const hasResults = movieAndTvResults.length > 0 || celebrityResults.length > 0;

  return (
    <div className="px-6 py-8 space-y-12 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title={query ? `🔍 Search Results` : "Search MovieVerse"}
          subtitle={query ? `Found ${movieAndTvResults.length + celebrityResults.length} results matching "${query}"` : "Enter a search term above to explore."}
        />
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {query.trim() && !hasResults && !errorMsg && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-5xl">🤷‍♂️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Results Found</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            We couldn&apos;t find any movies, TV shows, or celebrities matching &quot;{query}&quot;. Try checking for typos or searching for another title.
          </p>
        </div>
      )}

      {/* Celebrities Section */}
      {celebrityResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-[var(--border-primary)] pb-2">🎭 Matched Celebrities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {celebrityResults.map((person) => {
              const profileUrl = getImageUrl(person.profile_path, "profile", "md");
              return (
                <Link
                  key={person.id}
                  href={`/celebrities/${person.id}`}
                  className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl overflow-hidden group hover:border-[var(--border-secondary)] transition-all flex flex-col"
                >
                  <div className="aspect-square relative bg-[#121824] shrink-0">
                    {profileUrl ? (
                      <Image
                        src={profileUrl}
                        alt={person.name}
                        fill
                        sizes="(max-width: 640px) 120px, 180px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl opacity-40">👤</div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-[var(--brand-primary-light)] transition-colors">{person.name}</h4>
                    <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-wider mt-1">{person.known_for_department}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Movies and TV Shows Section */}
      {movieAndTvResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-[var(--border-primary)] pb-2">🎬 Movies & TV Shows</h3>
          <MovieGrid movies={movieAndTvResults} />
        </div>
      )}
    </div>
  );
}
