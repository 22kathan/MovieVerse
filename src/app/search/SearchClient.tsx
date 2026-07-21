"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SafeImage from "@/components/shared/SafeImage";
import Link from "next/link";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import { searchMulti, getImageUrl } from "@/lib/tmdb";
import { searchWithElastic } from "@/lib/elasticsearch";
import TrailerModal from "@/components/movie/TrailerModal";
import { Play, Star, ExternalLink } from "lucide-react";

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "elastic">("grid");
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<any | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    let active = true;
    async function performSearch() {
      setLoading(true);
      setErrorMsg("");
      try {
        const isStatic = window.location.hostname.includes("github.io") ||
                         window.location.port === "8000" ||
                         process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

        if (isStatic) {
          const searchData = await searchWithElastic(query.trim());
          const normalized = (searchData.results || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            media_type: item.media_type,
            poster_path: item.poster_path || null,
            vote_average: item.rating || 0,
            release_date: item.release_date || '',
            overview: item.overview || '',
            score: item.score,
            highlightedTitle: item.highlightedTitle,
            highlightedOverview: item.highlightedOverview
          }));
          if (active) {
            setResults(normalized);
          }
        } else {
          const res = await fetch(`/api/search?query=${encodeURIComponent(query.trim())}`);
          if (!res.ok) throw new Error("Failed to fetch search results.");
          const data = await res.json();
          if (active) {
            setResults(data?.results || []);
          }
        }
      } catch (e: any) {
        if (active) {
          setErrorMsg(e.message || "An error occurred while fetching search results.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    performSearch();
    return () => {
      active = false;
    };
  }, [query]);

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
      highlightedTitle: item.highlightedTitle,
      highlightedOverview: item.highlightedOverview,
      score: item.score || 1.0,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-primary)]/60 pb-5">
        <div>
          <SectionHeader
            title={query ? `🔍 Search Results` : "Search MovieVerse"}
            subtitle={query ? `Found ${movieAndTvResults.length + celebrityResults.length} results matching "${query}"` : "Enter a search term above to explore."}
          />
        </div>

        {query.trim() && movieAndTvResults.length > 0 && (
          <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-primary)] self-start sm:self-center shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[var(--brand-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode("elastic")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "elastic"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <span>⚡ Elasticsearch Matches</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--brand-primary)]"></div>
        </div>
      )}

      {!loading && query.trim() && !hasResults && !errorMsg && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-5xl">🤷‍♂️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Results Found</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            We couldn&apos;t find any movies, TV shows, or celebrities matching &quot;{query}&quot;. Try checking for typos or searching for another title.
          </p>
        </div>
      )}

      {/* Celebrities Section */}
      {!loading && celebrityResults.length > 0 && (
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
                    <SafeImage
                      src={profileUrl}
                      alt={person.name}
                      fallbackType="profile"
                      fill
                      sizes="(max-width: 640px) 120px, 180px"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
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
      {!loading && movieAndTvResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-[var(--border-primary)] pb-2 flex items-center gap-2">
            <span>🎬</span> Movies & TV Shows
            {viewMode === "elastic" && (
              <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest ml-2">
                Elasticsearch Ranked
              </span>
            )}
          </h3>
          
          {viewMode === "grid" ? (
            <MovieGrid movies={movieAndTvResults} />
          ) : (
            <div className="space-y-3 pt-2">
              {movieAndTvResults.map((movie) => {
                const posterUrl = getImageUrl(movie.poster_path, "poster", "md");
                const path = movie.media_type === "tv" ? "tv" : "movies";
                return (
                  <div key={movie.id} className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-amber-500/40 transition-all flex flex-col sm:flex-row gap-4 relative overflow-hidden group shadow-lg">
                    {/* Score badge */}
                    <div className="absolute top-3 right-3 text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg z-10">
                      RELEVANCE SCORE: {movie.score.toFixed(1)}
                    </div>
                    
                    {/* Poster */}
                    <Link href={`/${path}/${movie.id}`} className="w-20 sm:w-24 shrink-0 aspect-[2/3] relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
                      <SafeImage
                        src={posterUrl}
                        alt={movie.title}
                        fallbackType="poster"
                        fill
                        className="group-hover:scale-105 transition-transform duration-300"
                        sizes="120px"
                      />
                    </Link>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-0 sm:pr-24 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <Link href={`/${path}/${movie.id}`} className="text-base sm:text-lg font-extrabold text-white group-hover:text-amber-400 transition-colors inline-block leading-snug" dangerouslySetInnerHTML={{ __html: movie.highlightedTitle || movie.title }} />
                        
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <span className="capitalize px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                            {movie.media_type === "tv" ? "TV Series" : "Movie"}
                          </span>
                          {movie.release_date && <span>• {new Date(movie.release_date).getFullYear()}</span>}
                          {movie.vote_average > 0 && (
                            <span className="flex items-center gap-1 font-bold text-white">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {movie.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* Highlighted overview snippet */}
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3 pt-1" dangerouslySetInnerHTML={{ __html: movie.highlightedOverview || movie.overview || "Explore this title on MovieVerse." }} />
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => setActiveTrailerMovie(movie)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-black text-black" />
                          <span>Trailer</span>
                        </button>
                        <Link
                          href={`/${path}/${movie.id}`}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center gap-1 border border-white/10"
                        >
                          <span>Full Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Trailer Modal Lightbox */}
      {activeTrailerMovie && (
        <TrailerModal
          isOpen={!!activeTrailerMovie}
          onClose={() => setActiveTrailerMovie(null)}
          title={activeTrailerMovie.title}
          backdropPath={activeTrailerMovie.backdrop_path}
          movieId={activeTrailerMovie.id}
          mediaType={activeTrailerMovie.media_type === "tv" ? "tv" : "movie"}
        />
      )}
    </div>
  );
}
