"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Eye, EyeOff, Play, Plus, Check, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import SafeImage from "@/components/shared/SafeImage";
import TrailerModal from "./TrailerModal";
import { isWatched, toggleWatched, inWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/storage";

interface Top10Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count?: number;
  release_date?: string;
  runtime?: string;
  certification?: string;
  overview?: string;
  media_type?: string;
  genre_ids?: number[];
}

interface Top10SectionProps {
  movies: Top10Movie[];
}

export default function Top10Section({ movies }: Top10SectionProps) {
  const [watchedIds, setWatchedIds] = useState<number[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Top10Movie | null>(null);

  // Sync watchlist & watched states
  useEffect(() => {
    const updateStates = () => {
      if (typeof window !== "undefined") {
        setWatchedIds(movies.filter((m) => isWatched(m.id)).map((m) => m.id));
        setWatchlistIds(movies.filter((m) => inWatchlist(m.id)).map((m) => m.id));
      }
    };
    updateStates();

    window.addEventListener("watched-updated", updateStates);
    window.addEventListener("watchlist-updated", updateStates);
    return () => {
      window.removeEventListener("watched-updated", updateStates);
      window.removeEventListener("watchlist-updated", updateStates);
    };
  }, [movies]);

  const handleToggleWatched = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatched(id);
  };

  const handleToggleWatchlist = (e: React.MouseEvent, movie: Top10Movie) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist(movie.id)) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || "",
        media_type: (movie.media_type as "movie" | "tv") || "movie",
      });
    }
  };

  const top3 = movies.slice(0, 3);
  const ranks4to10 = movies.slice(3, 10);

  return (
    <section className="space-y-6">
      {/* IMDb Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-1.5 group cursor-pointer">
            <span>Top 10 on IMDb this week</span>
            <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </h2>
        </div>
      </div>

      {/* Top 1 to 3 Featured Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-5">
        {top3.map((movie, index) => {
          const rank = index + 1;
          const posterUrl = getImageUrl(movie.poster_path, "poster", "md");
          const year = movie.release_date ? new Date(movie.release_date).getFullYear() : "2026";
          const voteCount = movie.vote_count ? `${Math.round(movie.vote_count / 1000)}K` : "142K";
          const isMovieWatched = watchedIds.includes(movie.id);
          const isMovieSaved = watchlistIds.includes(movie.id);

          return (
            <div
              key={movie.id}
              className="group relative flex flex-col sm:flex-row bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all duration-300 shadow-xl"
            >
              {/* Poster Column */}
              <div className="relative w-full sm:w-2/5 aspect-[2/3] shrink-0 bg-black/40 overflow-hidden">
                <SafeImage
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* IMDb Rank Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black text-xs shadow-lg shadow-black/50 z-10">
                  #{rank}
                </div>

                {/* Watchlist Toggle */}
                <button
                  onClick={(e) => handleToggleWatchlist(e, movie)}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-xl backdrop-blur-md flex items-center justify-center border transition-all z-10 ${
                    isMovieSaved
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-black/60 text-white border-white/20 hover:bg-amber-500 hover:text-black"
                  }`}
                  title={isMovieSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  {isMovieSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Info Column */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--text-tertiary)]">
                    <span>{year}</span>
                    <span>•</span>
                    <span>{movie.runtime || "2h 15m"}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
                      {movie.certification || "PG-13"}
                    </span>
                  </div>

                  <Link href={`/movies/${movie.id}`}>
                    <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                      {movie.title}
                    </h3>
                  </Link>

                  {/* Rating & Rate Line */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 font-bold text-white">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{movie.vote_average.toFixed(1)}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-normal">
                        ({voteCount})
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleToggleWatched(e, movie.id)}
                      className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                        isMovieWatched ? "text-emerald-400" : "text-sky-400 hover:text-sky-300"
                      }`}
                    >
                      {isMovieWatched ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Watched</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mark watched</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                    {movie.overview ||
                      "Explore this acclaimed masterpiece featured on IMDb's top charts this week."}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTrailerMovie(movie)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-amber-500 hover:text-black text-amber-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Trailer</span>
                  </button>
                  <Link
                    href={`/movies/${movie.id}`}
                    className="px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] hover:bg-white/10 text-white font-semibold text-xs transition-all border border-white/5"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranks 4 to 10 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {ranks4to10.map((movie, index) => {
          const rank = index + 4;
          const posterUrl = getImageUrl(movie.poster_path, "poster", "md");

          return (
            <div
              key={movie.id}
              className="group relative rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-amber-500/40 transition-all duration-300 shadow-md flex flex-col"
            >
              <div className="relative aspect-[2/3] w-full bg-black/40 overflow-hidden">
                <SafeImage
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-black font-extrabold text-xs shadow-md">
                  #{rank}
                </div>
              </div>

              <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-white mb-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </div>
                  <h4 className="font-bold text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                    {movie.title}
                  </h4>
                </div>

                <button
                  onClick={() => setActiveTrailerMovie(movie)}
                  className="w-full mt-2 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-amber-400 text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-white/10"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Trailer</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reusable Trailer Modal */}
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
    </section>
  );
}
